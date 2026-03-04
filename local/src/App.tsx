import { useEffect, useRef, useState } from 'react';
import type { Shader, Uniforms } from './renderer';
import { io } from 'socket.io-client';
import { RendererComponent } from './RendererComponent';

import '@xyflow/react/dist/style.css';
import { Editor } from './Editor';
import UniformForm from './UniformForm';

/**
 * a single node type; shaders
 * data/props: shader, patch (for renderer), uniforms, handle uniform update
 *
 */

function App() {
	const [shaderMap, setShaderMap] = useState<Record<string, Shader>>({});
	const shaderUniforms = useRef<Record<string, Uniforms>>({});

	useEffect(() => {
		console.log('[CONNECT]');
		const socket = io('http://localhost:3001');
		socket.on('shaders-found', (data: Record<string, string>) => {
			const newShaders: Record<string, Shader> = {};
			for (const [filepath, name] of Object.entries(data)) {
				newShaders[filepath] = { id: filepath, source: name };
				shaderUniforms.current[filepath] = {};
			}
			setShaderMap(newShaders);
		});
		() => {
			console.log('[DISCONNECT]');
			socket.disconnect();
		};
	}, []);

	const RES = 300;

	return (
		<main className="">
			<div className="w-full h-200 border">
				<Editor shaders={[...Object.values(shaderMap)]}></Editor>
			</div>
			{Object.entries(shaderMap).map(([filepath, source]) => {
				return (
					<div className="flex gap-4 items-start" key={filepath}>
						<p className="font-bold w-32">{filepath}</p>
						<UniformForm
							shader={source}
							handleUpdateUniform={(newUniforms) => {
								shaderUniforms.current[source.id] = newUniforms;
							}}
						></UniformForm>
						<RendererComponent
							width={RES}
							height={RES}
							patch={{ shaders: [source], connections: [] }}
							uniforms={shaderUniforms}
						></RendererComponent>
					</div>
				);
			})}
		</main>
	);
}

export default App;
