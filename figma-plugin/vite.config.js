/// <reference path="./src/vite-env.d.ts" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ context }) => {
	return {
		plugins: context === 'ui' ? [react(), tailwindcss()] : [],
		build: {
			rollupOptions: {
				output: {
					// Preserve module resolution order to avoid TDZ errors in single-file builds
					inlineDynamicImports: false,
				},
			},
		},
		// Ensure deterministic module resolution order
		resolve: {
			dedupe: ['react', 'react-dom'],
		},
	};
});
