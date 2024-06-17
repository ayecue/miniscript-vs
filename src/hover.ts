import {
  ASTFeatureImportExpression,
  ASTType as ASTTypeExtended
} from 'greybel-core';
import vscode, {
  CancellationToken,
  ExtensionContext,
  Hover,
  MarkdownString,
  Position,
  TextDocument,
  Uri
} from 'vscode';
import {
  SignatureDefinitionTypeMeta
} from 'meta-utils';

import { LookupHelper } from './helper/lookup-type';
import { PseudoFS } from './resource';
import { createHover, formatTypes } from './helper/tooltip';

export function activate(_context: ExtensionContext) {
  vscode.languages.registerHoverProvider('miniscript', {
    async provideHover(
      document: TextDocument,
      position: Position,
      _token: CancellationToken
    ): Promise<Hover> {
      const helper = new LookupHelper(document);
      const astResult = helper.lookupAST(position);

      if (!astResult) {
        return;
      }

      if (
        astResult.closest.type === ASTTypeExtended.FeatureImportExpression ||
        astResult.closest.type === ASTTypeExtended.FeatureIncludeExpression
      ) {
        // shows link to import/include resource
        const hoverText = new MarkdownString('');
        const importCodeAst = astResult.closest as ASTFeatureImportExpression;
        const fileDir = importCodeAst.path;

        const rootDir = fileDir.startsWith('/') ? vscode.workspace.workspaceFolders[0]?.uri : Uri.joinPath(Uri.file(document.fileName), '..');
        const target = Uri.joinPath(rootDir, fileDir);

        const output = [
          `[Inserts file "${PseudoFS.basename(
            target.fsPath
          )}" inside this code when building](${target.toString(true)})`,
          '***',
          'Click the link above to open the file.'
        ];

        hoverText.appendMarkdown(output.join('\n'));

        return new Hover(hoverText);
      }

      const entity = await helper.lookupTypeInfo(astResult);

      if (!entity) {
        return;
      }

      if (entity.isCallable()) {
        return createHover(entity);
      }

      const hoverText = new MarkdownString('');
      const metaTypes = Array.from(entity.types).map(SignatureDefinitionTypeMeta.parse)

      hoverText.appendCodeblock(
        `(${entity.kind}) ${entity.label}: ${formatTypes(metaTypes)}`
      );

      return new Hover(hoverText);
    }
  });
}
