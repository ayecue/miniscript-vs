const esbuild = require('esbuild');
const { polyfillNode } = require('esbuild-plugin-polyfill-node');
const globalsPlugin = require('esbuild-plugin-globals');

const build = async () => {
  try {
    await esbuild
      .build({
        entryPoints: ['./out/extension-browser.js'],
        bundle: true,
        outfile: 'extension.browser.js',
        globalName: 'miniscript',
        sourcemap: false,
        minify: true,
        minifyWhitespace: true,
        minifyIdentifiers: true,
        minifySyntax: true,
        target: 'ESNext',
        platform: 'browser',
        treeShaking: true,
        external: [
          'vscode',
          'greybel-languageserver'
        ],
        plugins: [
          polyfillNode({
            globals: false
          })
        ]
      });
  } catch (err) {
    console.error('Failed building project', { err });
    process.exit(1);
  }
};

build();
