import vscode, { ExtensionContext } from 'vscode';

import { activate as activateNextError } from './next-error';
import { activate as activateTransform } from './transform';
import { activate as activateLanguageClient } from './language-client-web';

export function activate(context: ExtensionContext) {
  activateTransform(context);
  activateNextError(context);
  activateLanguageClient(context);
}

export function deactivate() { }
