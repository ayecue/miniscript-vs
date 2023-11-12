import {
  ASTFeatureImportExpression,
  ASTType as ASTTypeExtended
} from 'greybel-core';
import { ASTType } from 'greybel-core';
import vscode, {
  CancellationToken,
  ExtensionContext,
  Hover,
  MarkdownString,
  Position,
  TextDocument,
  Uri
} from 'vscode';

import { LookupHelper } from './helper/lookup-type';
import { TypeInfoWithDefinition } from './helper/type-manager';
import { PseudoFS } from './resource';

function formatType(type: string): string {
  const segments = type.split(':');
  if (segments.length === 1) {
    return segments[0];
  }
  return `${segments[0]}<${segments[1]}>`;
}

function formatTypes(types: string[] = []): string {
  return types.map(formatType).join(' or ');
}

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

      const typeInfo = await helper.lookupTypeInfo(astResult);

      if (!typeInfo) {
        return;
      }

      const hoverText = new MarkdownString('');

      if (
        typeInfo instanceof TypeInfoWithDefinition &&
        typeInfo.type.length === 1
      ) {
        const defintion = typeInfo.definition;
        const args = defintion.arguments || [];
        const example = defintion.example || [];
        const returnValues = formatTypes(defintion.returns) || 'null';
        let headline;

        if (args.length === 0) {
          headline = `(${typeInfo.kind}) ${typeInfo.label} (): ${returnValues}`;
        } else {
          const argValues = args
            .map(
              (item) =>
                `${item.label}${item.opt ? '?' : ''}: ${formatType(item.type)}${
                  item.default ? ` = ${item.default}` : ''
                }`
            )
            .join(', ');

          headline = `(${typeInfo.kind}) ${typeInfo.label} (${argValues}): ${returnValues}`;
        }

        const output = ['```', headline, '```', '***', defintion.description];

        if (example.length > 0) {
          output.push(...['#### Examples:', '```', ...example, '```']);
        }

        hoverText.appendMarkdown(output.join('\n'));

        return new Hover(hoverText);
      }

      hoverText.appendCodeblock(
        `(${typeInfo.kind}) ${typeInfo.label}: ${formatTypes(typeInfo.type)}`
      );

      return new Hover(hoverText);
    }
  });
}
