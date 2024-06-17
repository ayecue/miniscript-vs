import {
  ASTBase,
  ASTCallExpression,
  ASTIndexExpression,
  ASTMemberExpression
} from 'miniscript-core';
import {
  SignatureDefinitionFunction,
  SignatureDefinitionFunctionArg,
  SignatureDefinitionTypeMeta,
  SignatureDefinitionBaseType,
  SignatureDefinition
} from 'meta-utils';
import { miniscriptMeta } from 'miniscript-meta';
import vscode, {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  ExtensionContext,
  ParameterInformation,
  Position,
  SignatureHelp,
  SignatureHelpContext,
  SignatureInformation,
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

  vscode.languages.registerSignatureHelpProvider(
    'miniscript',
    {
      async provideSignatureHelp(
        document: TextDocument,
        position: Position,
        _token: CancellationToken,
        _ctx: SignatureHelpContext
      ): Promise<SignatureHelp> {
        documentParseQueue.refresh(document);
        const helper = new LookupHelper(document);
        const astResult = helper.lookupAST(position);

        if (!astResult) {
          return;
        }

        // filter out root call expression for signature
        let rootCallExpression: ASTCallExpression | undefined;

        if (astResult.closest.type === 'CallExpression') {
          rootCallExpression = astResult.closest as ASTCallExpression;
        } else {
          for (let index = astResult.outer.length - 1; index >= 0; index--) {
            const current = astResult.outer[index];

            if (current.type === 'CallExpression') {
              rootCallExpression = current as ASTCallExpression;
              break;
            }
          }
        }

        if (!rootCallExpression) {
          return;
        }

        const root = helper.lookupScope(astResult.closest);
        const item = await helper.lookupTypeInfo({
          closest: rootCallExpression.base,
          outer: root ? [root] : []
        });

        if (!item || !item.isCallable()) {
          return;
        }

        // figure out argument position
        const astArgs = rootCallExpression.arguments;
        const selectedIndex = astArgs.findIndex((argItem: ASTBase) => {
          const leftIndex = argItem.start!.character - 1;
          const rightIndex = argItem.end!.character;

          return (
            leftIndex <= position.character && rightIndex >= position.character
          );
        });

        const signatureHelp = new SignatureHelp();

        signatureHelp.activeParameter =
          selectedIndex === -1 ? 0 : selectedIndex;
        signatureHelp.signatures = [];
        signatureHelp.activeSignature = 0;

        const fnDef = item.signatureDefinitions.first() as SignatureDefinitionFunction;
        const args = fnDef.getArguments() || [];
        const returnValues = fnDef.getReturns().join(' or ') || 'null';
        const argValues = args
          .map(
            (item: SignatureDefinitionFunctionArg) =>
              `${item.getLabel()}${item.isOptional() ? '?' : ''}: ${item.getTypes().join(' or ')}`
          )
          .join(', ');
        const signatureInfo = new SignatureInformation(
          `(${SignatureDefinitionBaseType.Function}) ${item.label} (${argValues}): ${returnValues}`
        );
        const params: ParameterInformation[] = args.map(
          (argItem: SignatureDefinitionFunctionArg) => {
            return new ParameterInformation(
              `${argItem.getLabel()}${argItem.isOptional() ? '?' : ''}: ${argItem.getTypes().join(' or ')}`
            );
          }
        );

        signatureInfo.parameters = params;
        signatureHelp.signatures.push(signatureInfo);

        return signatureHelp;
      }
    },
    ',',
    '('
  );
}
