import { BuildType, Transpiler } from 'greybel-transpiler';
import vscode, {
  ExtensionContext,
  Uri
} from 'vscode';
import { miniscriptMeta } from 'miniscript-meta';

import { createParseResult } from './build/create-parse-result';
import { showCustomErrorMessage } from './helper/show-custom-error';
import { TranspilerResourceProvider } from './resource';
import documentManager from './helper/document-manager';

export function activate(context: ExtensionContext) {
  async function build(
    eventUri: Uri = vscode.window.activeTextEditor?.document?.uri
  ) {
    const result = await documentManager.open(eventUri.fsPath);

    if (result === null) {
      vscode.window.showErrorMessage(
        'You cannot build a file which does not exist in the file system.',
        { modal: false }
      );
      return;
    }

    try {
      const config = vscode.workspace.getConfiguration('miniscript');
      const target = eventUri.fsPath;
      const buildTypeFromConfig = config.get('transpiler.buildType');
      const environmentVariablesFromConfig =
        config.get<object>('transpiler.environmentVariables') || {};
      const excludedNamespacesFromConfig =
        config.get<string[]>('transpiler.excludedNamespaces') || [];
      const obfuscation = config.get<boolean>('transpiler.obfuscation');
      let buildType = BuildType.DEFAULT;

      if (buildTypeFromConfig === 'Uglify') {
        buildType = BuildType.UGLIFY;
      } else if (buildTypeFromConfig === 'Beautify') {
        buildType = BuildType.BEAUTIFY;
      }

      const result = await new Transpiler({
        target,
        resourceHandler: new TranspilerResourceProvider().getHandler(),
        buildType,
        environmentVariables: new Map(
          Object.entries(environmentVariablesFromConfig)
        ),
        obfuscation,
        disableLiteralsOptimization: config.get('transpiler.dlo'),
        disableNamespacesOptimization: config.get('transpiler.dno'),
        excludedNamespaces: [
          ...excludedNamespacesFromConfig,
          ...Array.from(Object.keys(miniscriptMeta.getTypeSignature('general').getDefinitions()))
        ]
      }).parse();

      const rootPath = vscode.workspace.rootPath
        ? Uri.file(vscode.workspace.rootPath)
        : Uri.joinPath(Uri.file(eventUri.fsPath), '..');
      const buildPath = Uri.joinPath(rootPath, './build');

      try {
        await vscode.workspace.fs.delete(buildPath, { recursive: true });
      } catch (err) {
        console.warn(err);
      }

      await vscode.workspace.fs.createDirectory(buildPath);
      await createParseResult(target, buildPath, result);

      vscode.window.showInformationMessage(
        `Build done. Available [here](${buildPath.toString(true)}).`,
        { modal: false }
      );
    } catch (err: any) {
      showCustomErrorMessage(err);
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('miniscript.build', build)
  );
}
