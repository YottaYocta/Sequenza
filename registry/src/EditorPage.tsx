import { Editor, staticShaders } from "@sequenza/workbench";
import "@xyflow/react/dist/style.css";
import "@sequenza/workbench/style.css";
import type { Shader } from "@sequenza/lib";
import { useInitialState } from "./context/InitialStateContext";
import { useNavigate } from "react-router";

const shaders: Shader[] = Object.entries(staticShaders).map(
  ([key, val]): Shader => ({
    id: key,
    name: key,
    source: val,
    resolution: { width: 100, height: 100 },
  }),
);

export default function EditorPage() {
  const { initialState } = useInitialState();
  const navigate = useNavigate();

  return (
    <div className="w-screen h-screen">
      <div className="w-full h-full overflow-clip relative">
        <button
          className="top-4 left-4 button-base absolute z-10"
          onClick={() => navigate("/")}
        >
          Close
        </button>
        <Editor
          shaders={shaders}
          initialState={initialState}
          handleSave={() => {}}
          initialShowStats={
            localStorage.getItem("registry-show-stats") === "true"
          }
          onEditorStateChange={({ showStats }) => {
            localStorage.setItem("registry-show-stats", String(showStats));
          }}
          className="rounded-md"
        />
      </div>
    </div>
  );
}
