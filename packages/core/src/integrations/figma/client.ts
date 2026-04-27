/**
 * Lightweight Figma REST API client. Uses native fetch — no SDK dependency.
 * Lazy-loaded at call-site; never imported at app startup.
 */

import type { CoreLogger } from '../../logger.js';
import type { FigmaFileNodesResponse, FigmaFileResponse, FigmaNode } from './types.js';

const FIGMA_API_BASE = 'https://api.figma.com';

export interface FigmaClientOptions {
  apiKey: string;
  logger?: CoreLogger;
}

export class FigmaClient {
  private readonly apiKey: string;
  private readonly logger: CoreLogger | undefined;

  constructor(opts: FigmaClientOptions) {
    this.apiKey = opts.apiKey;
    this.logger = opts.logger;
  }

  private async request<T>(path: string, signal?: AbortSignal): Promise<T> {
    const url = `${FIGMA_API_BASE}${path}`;
    this.logger?.info('[figma] step=api_request', { path });
    const res = await fetch(url, {
      headers: { 'X-Figma-Token': this.apiKey },
      ...(signal !== undefined ? { signal } : {}),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger?.error('[figma] step=api_request.fail', {
        status: res.status,
        body: body.slice(0, 200),
      });
      throw new Error(`Figma API ${res.status}: ${body.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  }

  /**
   * Parse a Figma file key from a URL or return as-is if already a key.
   * Supports: https://www.figma.com/file/<key>/..., https://www.figma.com/design/<key>/...
   */
  static parseFileKey(input: string): string {
    const trimmed = input.trim();
    const urlMatch = /figma\.com\/(?:file|design)\/([A-Za-z0-9]+)/.exec(trimmed);
    if (urlMatch?.[1]) return urlMatch[1];
    if (/^[A-Za-z0-9]+$/.test(trimmed)) return trimmed;
    throw new Error(`Cannot parse Figma file key from: ${trimmed}`);
  }

  async getFile(fileKey: string, signal?: AbortSignal): Promise<FigmaFileResponse> {
    return this.request<FigmaFileResponse>(
      `/v1/files/${encodeURIComponent(fileKey)}?depth=3`,
      signal,
    );
  }

  async getFileNodes(
    fileKey: string,
    nodeIds: string[],
    signal?: AbortSignal,
  ): Promise<FigmaFileNodesResponse> {
    const ids = nodeIds.map(encodeURIComponent).join(',');
    return this.request<FigmaFileNodesResponse>(
      `/v1/files/${encodeURIComponent(fileKey)}/nodes?ids=${ids}`,
      signal,
    );
  }

  async getImageExport(
    fileKey: string,
    nodeIds: string[],
    opts?: { format?: 'png' | 'svg' | 'jpg'; scale?: number },
    signal?: AbortSignal,
  ): Promise<Record<string, string>> {
    const ids = nodeIds.map(encodeURIComponent).join(',');
    const format = opts?.format ?? 'png';
    const scale = opts?.scale ?? 2;
    const data = await this.request<{ images: Record<string, string> }>(
      `/v1/images/${encodeURIComponent(fileKey)}?ids=${ids}&format=${format}&scale=${scale}`,
      signal,
    );
    return data.images;
  }

  /**
   * Recursively collect all nodes of given types from a Figma document tree.
   */
  static collectNodes(root: FigmaNode, types: Set<string>): FigmaNode[] {
    const result: FigmaNode[] = [];
    const stack: FigmaNode[] = [root];
    while (stack.length > 0) {
      const node = stack.pop();
      if (node === undefined) continue;
      if (types.has(node.type)) result.push(node);
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          const child = node.children[i];
          if (child !== undefined) stack.push(child);
        }
      }
    }
    return result;
  }
}
