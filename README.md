# Sequenza

A node-based GLSL shader composition editor. Build fragment shader chains in a visual graph, tune uniforms interactively, and export the result as a self-contained React component.

## Packages

| Package                              | Description                                       |
| ------------------------------------ | ------------------------------------------------- |
| `library/` (`@sequenza/lib`)         | WebGL2 rendering engine and React component       |
| `workbench/` (`@sequenza/workbench`) | Visual editor app and embeddable Editor component |
| `registry/`                          | Website                                           |

## Getting Started

Requires [pnpm](https://pnpm.io).

```bash
git clone <repo>
cd Sequenza
pnpm install
```

### Running the Workbench

The editor requires two processes: a Vite dev server and a file watcher that hot-reloads `.frag` shader files.

```bash
pnpm run build:app
./bin/sequenza.js dev
```

Or alternatively for local dev:

```bash
cd workbench
pnpm dev    # editor -> http://localhost:5173
pnpm watch  # file server/watcher -> :3001
```

Any `.frag` files in running directory will appear in editor

### Building Library

```bash
cd library
pnpm build  # outputs to library/dist/
```

### Building the Workbench

```bash
cd workbench
pnpm build        # library build -> workbench/dist/
pnpm build:app    # standalone app build
```

## Using `@sequenza/lib`

```bash
pnpm add @sequenza/lib
```

```tsx
import { RendererComponent } from "@sequenza/lib";
import "@sequenza/lib/style.css";

<RendererComponent patch={patch} uniforms={uniformsRef} animate />;
```

The export button in the editor generates a complete ready-to-paste component with the patch and uniforms embedded.

## Archive

The initial version of the app has now been moved to `/old`
