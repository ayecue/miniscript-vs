import { CompletionItem } from '@vscode/debugadapter';
import { CompletionItemKind } from 'vscode';

export const AVAILABLE_CONSTANTS: CompletionItem[] = [
  'true',
  'false',
  'null',
  'globals',
  'locals',
  'outer'
].map((item: string) => new CompletionItem(item, CompletionItemKind.Constant));
