import { BuildType } from 'greybel-transpiler';
import { DirectTranspiler } from 'greybel-transpiler';
import vscode, {
  ExtensionContext,
  Range,
  TextEditor,
  TextEditorEdit
} from 'vscode';

import { showCustomErrorMessage } from './helper/show-custom-error';
import { miniscriptMeta } from 'miniscript-meta';

export enum ShareType {
  WRITE = 'write',
  CLIPBOARD = 'clipboard'
}

export function activate(context: ExtensionContext) {
  async function transform(
    editor: TextEditor,
    _args: any[],
    specificBuildType?: BuildType,
    shareType: ShareType = ShareType.WRITE
  ) {
    if (editor.document.isDirty) {
      const isSaved = await editor.document.save();

      if (!isSaved) {
        vscode.window.showErrorMessage(
          'You cannot transform a file which does not exist in the file system.',
          { modal: false }
        );
        return;
      }
    }

    try {
      const config = vscode.workspace.getConfiguration('miniscript');
      const buildTypeFromConfig = config.get('transpiler.buildType');
      const environmentVariablesFromConfig =
        config.get<object>('transpiler.environmentVariables') || {};
      const excludedNamespacesFromConfig =
        config.get<string[]>('transpiler.excludedNamespaces') || [];
      const obfuscation = config.get<boolean>('transpiler.obfuscation');
      let buildType = BuildType.DEFAULT;
      let buildOptions: any = {
        isDevMode: true
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
          isDevMode: true,
          keepParentheses: config.get<boolean>('transpiler.beautify.keepParentheses'),
          indentation: config.get<string>('transpiler.beautify.indentation') === 'Tab' ? 0 : 1,
          indentationSpaces: config.get<number>('transpiler.beautify.indentationSpaces')
        };
      }

      const result = new DirectTranspiler({
        code: editor.document.getText(),
        buildType: specificBuildType || buildType,
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

      switch (shareType) {
        case ShareType.WRITE: {
          const firstLine = editor.document.lineAt(0);
          const lastLine = editor.document.lineAt(
            editor.document.lineCount - 1
          );
          const textRange = new Range(
            firstLine.range.start,
            lastLine.range.end
          );

          await editor.edit((editBuilder) => {
            editBuilder.replace(textRange, result);
          });
          vscode.window.showInformationMessage('Transform done.', {
            modal: false
          });
          break;
        }
        case ShareType.CLIPBOARD: {
          vscode.env.clipboard.writeText(result);
          vscode.window.showInformationMessage(
            'Transform copied to clipboard.',
            { modal: false }
          );
          break;
        }
        default: {
          vscode.window.showInformationMessage('Unknown share type.', {
            modal: false
          });
        }
      }
    } catch (err: any) {
      showCustomErrorMessage({
        message: err.message,
        range: err.range,
        target: editor.document.uri.toString(),
        stack: err.stack
      });
    }
  }

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'miniscript.transform.clipboard',
      (editor: TextEditor, edit: TextEditorEdit, args: any[]) =>
        transform(editor, args, undefined, ShareType.CLIPBOARD)
    ),
    vscode.commands.registerTextEditorCommand(
      'miniscript.transform.write',
      (editor: TextEditor, _edit: TextEditorEdit, args: any[]) =>
        transform(editor, args)
    ),
    vscode.commands.registerTextEditorCommand(
      'miniscript.minify.write',
      (editor: TextEditor, edit: TextEditorEdit, args: any[]) =>
        transform(editor, args, BuildType.UGLIFY)
    ),
    vscode.commands.registerTextEditorCommand(
      'miniscript.beautify.write',
      (editor: TextEditor, edit: TextEditorEdit, args: any[]) =>
        transform(editor, args, BuildType.BEAUTIFY)
    )
  );
}
