import { useEffect, useState } from 'react';
import type { Shader } from './renderer';
import { io } from 'socket.io-client';

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
		<main>
			{Object.entries(shaderMap).map(([filepath, source]) => {
				return (
					<div className="flex gap-2">
						<p>{filepath}</p>
						<p>{source}</p>
					</div>
				);
			})}
		</main>
	);
}

export default App;
