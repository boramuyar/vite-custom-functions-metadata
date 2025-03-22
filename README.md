# vite-plugin-custom-functions-metadata

A Vite plugin for generating and injecting Custom Functions metadata for Office Add-ins.

## Installation

```bash
npm install --save-dev vite-plugin-custom-functions-metadata
# or
yarn add -D vite-plugin-custom-functions-metadata
# or
pnpm add -D vite-plugin-custom-functions-metadata
```

## Usage

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import customFunctionsMetadataPlugin from "vite-plugin-custom-functions-metadata";

export default defineConfig({
  plugins: [
    customFunctionsMetadataPlugin({
      input: "./src/functions.ts", // Path to your functions file (or array of files)
      output: "assets/functions.json", // Output path for the metadata JSON
    }),
  ],
});
```

### Options

| Option    | Type                   | Description                              |
| --------- | ---------------------- | ---------------------------------------- |
| `input`   | `string` or `string[]` | Path(s) to your function source file(s)  |
| `output`  | `string`               | Output path for the metadata JSON file   |
| `verbose` | `boolean`              | Enable detailed logging (default: false) |

## Features

- Generates metadata JSON for Custom Functions
- Automatically adds `CustomFunctions.associate()` calls to your source files
- Works in both development and production modes
- Creates and serves metadata file during development

## Requirements

This plugin has the following peer dependencies:

- `vite` (>= 2.0.0)
- `custom-functions-metadata` (>= 1.0.0)

## License

MIT
