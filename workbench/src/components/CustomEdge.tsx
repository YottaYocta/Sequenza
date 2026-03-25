import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { useContext, useState } from "react";
import { AddShaderDialog } from "./AddShaderDialog";
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
            onClick={() => setShowModal(true)}
          >
            +
          </button>
          <AddShaderDialog
            open={showAddShadersModal}
            handleOpenChange={setShowModal}
            shaders={shaders}
            handleAddShader={(shader) => handleInsertShader(shader, id)}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
