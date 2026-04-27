/**
 * Integrations IPC handlers — Figma and Google Stitch.
 *
 * Channels:
 *   integrations:v1:get-settings         — current integration settings
 *   integrations:v1:update-settings      — update Figma/Stitch settings
 *   integrations:v1:figma:get-file       — fetch a Figma file by key/URL
 *   integrations:v1:figma:extract-tokens — extract design tokens from a Figma file
 *   integrations:v1:stitch:list-projects — list Stitch projects
 *   integrations:v1:stitch:list-screens  — list screens in a Stitch project
 *   integrations:v1:stitch:import-screen — import a Stitch screen (HTML + tokens)
 */

import {
  FigmaClient,
  type FigmaFileResponse,
  StitchClient,
  type StitchImportResult,
  type StitchProject,
  type StitchScreen,
  extractFigmaTokens,
  importStitchScreen,
} from '@open-codesign/core';
import type { DesignToken, IntegrationSettings } from '@open-codesign/shared';
import { writeConfig } from './config';
import { ipcMain } from './electron-runtime';
import { buildSecretRef, decryptSecret } from './keychain';
import { getLogger } from './logger';
import { getCachedConfig, setCachedConfig } from './onboarding-ipc';

const logger = getLogger('integrations-ipc');

export interface IntegrationSettingsView {
  figma: { enabled: boolean; hasKey: boolean };
  stitch: { enabled: boolean; hasKey: boolean };
}

export interface FigmaFileResult {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  componentCount: number;
  styleCount: number;
}

export interface FigmaTokensResult {
  tokens: DesignToken[];
  fileName: string;
}

function getIntegrationSettings(): IntegrationSettings {
  const cfg = getCachedConfig();
  if (cfg?.integrations) return cfg.integrations;
  return { schemaVersion: 1, figma: { enabled: false }, stitch: { enabled: false } };
}

function decryptIntegrationKey(service: 'figma' | 'stitch'): string | null {
  const settings = getIntegrationSettings();
  const entry = settings[service];
  if (!entry.apiKey) return null;
  try {
    return decryptSecret(entry.apiKey.ciphertext);
  } catch {
    logger.warn(`[integrations] ${service}.decrypt_failed`);
    return null;
  }
}

export function registerIntegrationsIpc(): void {
  ipcMain.handle('integrations:v1:get-settings', (): IntegrationSettingsView => {
    const s = getIntegrationSettings();
    return {
      figma: { enabled: s.figma.enabled, hasKey: !!s.figma.apiKey },
      stitch: { enabled: s.stitch.enabled, hasKey: !!s.stitch.apiKey },
    };
  });

  ipcMain.handle(
    'integrations:v1:update-settings',
    async (
      _event: unknown,
      input: {
        figma?: { enabled?: boolean; apiKey?: string };
        stitch?: { enabled?: boolean; apiKey?: string };
      },
    ): Promise<IntegrationSettingsView> => {
      const cfg = getCachedConfig();
      if (!cfg) throw new Error('Config not loaded');

      const current = getIntegrationSettings();

      if (input.figma) {
        if (input.figma.enabled !== undefined) current.figma.enabled = input.figma.enabled;
        if (input.figma.apiKey !== undefined && input.figma.apiKey.length > 0) {
          current.figma.apiKey = buildSecretRef(input.figma.apiKey);
        }
      }
      if (input.stitch) {
        if (input.stitch.enabled !== undefined) current.stitch.enabled = input.stitch.enabled;
        if (input.stitch.apiKey !== undefined && input.stitch.apiKey.length > 0) {
          current.stitch.apiKey = buildSecretRef(input.stitch.apiKey);
        }
      }

      cfg.integrations = current;
      await writeConfig(cfg);
      setCachedConfig(cfg);

      return {
        figma: { enabled: current.figma.enabled, hasKey: !!current.figma.apiKey },
        stitch: { enabled: current.stitch.enabled, hasKey: !!current.stitch.apiKey },
      };
    },
  );

  // ── Figma ──────────────────────────────────────────────────────────────────

  ipcMain.handle(
    'integrations:v1:figma:get-file',
    async (_event: unknown, input: { fileKeyOrUrl: string }): Promise<FigmaFileResult> => {
      const apiKey = decryptIntegrationKey('figma');
      if (!apiKey) throw new Error('Figma API key not configured');

      const fileKey = FigmaClient.parseFileKey(input.fileKeyOrUrl);
      const client = new FigmaClient({ apiKey, logger });
      const file = await client.getFile(fileKey);

      return {
        name: file.name,
        lastModified: file.lastModified,
        thumbnailUrl: file.thumbnailUrl,
        componentCount: Object.keys(file.components).length,
        styleCount: Object.keys(file.styles).length,
      };
    },
  );

  ipcMain.handle(
    'integrations:v1:figma:extract-tokens',
    async (_event: unknown, input: { fileKeyOrUrl: string }): Promise<FigmaTokensResult> => {
      const apiKey = decryptIntegrationKey('figma');
      if (!apiKey) throw new Error('Figma API key not configured');

      const fileKey = FigmaClient.parseFileKey(input.fileKeyOrUrl);
      const client = new FigmaClient({ apiKey, logger });
      const file: FigmaFileResponse = await client.getFile(fileKey);
      const tokens = extractFigmaTokens(file, { logger });

      return { tokens, fileName: file.name };
    },
  );

  // ── Google Stitch ──────────────────────────────────────────────────────────

  ipcMain.handle('integrations:v1:stitch:list-projects', async (): Promise<StitchProject[]> => {
    const apiKey = decryptIntegrationKey('stitch');
    if (!apiKey) throw new Error('Stitch API key not configured');

    const client = new StitchClient({ apiKey, logger });
    return client.listProjects();
  });

  ipcMain.handle(
    'integrations:v1:stitch:list-screens',
    async (_event: unknown, input: { projectId: string }): Promise<StitchScreen[]> => {
      const apiKey = decryptIntegrationKey('stitch');
      if (!apiKey) throw new Error('Stitch API key not configured');

      const client = new StitchClient({ apiKey, logger });
      return client.listScreens(input.projectId);
    },
  );

  ipcMain.handle(
    'integrations:v1:stitch:import-screen',
    async (
      _event: unknown,
      input: { projectId: string; screenId: string },
    ): Promise<StitchImportResult> => {
      const apiKey = decryptIntegrationKey('stitch');
      if (!apiKey) throw new Error('Stitch API key not configured');

      const client = new StitchClient({ apiKey, logger });
      return importStitchScreen(client, input.projectId, input.screenId, { logger });
    },
  );
}
