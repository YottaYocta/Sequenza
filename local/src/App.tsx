import { useEffect, useRef, useState } from 'react';
import type { Shader, Uniforms } from './renderer';
import { io } from 'socket.io-client';

import '@xyflow/react/dist/style.css';
import { Editor } from './Editor';

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

	return (
		<main className="">
			<div className="w-full min-h-screen h-screen border">
				<Editor shaders={[...Object.values(shaderMap)]}></Editor>
			</div>
		</main>
	);
}

export default App;
