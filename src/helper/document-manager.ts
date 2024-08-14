import EventEmitter from 'events';
import { ASTChunkAdvanced, Parser } from 'greybel-core';
import LRU from 'lru-cache';
import { ASTBaseBlockWithScope } from 'miniscript-core';
import vscode, { TextDocument, Uri } from 'vscode';

export interface ParseResultOptions {
  documentManager: DocumentParsescheduledItems;
  content: string;
  textDocument: TextDocument;
  document: ASTBaseBlockWithScope | null;
  errors: Error[];
}

export class DocumentURIBuilder {
  readonly workspaceFolderUri: Uri | null;
  readonly rootPath: Uri;

  constructor(rootPath: Uri, workspaceFolderUri: Uri = null) {
    this.workspaceFolderUri = workspaceFolderUri;
    this.rootPath = rootPath;
  }

  getFromWorkspaceFolder(path: string): Uri {
    if (this.workspaceFolderUri == null) {
      throw new Error('Workspace folder is not defined!');
    }

    return Uri.joinPath(this.workspaceFolderUri, path);
  }

  getFromRootPath(path: string): Uri {
    return Uri.joinPath(this.rootPath, path);
  }
}

export class ParseResult {
  documentManager: DocumentParsescheduledItems;
  content: string;
  textDocument: TextDocument;
  document: ASTBaseBlockWithScope | null;
  errors: Error[];

  private dependencies?: string[];

  constructor(options: ParseResultOptions) {
    this.documentManager = options.documentManager;
    this.content = options.content;
    this.textDocument = options.textDocument;
    this.document = options.document;
    this.errors = options.errors;
  }

  getDirectory(): Uri {
    return Uri.joinPath(this.textDocument.uri, '..');
  }

  getDependencies(): string[] {
    if (this.document == null) {
      return [];
    }

    if (this.dependencies) {
      return this.dependencies;
    }

    const rootChunk = this.document as ASTChunkAdvanced;
    const rootPath = this.getDirectory();
    const workspacePaths = vscode.workspace.workspaceFolders;
    const builder = new DocumentURIBuilder(rootPath, workspacePaths[0].uri);
    const getPath = (path: string) => {
      if (path.startsWith('/')) {
        return builder.getFromWorkspaceFolder(path).toString();
      }
      return builder.getFromRootPath(path).toString();
    };
    const dependencies: Set<string> = new Set([
      ...rootChunk.imports
        .filter((nonNativeImport) => nonNativeImport.path)
        .map((nonNativeImport) => getPath(nonNativeImport.path)),
      ...rootChunk.includes
        .filter((includeImport) => includeImport.path)
        .map((includeImport) => getPath(includeImport.path))
    ]);

    this.dependencies = Array.from(dependencies);

    return this.dependencies;
  }

  async getImports(): Promise<ParseResult[]> {
    if (this.document == null) {
      return [];
    }

    const imports: Set<ParseResult> = new Set();
    const visited: Set<string> = new Set([this.textDocument.uri.toString()]);
    const traverse = async (rootResult: ParseResult) => {
      const dependencies = await rootResult.getDependencies();

      for (const dependency of dependencies) {
        if (visited.has(dependency)) continue;

        const item = await this.documentManager.open(Uri.parse(dependency));

        visited.add(dependency);

        if (item === null) continue;

        imports.add(item);

        if (item.document !== null) {
          await traverse(item);
        }
      }
    };

    await traverse(this);

    return Array.from(imports);
  }
}

export interface ScheduledItem {
  document: TextDocument;
  createdAt: number;
}

export const DOCUMENT_PARSE_scheduledItems_INTERVAL = 1000;
export const DOCUMENT_PARSE_scheduledItems_PARSE_TIMEOUT = 2500;

export class DocumentParsescheduledItems extends EventEmitter {
  results: LRU<string, ParseResult>;

  private scheduledItems: Map<string, ScheduledItem>;
  private interval: NodeJS.Timeout | null;
  private readonly parseTimeout: number;

  constructor(
    parseTimeout: number = DOCUMENT_PARSE_scheduledItems_PARSE_TIMEOUT
  ) {
    super();
    this.results = new LRU({
      ttl: 1000 * 60 * 20,
      ttlAutopurge: true
    });
    this.scheduledItems = new Map();
    this.interval = setInterval(
      () => this.tick(),
      DOCUMENT_PARSE_scheduledItems_INTERVAL
    );
    this.parseTimeout = parseTimeout;
  }

  private tick() {
    const currentTime = Date.now();

    for (const item of this.scheduledItems.values()) {
      if (currentTime - item.createdAt > this.parseTimeout) {
        this.refresh(item.document);
      }
    }
  }

  refresh(document: TextDocument): ParseResult {
    const key = document.uri.toString();

    if (!this.scheduledItems.has(key) && this.results.has(key)) {
      return this.results.get(key)!;
    }

    const result = this.create(document);
    this.results.set(key, result);
    this.emit('parsed', document, result);
    this.scheduledItems.delete(key);

    return result;
  }

  private create(document: TextDocument): ParseResult {
    const content = document.getText();
    const parser = new Parser(content, {
      unsafe: true
    });
    const chunk = parser.parseChunk() as ASTChunkAdvanced;

    if (chunk.body?.length > 0) {
      return new ParseResult({
        documentManager: this,
        content,
        textDocument: document,
        document: chunk,
        errors: [...parser.lexer.errors, ...parser.errors]
      });
    }

    try {
      const strictParser = new Parser(document.getText());
      const strictChunk = strictParser.parseChunk() as ASTChunkAdvanced;

      return new ParseResult({
        documentManager: this,
        content,
        textDocument: document,
        document: strictChunk,
        errors: []
      });
    } catch (err: any) {
      return new ParseResult({
        documentManager: this,
        content,
        textDocument: document,
        document: null,
        errors: [err]
      });
    }
  }

  update(document: TextDocument): boolean {
    const fileUri = document.uri.toString();
    const content = document.getText();

    if (this.scheduledItems.has(fileUri)) {
      return false;
    }

    if (this.results.get(fileUri)?.content === content) {
      return false;
    }

    this.scheduledItems.set(fileUri, {
      document,
      createdAt: Date.now()
    });

    return true;
  }

  async open(target: Uri): Promise<ParseResult | null> {
    try {
      const textDocument = await vscode.workspace.openTextDocument(target);
      return this.get(textDocument);
    } catch (err) {
      return null;
    }
  }

  get(document: TextDocument): ParseResult {
    return this.results.get(document.uri.toString()) || this.refresh(document);
  }

  getLatest(
    document: TextDocument,
    timeout: number = 5000
  ): Promise<ParseResult> {
    const me = this;

    if (me.scheduledItems.has(document.uri.toString())) {
      return new Promise((resolve) => {
        const onTimeout = () => {
          me.removeListener('parsed', onParse);
          resolve(me.get(document));
        };
        const onParse = (evDocument: TextDocument) => {
          if (evDocument.uri.toString() === document.uri.toString()) {
            me.removeListener('parsed', onParse);
            clearTimeout(timer);
            resolve(me.get(document));
          }
        };
        const timer = setTimeout(onTimeout, timeout);

        me.addListener('parsed', onParse);
      });
    }

    return Promise.resolve(me.get(document));
  }

  clear(document: TextDocument): void {
    this.results.delete(document.uri.toString());
    this.emit('cleared', document);
  }
}

export default new DocumentParsescheduledItems();
