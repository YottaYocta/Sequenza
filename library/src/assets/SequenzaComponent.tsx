import { RendererComponent, type Uniforms, type Patch } from '@yottayocta/sequenza';
import '@yottayocta/sequenza/style.css';
import { useRef } from 'react';

function SequenzaComponent() {
	const uniformRef = useRef<Record<string, Uniforms>>(getInitialUniforms());

	return (
		<RendererComponent
			patch={getPatch()}
			uniforms={uniformRef}
			animate={true}
			width={100}
			height={100}
		></RendererComponent>
	);
}

export default SequenzaComponent;

function getInitialUniforms(): Record<string, Uniforms> {
	throw new Error('placeholder for initial uniforms');
}

function getPatch(): Patch {
	throw new Error('placeholder for patch');
}
