'use client';
import { type FC, type RefObject, useEffect, useRef } from 'react';
import { type Patch, Renderer, type Uniforms } from './renderer';

interface RendererComponentProps {
	patch: Patch;
	uniforms: RefObject<Uniforms[]>;
	className: string;
	width: number;
	height: number;
	animate: boolean;
}

export const RendererComponent: FC<RendererComponentProps> = ({
	patch,
	uniforms,
	className,
	width,
	height,
	animate
}) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		if (canvasRef.current) {
			const context = canvasRef.current.getContext('webgl2')!;
			const renderer = new Renderer(context, patch);

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

	return <canvas className={className} width={width} height={height} ref={canvasRef}></canvas>;
};
