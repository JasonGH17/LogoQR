const esbuild = require('esbuild');

esbuild.build({
	entryPoints: ['src/index.ts'],
	format: 'esm',
	target: ['esnext', 'node12.22.0'],
	bundle: true,
	minify: true,
	sourcemap: true,
	outfile: 'bin/index.esm.js',
});

esbuild.build({
	entryPoints: ['src/index.ts'],
	format: 'cjs',
	target: ['esnext', 'node12.22.0'],
	bundle: true,
	minify: true,
	sourcemap: true,
	outfile: 'bin/index.cjs',
});

esbuild.build({
	entryPoints: ['examples/example1.ts'],
	platform: 'browser',
	bundle: true,
	minify: true,
	sourcemap: false,
	outfile: 'examples/examples.js',
});
