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
import { CompletionItem as EntityCompletionItem, CompletionItemKind as EntityCompletionItemKind } from 'miniscript-type-analyzer';

const getCompletionItemKind = (kind: EntityCompletionItemKind): CompletionItemKind => {
  switch (kind) {
    case EntityCompletionItemKind.Constant:
      return CompletionItemKind.Constant;
    case EntityCompletionItemKind.Variable:
      return CompletionItemKind.Variable;
    case EntityCompletionItemKind.Expression:
      return CompletionItemKind.Variable;
    case EntityCompletionItemKind.Function:
      return CompletionItemKind.Function;
    case EntityCompletionItemKind.ListConstructor:
    case EntityCompletionItemKind.MapConstructor:
    case EntityCompletionItemKind.Literal:
    case EntityCompletionItemKind.Unknown:
      return CompletionItemKind.Value
  }
}

export const transformToCompletionItems = (identifer: Map<string, EntityCompletionItem>) => {
  const items: CompletionItem[] = [];

  for (const [property, item] of identifer) {
    items.push(new CompletionItem(property, getCompletionItemKind(item.kind)));
  }

  return items;
}

export const getPropertyCompletionList = (
  helper: LookupHelper,
  item: ASTBase
): CompletionItem[] => {
  const entity = helper.lookupBasePath(item);
  return transformToCompletionItems(entity.getAllIdentifier());
};

export const getDefaultCompletionList = (): CompletionItem[] => {
  return [
    ...AVAILABLE_KEYWORDS,
    ...AVAILABLE_OPERATORS,
    ...AVAILABLE_CONSTANTS
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
      const astResult = helper.lookupAST(position);
      const completionItems: CompletionItem[] = [];
      let isProperty = false;

      if (astResult) {
        const { closest } = astResult;

        if (
          closest instanceof ASTMemberExpression
        ) {
          completionItems.push(...getPropertyCompletionList(helper, closest));
          isProperty = true;
        } else if (
          closest instanceof ASTIndexExpression
        ) {
          completionItems.push(...getPropertyCompletionList(helper, closest));
          isProperty = true;
        } else {
          completionItems.push(...getDefaultCompletionList());
        }
      } else {
        completionItems.push(...getDefaultCompletionList());
        completionItems.push(...transformToCompletionItems(helper.findAllAvailableIdentifierInRoot()));
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
          ...transformToCompletionItems(importHelper
            .findAllAvailableIdentifier(document))
            .filter((item) => !existingProperties.has(item.label))
            .map((item) => {
              existingProperties.add(item.label);
              return item;
            })
        );
      }

      // get all identifer available in scope
      completionItems.push(
        ...transformToCompletionItems(helper
          .findAllAvailableIdentifierRelatedToPosition(astResult.closest))
          .filter((item) => !existingProperties.has(item.label))
      );

      return new CompletionList(completionItems);
    }
  }, '.');
}
