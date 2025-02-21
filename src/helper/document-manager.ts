import { TextDocument, Uri } from 'vscode';

import { findExistingPath, getWorkspaceFolderUri } from './fs';

export class DocumentURIBuilder {
  readonly workspaceFolderUri: Uri | null;
  readonly rootPath: Uri;
  readonly fileExtensions: string[];

  static async fromTextDocument(textDocument: TextDocument): Promise<DocumentURIBuilder> {
    const workspaceFolderUri = getWorkspaceFolderUri(textDocument.uri);

    return new DocumentURIBuilder(
      Uri.joinPath(textDocument.uri, '..'),
      workspaceFolderUri
    );
  }

  constructor(rootPath: Uri, workspaceFolderUri: Uri = null) {
    this.workspaceFolderUri = workspaceFolderUri;
    this.rootPath = rootPath;
    this.fileExtensions = ['gs', 'ms', 'src'];
  }

  private getFromWorkspaceFolder(path: string): Uri {
    if (this.workspaceFolderUri == null) {
      console.warn(
        'Workspace folders are not available. Falling back to only relative paths.'
      );
      return Uri.joinPath(this.rootPath, path);
    }

    return Uri.joinPath(this.workspaceFolderUri, path);
  }

  private getFromRootPath(path: string): Uri {
    return Uri.joinPath(this.rootPath, path);
  }

  private getAlternativePaths(path: string): Uri[] {
    if (path.startsWith('/')) {
      return this.fileExtensions.map((ext) => {
        return this.getFromWorkspaceFolder(`${path}.${ext}`);
      });
    }
    return this.fileExtensions.map((ext) => {
      return this.getFromRootPath(`${path}.${ext}`);
    });
  }

  private getOriginalPath(path: string): Uri {
    if (path.startsWith('/')) {
      return this.getFromWorkspaceFolder(path);
    }
    return this.getFromRootPath(path);
  }

  getPath(path: string): Promise<Uri | null> {
    return findExistingPath(
      this.getOriginalPath(path),
      ...this.getAlternativePaths(path)
    );
  }
}