import { ResourceHandler as InterpreterResourceHandler } from 'greybel-interpreter';
import {
  ResourceHandler as TranspilerResourceHandler,
  ResourceProvider as TranspilerResourceProviderBase
} from 'greybel-transpiler';
import path from 'path';
// @ts-ignore: No type definitions
import { TextDecoderLite as TextDecoder } from 'text-encoder-lite';
import vscode, { Uri } from 'vscode';

const fs = vscode.workspace.fs;

export class PseudoFS {
  static basename(file: string): string {
    return path.basename(file);
  }

  static dirname(file: string): string {
    return path.dirname(file);
  }

  static resolve(file: string): string {
    return path.resolve(file);
  }
}

export async function tryToGet(
  targetUri: Uri
): Promise<Uint8Array | null> {
  try {
    return await fs.readFile(targetUri);
  } catch (err) {
    console.error(err);
  }

  return null;
}

export async function tryToGetPath(
  targetUri: Uri,
  altTargetUri: Uri
): Promise<Uri> {
  if (await tryToGet(targetUri)) {
    return targetUri;
  } else if (await tryToGet(altTargetUri)) {
    return altTargetUri;
  }
  return targetUri;
}

export async function tryToDecode(targetUri: Uri): Promise<string> {
  const out = await tryToGet(targetUri);

  if (out) {
    const content = new TextDecoder().decode(out);
    return content;
  }

  return '';
}

export class TranspilerResourceProvider extends TranspilerResourceProviderBase {
  getHandler(): TranspilerResourceHandler {
    return {
      getTargetRelativeTo: async (
        source: string,
        target: string
      ): Promise<string> => {
        const base = target.startsWith('/') ? vscode.workspace.workspaceFolders[0]?.uri : Uri.joinPath(Uri.parse(source), '..');
        const uri = Uri.joinPath(base, target);
        const uriAlt = Uri.joinPath(base, `${target}.ms`);
        const result = await tryToGetPath(uri, uriAlt);
        return result.toString();
      },
      has: async (target: string): Promise<boolean> => {
        return !!(await tryToGet(Uri.parse(target)));
      },
      get: (target: string): Promise<string> => {
        return tryToDecode(Uri.parse(target));
      },
      resolve: (target: string): Promise<string> => {
        return Promise.resolve(Uri.parse(target).toString());
      }
    };
  }
}

export class InterpreterResourceProvider extends InterpreterResourceHandler {
  async getTargetRelativeTo(source: string, target: string): Promise<string> {
    const base = target.startsWith('/') ? vscode.workspace.workspaceFolders[0]?.uri : Uri.joinPath(Uri.parse(source), '..');
    const uri = Uri.joinPath(base, target);
    const uriAlt = Uri.joinPath(base, `${target}.ms`);
    const result = await tryToGetPath(uri, uriAlt);
    return result.toString();
  }

  async has(target: string): Promise<boolean> {
    return !!(await tryToGet(Uri.parse(target)));
  }

  get(target: string): Promise<string> {
    return tryToDecode(Uri.parse(target));
  }

  resolve(target: string): Promise<string> {
    return Promise.resolve(Uri.parse(target).toString());
  }
}