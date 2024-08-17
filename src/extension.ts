import { ExtensionContext } from 'vscode';

import { activate as activateBuild } from './build';
import { activate as activateDebug } from './debug';
import { activate as activateNextError } from './next-error';
import { activate as activateTransform } from './transform';
import { activate as activateLanguageClient } from './language-client';

export function activate(context: ExtensionContext) {
  activateDebug(context);
  activateBuild(context);
  activateTransform(context);
  activateNextError(context);
  activateLanguageClient(context);
}

export function deactivate() { }
