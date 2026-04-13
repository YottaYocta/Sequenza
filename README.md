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

---

## Integration Prompts

### Using an export from the editor

Paste this into your AI assistant after copying the generated component from the editor's **Export** panel:

```
I have a Sequenza shader export — a self-contained React component that renders
a GLSL shader composition using @sequenza/lib. Here it is:

<paste exported component here>

Please integrate this into my project. It accepts no props and renders the shader
full-width inside whatever container it's placed in. The `animate` prop drives a requestAnimationFrame loop for
shaders that use a time uniform. Let me know if you need anything else.
```

### Minimal setup with local shader files

Use this when you want to wire up `.frag` files directly without going through the editor:

```
I want to render a GLSL fragment shader using @sequenza/lib. Install it with:

  pnpm add @sequenza/lib

The core types are:

  type Shader = {
    id: string;
    name: string;
    source: string;              // raw GLSL source as a string
    resolution: { width: number; height: number };
  };

  type Patch = {
    shaders: Shader[];
    connections: Connection[];  // [] for a single shader with no inputs
  };

  type Connection = { from: string; to: string; input: string };

Import the shader source as a string (e.g. `import src from "./my.frag?raw"` in
Vite), construct a Patch, and render:

  import { RendererComponent } from "@sequenza/lib";
  import "@sequenza/lib/style.css";
  import { useRef } from "react";
  import fragSrc from "./my.frag?raw";

  const patch = {
    shaders: [{ id: "main", name: "main", source: fragSrc, resolution: { width: 800, height: 600 } }],
    connections: [],
  };

  export default function MyShader() {
    const uniforms = useRef({});
    return <RendererComponent patch={patch} uniforms={uniforms} animate />;
  }

The `uniforms` ref maps shader id → { [uniformName]: value }. Update it
imperatively (no re-render needed) if I specify values later. Otherwise, leave it empty, as it will be filled by default. The `animate` prop runs a rAF loop.
Please set this up using my shader file(s) and wire up any uniforms I need.
```

### Set up a local shader dev environment

Use this to have an agent scaffold a new shader file and get the dev server running:

```
I want to create a new GLSL shader and
iterate on it with the sequenza visual editor. Here's what needs to happen:

1. Create a new file within a local asset dir named `<name>.frag` with this boilerplate:

   #version 300 es
   precision mediump float;

   uniform vec2 u_resolution; // resolution
   uniform float u_time;      // time

   in vec2 vUv;
   out vec4 fragColor;

   void main() {
     fragColor = vec4(vUv, 0.5 + 0.5 * sin(u_time), 1.0);
   }

2. Start the dev server. use the command `pnpx @sequenza/workbench dev` at the root of the directory. This starts a dev server that automatically watches and exposes any local shader files recursively.

The shader will appear in the editor sidebar under the name I give it. I can then
build the graph visually and tune uniforms live.

Prompt the user for the name of the file they want to create and if it should contain anything. The editor automatically detects uniform configs using comments, so take care to add these when generating:

// float
// uniform float var; → plain float, no control (default 0)
// uniform float var; // [min, max, def] → scrubber with range and default
// uniform float var; // time → driven by elapsed seconds (no control)
//
// vec2
// uniform vec2 var; → plain vec2, no control (default [0,0])
// uniform vec2 var; // [x, y] → vec2 with default values
// uniform vec2 var; // mouse → driven by normalized mouse position (no control)
// uniform vec2 var; // resolution → driven by canvas size (no control)
//
// vec3
// uniform vec3 var; → plain vec3, no control (default [0,0,0])
// uniform vec3 var; // [x, y, z] → vec3 with default values
// uniform vec3 var; // color → color picker (default [1,1,1])
// uniform vec3 var; // color [r, g, b] → color picker with default
//
// vec4
// uniform vec4 var; → plain vec4, no control (default [0,0,0,0])
// uniform vec4 var; // [x, y, z, w] → vec4 with default values
// uniform vec4 var; // color → color picker (default [1,1,1,1])
// uniform vec4 var; // color [r, g, b, a] → color picker with default
//
// sampler2D
// uniform sampler2D var; → expects a node input connection
// uniform sampler2D var; // texture → expects a texture asset
// uniform sampler2D var; // gradient → expects a gradient asset


```

## Archive

The initial version of the app has now been moved to `/old`
