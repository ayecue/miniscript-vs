import vscode, { ExtensionContext } from 'vscode';

import { activate as activateNextError } from './next-error';
import { activate as activateRefresh } from './refresh';
import { activate as activateSubscriptions } from './subscriptions';
import { activate as activateTransform } from './transform';
import { activate as activateLanguageClient } from './language-client-web';

export function activate(context: ExtensionContext) {
  activateRefresh(context);
  activateSubscriptions(context);

  activateTransform(context);
  activateNextError(context);
  activateLanguageClient(context);
}

export function deactivate() { }
