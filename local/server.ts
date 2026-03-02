import { Server } from 'socket.io';
import chokidar from 'chokidar';
import { readFileSync } from 'fs';
import { join } from 'path';

const PORT = 3001;
const io = new Server(PORT, { cors: { origin: '*' } });

const ROOT = process.cwd();
console.log('Running from root: ', ROOT, '\non port', PORT);

const fragMap: Record<string, string> = {};

const watcher = chokidar.watch('.', {
	ignored: [/node_modules/, (path, stats) => (stats?.isFile() ?? false) && !path.endsWith('.frag')],
	persistent: true
});

watcher
	.on('add', (path) => {
		fragMap[path] = readFileSync(join(ROOT, path), 'utf-8');
		console.log('[ADD] ', path);
		io.emit('shaders-found', fragMap);
	})
	.on('change', (path) => {
		fragMap[path] = readFileSync(join(ROOT, path), 'utf-8');
		console.log('[CHANGE] ', path);
		io.emit('shaders-found', fragMap);
	})
	.on('unlink', (path) => {
		delete fragMap[path];
		console.log('[DELETE] ', path);
		io.emit('shaders-found', fragMap);
	});

io.on('connection', (socket) => {
	console.log('[SOCKET]', fragMap);
	socket.emit('shaders-found', fragMap);
});
