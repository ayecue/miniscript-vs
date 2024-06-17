import {
  ASTBase,
  ASTIndexExpression,
  ASTMemberExpression
} from 'miniscript-core';
import vscode, {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  ExtensionContext,
  Position,
  TextDocument
} from 'vscode';

import { AVAILABLE_CONSTANTS } from './autocomplete/constants';
import { AVAILABLE_KEYWORDS } from './autocomplete/keywords';
import { AVAILABLE_OPERATORS } from './autocomplete/operators';
import documentParseQueue from './helper/document-manager';
import { LookupHelper } from './helper/lookup-type';
import typeManager from './helper/type-manager';
import { Document as TypeDocument, CompletionItemKind as EntityKind, createExpressionId } from 'miniscript-type-analyzer';

const getCompletionItemKind = (kind: EntityKind): CompletionItemKind => {
  switch (kind) {
    case EntityKind.Constant:
      return CompletionItemKind.Constant;
    case EntityKind.Variable:
      return CompletionItemKind.Variable;
    case EntityKind.Expression:
      return CompletionItemKind.Variable;
    case EntityKind.Function:
      return CompletionItemKind.Function;
    case EntityKind.ListConstructor:
    case EntityKind.MapConstructor:
    case EntityKind.Literal:
    case EntityKind.Unknown:
      return CompletionItemKind.Value
  }
}

export const getCompletionList = (
  helper: LookupHelper,
  item: ASTBase
): CompletionItem[] => {
  const entity = helper.lookupBasePath(item);
  const items: CompletionItem[] = [];

  for (const [property, item] of entity.getAllIdentifier()) {
    items.push(new CompletionItem(property, getCompletionItemKind(item.kind)));
  }

  return items;
};

export const getDefaultCompletionList = (typeDoc: TypeDocument): CompletionItem[] => {
  const items: CompletionItem[] = [];

  for (const [property, item] of typeDoc.getRootScopeContext().scope.getAllIdentifier()) {
    items.push(new CompletionItem(property, getCompletionItemKind(item.kind)));
  }

  return [
    ...AVAILABLE_KEYWORDS,
    ...AVAILABLE_OPERATORS,
    ...AVAILABLE_CONSTANTS,
    ...items
  ];
};

export function activate(_context: ExtensionContext) {
  vscode.languages.registerCompletionItemProvider('miniscript', {
    async provideCompletionItems(
      document: TextDocument,
      position: Position,
      _token: CancellationToken,
      _ctx: CompletionContext
    ) {
      documentParseQueue.refresh(document);

      const helper = new LookupHelper(document);
      const typeDoc = typeManager.get(document);
      const astResult = helper.lookupAST(position);
      const completionItems: CompletionItem[] = [];
      let isProperty = false;

      if (astResult) {
        const { closest } = astResult;

        if (
          closest instanceof ASTMemberExpression
        ) {
          completionItems.push(...getCompletionList(helper, closest));
          isProperty = true;
        } else if (
          closest instanceof ASTIndexExpression
        ) {
          completionItems.push(...getCompletionList(helper, closest));
          isProperty = true;
        } else {
          completionItems.push(...getDefaultCompletionList(typeDoc));
        }
      } else {
        completionItems.push(...getDefaultCompletionList(typeDoc));
      }

      if (!astResult || isProperty) {
        return new CompletionList(completionItems);
      }

      const existingProperties = new Set([
        ...completionItems.map((item) => item.label)
      ]);
      const allImports = await documentParseQueue.get(document).getImports();

      // get all identifer available in imports
      for (const item of allImports) {
        const { document } = item;

        if (!document) {
          continue;
        }

        const importHelper = new LookupHelper(item.textDocument);

        completionItems.push(
          ...importHelper
            .findAllAvailableIdentifier(document)
            .filter((property: string) => !existingProperties.has(property))
            .map((property: string) => {
              existingProperties.add(property);
              return new CompletionItem(property, CompletionItemKind.Variable);
            })
        );
      }

      // get all identifer available in scope
      completionItems.push(
        ...helper
          .findAllAvailableIdentifierRelatedToPosition(astResult.closest)
          .filter((property: string) => !existingProperties.has(property))
          .map((property: string) => {
            existingProperties.add(property);
            return new CompletionItem(property, CompletionItemKind.Variable);
          })
      );

      return new CompletionList(completionItems);
    }
  }, '.');
}
