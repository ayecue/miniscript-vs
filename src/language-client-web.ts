import { workspace, ExtensionContext, Uri } from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions
} from 'vscode-languageclient/browser';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  const serverMain = Uri.joinPath(context.extensionUri, 'node_modules/miniscript-languageserver/browser.js');
  const worker = new Worker(serverMain.toString(true));

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'miniscript' }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('**/*')
    },
    diagnosticCollectionName: 'miniscript'
  };

  client = new LanguageClient(
    'miniscript-language-server',
    'MiniScript Language Server',
    clientOptions,
    worker
  );

  client.registerProposedFeatures();
  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}