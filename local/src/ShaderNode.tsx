import type { Node, NodeProps } from '@xyflow/react';
import type { Patch, Shader, Uniforms } from './renderer';
import type { RefObject } from 'react';
import UniformForm from './UniformForm';
import { RendererComponent } from './RendererComponent';

type ShaderNodeData = {
	shader: Shader;
	patch: Patch;
	uniforms: RefObject<Record<string, Uniforms>>;
	handleUpdateUnforms: (newUniforms: Uniforms) => void;
};
export type ShaderNode = Node<ShaderNodeData, 'shader'>;
export const ShaderNode = ({ data }: NodeProps<ShaderNode>) => {
	return (
		<div className="flex gap-2 bg-white border p-4">
			<div>
				<UniformForm
					shader={data.shader}
					handleUpdateUniform={(newUniforms) => {
						data.handleUpdateUnforms(newUniforms);
					}}
				></UniformForm>
			</div>
			<div className="flex justify-center items-center ">
				<RendererComponent
					animate
					width={200}
					height={200}
					patch={data.patch}
					uniforms={data.uniforms}
				></RendererComponent>
			</div>
		</div>
	);
};
