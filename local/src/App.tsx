import { useEffect, useRef, useState } from 'react';
import type { Shader, Uniforms } from './renderer';
import { io } from 'socket.io-client';
import { RendererComponent } from './RendererComponent';
import UniformForm from './UniformForm';

function App() {
	const [shaderMap, setShaderMap] = useState<Record<string, Shader>>({});
	const uniformMapRef = useRef<Record<string, Uniforms>>({});

	useEffect(() => {
		console.log('[CONNECT]');
		const socket = io('http://localhost:3001');
		socket.on('shaders-found', (data: Record<string, string>) => {
			setShaderMap(data);
		});
		() => {
			console.log('[DISCONNECT]');
			socket.disconnect();
		};
	}, []);

	const RES = 300;

	return (
		<main className="">
			{Object.entries(shaderMap).map(([filepath, source]) => {
				return (
					<div className="flex gap-4 items-start" key={filepath}>
						<p className="font-bold w-32">{filepath}</p>
						<div className="flex flex-col gap-2">
							<p className="text-xs w-96 line-clamp-5 border">{source}</p>
							<UniformForm shader={source} handleUpdateUniform={() => {}}></UniformForm>
						</div>
						<RendererComponent
							width={RES}
							height={RES}
							patch={{ shaders: [source], connections: [] }}
							uniforms={{
								current: [
									{
										uResolution: [RES, RES]
									}
								]
							}}
						></RendererComponent>
					</div>
				);
			})}
		</main>
	);
}

export default App;
