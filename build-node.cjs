const esbuild = require('esbuild');

const build = async () => {
  try {
    await esbuild
      .build({
        entryPoints: ['./out/extension.js'],
        bundle: true,
        outfile: 'extension.js',
        globalName: 'miniscript',
        sourcemap: false,
        minify: true,
        minifyWhitespace: true,
        minifyIdentifiers: true,
        minifySyntax: true,
        target: 'ESNext',
        platform: 'node',
        treeShaking: true,
        format: 'cjs',
        external: [
          'vscode'
        ]
      });
  } catch (err) {
    console.error('Failed building project', { err });
    process.exit(1);
  }
};

build();
