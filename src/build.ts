import { BuildType, Transpiler } from 'greybel-transpiler';
import vscode, {
  ExtensionContext,
  Uri
} from 'vscode';
import { miniscriptMeta } from 'miniscript-meta';

import { createParseResult } from './build/create-parse-result';
import { showCustomErrorMessage } from './helper/show-custom-error';
import { TranspilerResourceProvider } from './resource';

export function activate(context: ExtensionContext) {
  async function build(
    eventUri: Uri = vscode.window.activeTextEditor?.document?.uri
  ) {
    const textDocument = await vscode.workspace.openTextDocument(eventUri);

    if (textDocument === null) {
      vscode.window.showErrorMessage(
        'You cannot build a file which does not exist in the file system.',
        { modal: false }
      );
      return;
    }

    try {
      const config = vscode.workspace.getConfiguration('miniscript');
      const targetUri = eventUri;
      const buildTypeFromConfig = config.get('transpiler.buildType');
      const environmentVariablesFromConfig =
        config.get<object>('transpiler.environmentVariables') || {};
      const excludedNamespacesFromConfig =
        config.get<string[]>('transpiler.excludedNamespaces') || [];
      const obfuscation = config.get<boolean>('transpiler.obfuscation');
      let buildType = BuildType.DEFAULT;
      let buildOptions: any = {
        isDevMode: false
      };

      if (buildTypeFromConfig === 'Uglify') {
        buildType = BuildType.UGLIFY;
        buildOptions = {
          disableLiteralsOptimization: config.get('transpiler.dlo'),
          disableNamespacesOptimization: config.get('transpiler.dno'),
        };
      } else if (buildTypeFromConfig === 'Beautify') {
        buildType = BuildType.BEAUTIFY;
        buildOptions = {
          isDevMode: false,
          keepParentheses: config.get<boolean>('transpiler.beautify.keepParentheses'),
          indentation: config.get<string>('transpiler.beautify.indentation') === 'Tab' ? 0 : 1,
          indentationSpaces: config.get<number>('transpiler.beautify.indentationSpaces')
        };
      }

      const result = await new Transpiler({
        target: targetUri.toString(),
        resourceHandler: new TranspilerResourceProvider().getHandler(),
        buildType,
        buildOptions,
        environmentVariables: new Map(
          Object.entries(environmentVariablesFromConfig)
        ),
        obfuscation,
        excludedNamespaces: [
          ...excludedNamespacesFromConfig,
          ...Array.from(Object.keys(miniscriptMeta.getTypeSignature('general').getDefinitions()))
        ]
      }).parse();

      const rootPath = vscode.workspace.rootPath
        ? Uri.file(vscode.workspace.rootPath)
        : Uri.joinPath(eventUri, '..');
      const buildPath = Uri.joinPath(rootPath, './build');

      try {
        await vscode.workspace.fs.delete(buildPath, { recursive: true });
      } catch (err) {
        console.warn(err);
      }

      await vscode.workspace.fs.createDirectory(buildPath);
      await createParseResult(targetUri, buildPath, result);

      vscode.window.showInformationMessage(
        `Build done. Available [here](${buildPath.toString()}).`,
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
