import { useState } from 'react';
import type { Shader } from './renderer';

function App() {
	const [shaderMap, setShaderMap] = useState<Record<string, Shader>>({});

	import.meta.hot?.on('shaders-found', (payload) => {
		console.log('found: ', payload);
		setShaderMap(payload);
	});

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
