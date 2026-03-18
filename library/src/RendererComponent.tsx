"use client";
import {
  forwardRef,
  type CSSProperties,
  type RefObject,
  useEffect,
  useRef,
} from "react";
import { type Patch, Renderer, type Uniforms } from "./renderer";
import "./index.css";

interface RendererComponentProps {
  patch: Patch;
  uniforms: RefObject<Record<string, Uniforms>>;
  className?: string;
  style?: CSSProperties;
  width?: number;
  height?: number;
  animate?: boolean;
  onError?: (error: { message: string; line: number; shaderName: string } | null) => void;
}

export const RendererComponent = forwardRef<
  HTMLCanvasElement,
  RendererComponentProps
>(
  (
    { patch, uniforms, className, style, width = 100, height = 100, animate, onError },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      if (canvasRef.current) {
        const context = canvasRef.current.getContext("webgl2", {
          preserveDrawingBuffer: true,
        })!;
        const renderer = new Renderer(context, patch);
        onError?.(renderer.error);

        let animationFrameId: number | null = null;

        const render = () => {
          renderer.uniforms = uniforms.current;
          renderer.render();
        };

        if (animate) {
          animationFrameId = requestAnimationFrame(function renderLoop() {
            render();
            animationFrameId = requestAnimationFrame(renderLoop);
          });
        } else {
          renderer.onTextureLoaded = render;
          render();
        }

        return () => {
          if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
          }

          renderer.dispose();
        };
      }
    }, [patch, width, height, animate]);

    return (
      <canvas
        className={`image-crisp ${className ?? ""}`}
        style={style}
        width={width}
        height={height}
        ref={(el) => {
          canvasRef.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
      ></canvas>
    );
  },
);
