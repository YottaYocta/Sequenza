import { useEffect, useState } from 'react';
import type { Shader } from './renderer';
import { io } from 'socket.io-client';
import { RendererComponent } from './RendererComponent';

function App() {
	const [shaderMap, setShaderMap] = useState<Record<string, Shader>>({});

	useEffect(() => {
		console.log('[CONNECT]');
		const socket = io('http://localhost:3001');
		socket.on('shaders-found', (data: Record<string, string>) => {
			console.log('data received: ', data);
			setShaderMap(data);
		});
		() => {
			console.log('[DISCONNECT]');
			socket.disconnect();
		};
	}, []);

	return (
		<main className="">
			{Object.entries(shaderMap).map(([filepath, source]) => {
				return (
					<div className="flex gap-4">
						<p className="font-bold">{filepath}</p>
						<p className="text-xs w-96 line-clamp-5 border">{source}</p>
						<RendererComponent
							patch={{ shaders: [source], connections: [] }}
							uniforms={{
								current: [
									{
										uResolution: [100, 100]
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
