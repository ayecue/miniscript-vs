import vscode, { ExtensionContext } from 'vscode';

import { activate as activateAutocomplete } from './autocomplete';
import { activate as activateDefinition } from './definition';
import { activate as activateDiagnostic } from './diagnostic';
import { activate as activateHover } from './hover';
import { activate as activateNextError } from './next-error';
import { activate as activateRefresh } from './refresh';
import { activate as activateSubscriptions } from './subscriptions';
import { activate as activateSymbol } from './symbol';
import { activate as activateTransform } from './transform';
import { activate as activateFormatter } from './formatter';

export function activate(context: ExtensionContext) {
  const config = vscode.workspace.getConfiguration('miniscript');

  activateRefresh(context);
  activateSubscriptions(context);

  if (config.get<boolean>('hoverdocs')) {
    activateHover(context);
  }

  if (config.get<boolean>('autocomplete')) {
    activateAutocomplete(context);
  }

  activateTransform(context);
  activateNextError(context);
  activateDefinition(context);
  activateSymbol(context);

  if (config.get<boolean>('formatter')) {
    activateFormatter(context);
  }

  if (config.get<boolean>('diagnostic')) {
    activateDiagnostic(context);
  }
}

export function deactivate() { }
