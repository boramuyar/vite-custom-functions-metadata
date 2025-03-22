import { Plugin, ResolvedConfig } from "vite";
import { generateCustomFunctionsMetadata, IGenerateResult, IAssociate } from "custom-functions-metadata";
import path from "path";
import fs from "fs/promises";

interface CustomFunctionsPluginOptions {
  input: string | string[];
  output: string;
}

class CustomFunctionsMetadataPlugin {
  public static generateResults: Record<string, IGenerateResult> = {};
}

export default function customFunctionsMetadataPlugin(options: CustomFunctionsPluginOptions): Plugin {
  let config: ResolvedConfig;
  let resolvedInputFiles: string[] = [];
  let generateResult: IGenerateResult;

  return {
    name: "vite:custom-functions-metadata",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      // Resolve input files to absolute paths
      resolvedInputFiles = Array.isArray(options.input) ? options.input.map((file) => path.resolve(file)) : [path.resolve(options.input)];
    },

    async buildStart() {
      try {
        // Generate metadata before the build starts
        generateResult = await generateCustomFunctionsMetadata(resolvedInputFiles, true);

        if (generateResult.errors.length > 0) {
          generateResult.errors.forEach((err) => {
            this.error(new Error(`${options.input} ${err}`));
          });
        } else {
          // Store the result for use in the transform hook
          CustomFunctionsMetadataPlugin.generateResults[Array.isArray(options.input) ? options.input[0] : options.input] = generateResult;
        }
      } catch (error) {
        this.error(new Error(`Failed to generate metadata: ${(error as Error).message}`));
      }
    },

    async transform(code, id) {
      // Check if the current file is one of our input files
      const foundInputFile = resolvedInputFiles.find((file) => id.endsWith(file));
      if (!foundInputFile) {
        return null; // Not one of our target files, return null to skip transformation
      }

      // Get the original input option as a string for the lookup key
      const inputKey = Array.isArray(options.input) ? options.input[0] : options.input;

      if (!CustomFunctionsMetadataPlugin.generateResults[inputKey]) {
        return code; // No results found, return unchanged code
      }

      // Find associations for this file
      const associations = CustomFunctionsMetadataPlugin.generateResults[inputKey].associate.filter(
        (item: IAssociate) => item.sourceFileName === foundInputFile
      );

      // Add associations to the end of the file
      let transformedCode = code;
      associations.forEach((item: IAssociate) => {
        transformedCode += `\nCustomFunctions.associate("${item.id}", ${item.functionName});`;
      });

      return transformedCode;
    },

    async writeBundle() {
      // Write the metadata JSON file during the bundle phase (for production builds)
      if (generateResult && !generateResult.errors.length) {
        const outputPath = path.resolve(config.build.outDir, options.output);
        try {
          // Ensure the directory exists
          await fs.mkdir(path.dirname(outputPath), { recursive: true });
          // Write the metadata file
          await fs.writeFile(outputPath, generateResult.metadataJson);
        } catch (error) {
          this.error(`Failed to write metadata file: ${(error as Error).message}`);
        }
      }
    },

    configureServer(server) {
      // For development mode: ensure metadata file is created when dev server starts
      return () => {
        server.middlewares.use(async (req, res, next) => {
          // Only do this once when server starts
          if (generateResult && !generateResult.errors.length && req.url?.endsWith(options.output)) {
            const outputPath = path.resolve(server.config.root, options.output);
            try {
              // Ensure the directory exists
              await fs.mkdir(path.dirname(outputPath), { recursive: true });
              // Write the metadata file
              await fs.writeFile(outputPath, generateResult.metadataJson);
              // Serve the file directly
              res.setHeader("Content-Type", "application/json");
              res.end(generateResult.metadataJson);
              return;
            } catch (error) {
              console.error(`Failed to write metadata file: ${(error as Error).message}`);
            }
          }
          next();
        });
      };
    },
  };
}
