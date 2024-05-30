import { BuildType } from 'greybel-transpiler';
import { DirectTranspiler } from 'greybel-transpiler';
import vscode, {
  ExtensionContext,
  Range
} from 'vscode';

export function activate(context: ExtensionContext) {
  vscode.languages.registerDocumentFormattingEditProvider('miniscript', {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      const result = new DirectTranspiler({
        code: document.getText(),
        buildType: BuildType.BEAUTIFY
      }).parse();

      const firstLine = document.lineAt(0);
      const lastLine = document.lineAt(
        document.lineCount - 1
      );
      const textRange = new Range(
        firstLine.range.start,
        lastLine.range.end
      );

      return [vscode.TextEdit.replace(textRange, result)];
    }
  });
}
