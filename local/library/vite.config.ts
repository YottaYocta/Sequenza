import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
	plugins: [
		react(),
		dts({
			tsconfigPath: './tsconfig.json',
			include: ['src'],
			rollupTypes: true,
			compilerOptions: { allowImportingTsExtensions: false, noEmit: false }
		})
	],
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'SequenzaRenderer',
			fileName: 'sequenza-renderer',
			formats: ['es']
		},
		rollupOptions: {
			external: ['react', 'react/jsx-runtime', 'react-dom', 'twgl.js']
		}
	}
});
