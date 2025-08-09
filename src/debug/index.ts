import vscode, {
  CancellationToken,
  DebugAdapterDescriptorFactory,
  DebugConfiguration,
  ExtensionContext,
  ProviderResult,
  Uri,
  workspace,
  WorkspaceFolder
} from 'vscode';

import { GreybelDebugSession } from './session';

export function activate(
  context: ExtensionContext,
  factory?: DebugAdapterDescriptorFactory
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'miniscript.debug.runEditorContents',
      (resource: Uri) => {
        let targetResource = resource;
        if (!targetResource && vscode.window.activeTextEditor) {
          targetResource = vscode.window.activeTextEditor.document.uri;
        }
        if (targetResource) {
          vscode.debug.startDebugging(
            workspace.getWorkspaceFolder(resource),
            {
              type: 'miniscript',
              name: 'Run File',
              request: 'launch',
              program: targetResource.fsPath
            },
            { noDebug: true }
          );
        }
      }
    ),
    vscode.commands.registerCommand(
      'miniscript.debug.debugEditorContents',
      (resource: Uri) => {
        let targetResource = resource;
        if (!targetResource && vscode.window.activeTextEditor) {
          targetResource = vscode.window.activeTextEditor.document.uri;
        }
        if (targetResource) {
          vscode.debug.startDebugging(
            workspace.getWorkspaceFolder(resource),
            {
              type: 'miniscript',
              name: 'Debug File',
              request: 'launch',
              program: targetResource.fsPath
            }
          );
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'miniscript.debug.getProgramName',
      async (_config) => {
        const target = vscode.window.activeTextEditor?.document.uri.toString();

        if (target) {
          return target;
        }

        const rootPath = vscode.workspace.rootPath;

        if (!rootPath) {
          const value = await vscode.window.showInputBox({
            placeHolder: 'Please enter the full file path',
            value: 'test.ms'
          });

          if (!value) {
            return;
          }

          return value;
        }

        const value = await vscode.window.showInputBox({
          placeHolder:
            'Please enter the name of a src file in the workspace folder',
          value: 'test.ms'
        });

        if (!value) {
          return;
        }

        return Uri.joinPath(Uri.file(rootPath), value).toString();
      }
    )
  );

  // register a configuration provider for 'mock' debug type
  const provider = new MockConfigurationProvider();
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider('miniscript', provider)
  );

  // register a dynamic configuration provider for 'mock' debug type
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider(
      'miniscript',
      {
        provideDebugConfigurations(
          _folder: WorkspaceFolder | undefined
        ): ProviderResult<DebugConfiguration[]> {
          return [
            {
              name: 'Dynamic Launch',
              request: 'launch',
              type: 'mock',
              program: '${file}'
            },
            {
              name: 'Another Dynamic Launch',
              request: 'launch',
              type: 'mock',
              program: '${file}'
            },
            {
              name: 'Mock Launch',
              request: 'launch',
              type: 'mock',
              program: '${file}'
            }
          ];
        }
      },
      vscode.DebugConfigurationProviderTriggerKind.Dynamic
    )
  );

  if (!factory) {
    factory = new InlineDebugAdapterFactory();
  }
  context.subscriptions.push(
    vscode.debug.registerDebugAdapterDescriptorFactory('miniscript', factory)
  );
  if ('dispose' in factory) {
    context.subscriptions.push(factory as Record<'dispose', any>);
  }
}

class MockConfigurationProvider implements vscode.DebugConfigurationProvider {
  resolveDebugConfiguration(
    _folder: WorkspaceFolder | undefined,
    config: DebugConfiguration,
    _token?: CancellationToken
  ): ProviderResult<DebugConfiguration> {
    // if launch.json is missing or empty
    if (!config.type && !config.request && !config.name) {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'miniscript') {
        config.type = 'miniscript';
        config.name = 'Launch';
        config.request = 'launch';
        config.program = '${file}';
      }
    }

    if (!config.program) {
      return vscode.window
        .showInformationMessage('Cannot find a program to debug')
        .then((_) => {
          return undefined;
        });
    }

    return config;
  }
}

class InlineDebugAdapterFactory
  implements vscode.DebugAdapterDescriptorFactory
{
  createDebugAdapterDescriptor(
    _session: vscode.DebugSession
  ): ProviderResult<vscode.DebugAdapterDescriptor> {
    return new vscode.DebugAdapterInlineImplementation(
      new GreybelDebugSession()
    );
  }
}
