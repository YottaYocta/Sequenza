import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { useContext, useState } from "react";
import { Dialog } from "./Dialog";
import { EditorContext } from "./EditorContext";

export default function CustomEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  id,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { shaders, handleInsertShader } = useContext(EditorContext);
  const [showAddShadersModal, setShowModal] = useState(false);

  const onEdgeClick = () => {
    setShowModal(true);
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="absolute -translate-1/2 origin-center pointer-events-auto"
          style={{
            transform: `translate(${labelX}px,${labelY}px)`,
          }}
        >
          <button
            className="w-6 h-6 bg-neutral-200  rounded-full active:bg-neutral-200 z-10 flex items-center justify-center"
            onClick={() => onEdgeClick()}
          >
            +
          </button>
          <Dialog
            open={showAddShadersModal}
            handleOpenChange={(open) => {
              setShowModal(open);
            }}
          >
            <div className="w-full h-full flex flex-col p-4">
              <div className="w-full flex justify-between">
                <p>Add a Shader</p>
                <button
                  className="button-base"
                  onClick={() => {
                    setShowModal(false);
                  }}
                >
                  Close
                </button>
              </div>
              <div className="w-full flex flex-col">
                {shaders.map((shader) => (
                  <button
                    key={shader.id}
                    className="text-xs flex justify-start p-1 rounded-sm hover:bg-neutral-100 cursor-pointer text-neutral-500"
                    onClick={() => {
                      handleInsertShader(shader, id);
                    }}
                  >
                    {shader.id}
                  </button>
                ))}
              </div>
            </div>
          </Dialog>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
