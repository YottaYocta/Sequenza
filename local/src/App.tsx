import { useState } from 'react';
import type { Shader } from './renderer';

function App() {
	const [shaderMap, setShaderMap] = useState<Record<string, Shader>>({});

	import.meta.hot?.on('shader-updated', (payload) => {
		setShaderMap((prev) => {
			return {
				...prev,
				[payload.path]: payload.source
			};
		});
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
