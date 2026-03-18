import { useEffect, useMemo, useRef, useState } from "react";
import type { Shader, Uniforms } from "@sequenza/lib";
import { io } from "socket.io-client";
import { staticShaders } from "./shaders";

const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === "true";

import "@xyflow/react/dist/style.css";
import { Editor } from "./components/Editor";
import type { Edge, Node } from "@xyflow/react";
import type { ShaderNode } from "./components/ShaderNode";
import {
  extractFields,
  typeMatchesField,
  getFieldDefault,
} from "@sequenza/lib";

/**
 * a single node type; shaders
 * data/props: shader, patch (for renderer), uniforms, handle uniform update
 *
 */

function App() {
  // maps filepath to shader
  const [shaderMap, setShaderMap] = useState<Record<string, Shader>>({});
  const shaderUniforms = useRef<Record<string, Uniforms>>({});

  useEffect(() => {
    if (STATIC_MODE) {
      const newShaders: Record<string, Shader> = {};
      for (const [filepath, source] of Object.entries(staticShaders)) {
        newShaders[filepath] = {
          id: filepath,
          source,
          name: filepath,
          resolution: { width: 100, height: 100 },
        };
        shaderUniforms.current[filepath] = {};
      }
      setShaderMap(newShaders);
      return;
    }

    console.log("[CONNECT]");
    const socket = io("http://localhost:3001");
    socket.on("shaders-found", (data: Record<string, string>) => {
      const newShaders: Record<string, Shader> = {};
      for (const [filepath, name] of Object.entries(data)) {
        newShaders[filepath] = {
          id: filepath,
          source: name,
          name: filepath,
          resolution: { width: 100, height: 100 },
        };
        shaderUniforms.current[filepath] = {};
      }
      setShaderMap(newShaders);
    });
    return () => {
      console.log("[DISCONNECT]");
      socket.disconnect();
    };
  }, []);

  const initialState = useMemo(() => {
    try {
      const nodes: Node[] = JSON.parse(
        localStorage.getItem("sequenza-nodes") ?? "[]",
      );
      let edges: Edge[] = JSON.parse(
        localStorage.getItem("sequenza-edges") ?? "[]",
      );
      const uniforms: Record<string, Uniforms> = JSON.parse(
        localStorage.getItem("sequenza-uniforms") ?? "{}",
      );

      for (const node of nodes) {
        if (node.type === "shader") {
          const shaderNode = node as ShaderNode;
          const libraryShader = shaderMap[shaderNode.data.shader.name];

          if (
            libraryShader &&
            shaderNode.data.shader.source !== libraryShader?.source
          ) {
            // update shader, keep id because that's used for matching uniforms => shaders
            const newShader = {
              ...libraryShader,
              id: shaderNode.data.shader.id,
            };
            shaderNode.data.shader = newShader;
            console.log(shaderNode.data.shader.id);
          }
        }
      }

      const existingNodeIds = new Set(nodes.map((n) => n.id));
      for (const key of Object.keys(uniforms)) {
        if (!existingNodeIds.has(key)) delete uniforms[key];
      }

      for (const node of nodes) {
        if (node.type !== "shader") continue;
        const shaderNode = node as ShaderNode;
        const nodeUniforms = uniforms[shaderNode.id];
        if (!nodeUniforms) continue;

        const fields = extractFields(shaderNode.data.shader);
        const cleaned: Uniforms = {};
        for (const field of fields) {
          if (field.type === "sampler2D" && field.source === "input") continue;
          const value = nodeUniforms[field.name];
          if (value !== undefined && typeMatchesField(value, field)) {
            cleaned[field.name] = value;
          } else {
            const def = getFieldDefault(field);
            if (def !== undefined) cleaned[field.name] = def;
          }
        }
        uniforms[shaderNode.id] = cleaned;
      }

      edges = edges.filter((edge) => {
        const sourceNode = nodes.find((node) => node.id === edge.source);
        const targetNode = nodes.find((node) => node.id === edge.target);
        const targetHandle = edge.targetHandle;
        if (!targetNode || (targetNode && targetNode.type !== "shader"))
          return false;
        const targetShaderNode = targetNode as ShaderNode;
        const targetFields = extractFields(targetShaderNode.data.shader);
        if (
          !sourceNode ||
          targetHandle === null ||
          targetHandle === undefined ||
          targetFields.find(
            (field) =>
              field.name === targetHandle && field.type === "sampler2D",
          ) === undefined
        )
          return false;
        else return true;
      });

      if (nodes !== null && edges !== null && uniforms !== null)
        return { nodes, edges, uniforms };
    } catch (e) {
      console.error(e);
    }
    return undefined;
  }, [shaderMap]);

  const shadersReady = Object.keys(shaderMap).length > 0;

  return (
    <main className="">
      <div className="w-full min-h-screen h-screen ">
        {shadersReady && (
          <Editor
            shaders={[...Object.values(shaderMap)]}
            initialState={initialState}
            initialShowStats={
              localStorage.getItem("sequenza-show-stats") === "true"
            }
            initialShaderPanelOpen={
              localStorage.getItem("sequenza-shader-panel-open") !== "false"
            }
            initialOpenPreviewNodeId={
              localStorage.getItem("sequenza-open-preview-node") || null
            }
            onEditorStateChange={({ showStats, shaderPanelOpen }) => {
              localStorage.setItem(
                "sequenza-show-stats",
                String(showStats),
              );
              localStorage.setItem(
                "sequenza-shader-panel-open",
                String(shaderPanelOpen),
              );
            }}
            onOpenPreviewNodeIdChange={(nodeId) => {
              if (nodeId) {
                localStorage.setItem("sequenza-open-preview-node", nodeId);
              } else {
                localStorage.removeItem("sequenza-open-preview-node");
              }
            }}
            handleSave={({ nodes, edges, uniforms }) => {
              localStorage.setItem("sequenza-nodes", JSON.stringify(nodes));
              localStorage.setItem("sequenza-edges", JSON.stringify(edges));
              localStorage.setItem(
                "sequenza-uniforms",
                JSON.stringify(uniforms),
              );
            }}
          ></Editor>
        )}
      </div>
    </main>
  );
}

export default App;
