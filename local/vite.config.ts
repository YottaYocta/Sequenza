import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		{
			name: 'sequenza-dev-app',
			configureServer(server) {
				const watcher = server.watcher;
				watcher.add('**/*.frag');
				watcher.on('change', (path) => {
					const source = readFileSync(path, 'utf-8');
					server.ws.send({ type: 'custom', event: 'shader-updated', data: { path, source } });
				});
			}
		}
	]
});
