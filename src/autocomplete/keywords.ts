import { CompletionItem } from '@vscode/debugadapter';
import { GreybelKeyword, Keyword } from 'greybel-core';
import { Keyword as CoreKeyword } from 'miniscript-core';
import { CompletionItemKind } from 'vscode';

export const AVAILABLE_KEYWORDS: CompletionItem[] = [
  CoreKeyword.If,
  CoreKeyword.In,
  CoreKeyword.Or,
  CoreKeyword.And,
  CoreKeyword.Isa,
  CoreKeyword.For,
  CoreKeyword.New,
  CoreKeyword.Not,
  CoreKeyword.End,
  CoreKeyword.Then,
  CoreKeyword.Else,
  CoreKeyword.Break,
  CoreKeyword.While,
  CoreKeyword.Return,
  CoreKeyword.Function,
  CoreKeyword.Continue,
  GreybelKeyword.Envar,
  GreybelKeyword.Import,
  GreybelKeyword.Include,
  GreybelKeyword.Debugger
].map((item: Keyword) => new CompletionItem(item, CompletionItemKind.Keyword));
