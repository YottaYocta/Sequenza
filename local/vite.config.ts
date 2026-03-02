import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { glob, globSync, readdirSync, readFileSync } from 'fs';
import tailwindcss from '@tailwindcss/vite';
import { join } from 'path';

const findFragFiles = (dir: string): string[] => {
	const results: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === 'node_modules') continue;
		const full = join(dir, entry.name);
		if (entry.isDirectory()) results.push(...findFragFiles(full));
		else if (entry.name.endsWith('.frag')) results.push(full);
	}
	return results;
};

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		{
			name: 'sequenza-dev-app',
			configureServer(server) {
				const sendAllFrags = () => {
					const files = findFragFiles(process.cwd());
					const payload: Record<string, string> = {};
					for (const file of files) {
						payload[file] = readFileSync(file, 'utf-8');
					}
					console.log(payload);
					server.ws.send({ type: 'custom', event: 'shaders-found', data: payload });
				};

				server.watcher.on('change', () => {
					sendAllFrags();
				});

				server.watcher.on('add', () => {
					sendAllFrags();
				});

				server.watcher.on('unlink', () => {
					sendAllFrags();
				});
			}
		}
	]
});
