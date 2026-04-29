/**
 * Lightweight Google Stitch API client. Talks to the Stitch MCP/REST
 * endpoints using native fetch — no @google/stitch-sdk dependency.
 * Lazy-loaded at call-site; never imported at app startup.
 *
 * Authentication: requires a STITCH_API_KEY (Google AI API key with Stitch
 * access). Pass it via constructor options.
 *
 * The Stitch SDK communicates with an SSE-based MCP transport under the hood.
 * This client implements the simpler REST-style tool-call surface that the
 * SDK exposes, calling the same underlying endpoints.
 */

import type { CoreLogger } from '../../logger.js';
import type {
  StitchProject,
  StitchScreen,
  StitchScreenContent,
  StitchToolCallResult,
} from './types.js';

const STITCH_API_BASE = 'https://stitch.googleapis.com/v1';

export interface StitchClientOptions {
  apiKey: string;
  baseUrl?: string;
  logger?: CoreLogger;
}

export class StitchClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly logger: CoreLogger | undefined;

  constructor(opts: StitchClientOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? STITCH_API_BASE;
    this.logger = opts.logger;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    this.logger?.info('[stitch] step=api_request', { method, path });
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...(signal !== undefined ? { signal } : {}),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger?.error('[stitch] step=api_request.fail', {
        status: res.status,
        body: text.slice(0, 200),
      });
      throw new Error(`Stitch API ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  }

  /**
   * Call a Stitch MCP tool by name.
   */
  async callTool(
    toolName: string,
    args: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<StitchToolCallResult> {
    return this.request<StitchToolCallResult>(
      'POST',
      '/tools/call',
      { name: toolName, arguments: args },
      signal,
    );
  }

  async listProjects(signal?: AbortSignal): Promise<StitchProject[]> {
    const result = await this.callTool('list_projects', {}, signal);
    return parseProjectsFromToolResult(result);
  }

  async getProject(projectId: string, signal?: AbortSignal): Promise<StitchProject> {
    const result = await this.callTool('get_project', { project_id: projectId }, signal);
    const projects = parseProjectsFromToolResult(result);
    if (projects.length === 0) {
      throw new Error(`Stitch project not found: ${projectId}`);
    }
    return projects[0] as StitchProject;
  }

  async listScreens(projectId: string, signal?: AbortSignal): Promise<StitchScreen[]> {
    const result = await this.callTool('list_screens', { project_id: projectId }, signal);
    return parseScreensFromToolResult(result);
  }

  async getScreenHtml(projectId: string, screenId: string, signal?: AbortSignal): Promise<string> {
    const result = await this.callTool(
      'get_screen_html',
      { project_id: projectId, screen_id: screenId },
      signal,
    );
    return extractTextFromToolResult(result);
  }

  async getScreenImage(projectId: string, screenId: string, signal?: AbortSignal): Promise<string> {
    const result = await this.callTool(
      'get_screen_image',
      { project_id: projectId, screen_id: screenId },
      signal,
    );
    return extractTextFromToolResult(result);
  }

  async generateScreen(
    projectId: string,
    prompt: string,
    signal?: AbortSignal,
  ): Promise<StitchScreen> {
    const result = await this.callTool(
      'generate_screen',
      { project_id: projectId, prompt },
      signal,
    );
    const screens = parseScreensFromToolResult(result);
    if (screens.length === 0) {
      throw new Error('Stitch generate returned no screen');
    }
    return screens[0] as StitchScreen;
  }

  async createProject(title: string, signal?: AbortSignal): Promise<StitchProject> {
    const result = await this.callTool('create_project', { title }, signal);
    const projects = parseProjectsFromToolResult(result);
    if (projects.length === 0) {
      throw new Error('Stitch create_project returned no project');
    }
    return projects[0] as StitchProject;
  }

  async editScreen(
    projectId: string,
    screenId: string,
    editPrompt: string,
    signal?: AbortSignal,
  ): Promise<StitchScreen> {
    const result = await this.callTool(
      'edit_screen',
      { project_id: projectId, screen_id: screenId, prompt: editPrompt },
      signal,
    );
    const screens = parseScreensFromToolResult(result);
    if (screens.length === 0) {
      throw new Error('Stitch edit returned no screen');
    }
    return screens[0] as StitchScreen;
  }
}

function extractTextFromToolResult(result: StitchToolCallResult): string {
  for (const item of result.content) {
    if (item.type === 'text' && item.text !== undefined) {
      return item.text;
    }
  }
  return '';
}

function parseProjectsFromToolResult(result: StitchToolCallResult): StitchProject[] {
  const text = extractTextFromToolResult(result);
  if (!text) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed as StitchProject[];
    if (typeof parsed === 'object' && parsed !== null) return [parsed as StitchProject];
    return [];
  } catch {
    return [];
  }
}

function parseScreensFromToolResult(result: StitchToolCallResult): StitchScreen[] {
  const text = extractTextFromToolResult(result);
  if (!text) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed as StitchScreen[];
    if (typeof parsed === 'object' && parsed !== null) return [parsed as StitchScreen];
    return [];
  } catch {
    return [];
  }
}
