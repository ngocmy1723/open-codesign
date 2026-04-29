/**
 * Import design context from a Google Stitch screen. Fetches the screen's
 * HTML and extracts design tokens (colors, fonts, spacing) from inline
 * styles and CSS custom properties.
 */

import type { DesignToken } from '@open-codesign/shared';
import type { CoreLogger } from '../../logger.js';
import type { StitchClient } from './client.js';

type TokenType = DesignToken['type'];

const MAX_TOKENS = 48;

export interface StitchImportResult {
  html: string;
  tokens: DesignToken[];
  imageUrl: string;
}

export interface StitchImportOptions {
  logger?: CoreLogger;
}

function pushToken(
  tokens: DesignToken[],
  type: TokenType,
  name: string,
  value: string,
  group?: string,
): boolean {
  if (tokens.length >= MAX_TOKENS) return false;
  const exists = tokens.some((t) => t.type === type && t.value === value);
  if (exists) return false;
  tokens.push({
    schemaVersion: 1,
    type,
    name,
    value,
    origin: 'stitch',
    ...(group !== undefined ? { group } : {}),
  });
  return true;
}

function extractCssVarTokens(html: string, tokens: DesignToken[]): void {
  const varRe = /--([\w-]+)\s*:\s*([^;}{]+);/g;
  for (const match of html.matchAll(varRe)) {
    const prop = match[1]?.trim();
    const value = match[2]?.trim();
    if (!prop || !value) continue;

    const p = prop.toLowerCase();
    if (/color|accent|bg|fg|primary|secondary|surface|text-color/.test(p)) {
      pushToken(tokens, 'color', `stitch.${prop}`, value, 'color');
    } else if (/font-family|typeface/.test(p)) {
      pushToken(tokens, 'fontFamily', `stitch.${prop}`, value, 'typography');
    } else if (/font-size/.test(p)) {
      pushToken(tokens, 'fontSize', `stitch.${prop}`, value, 'typography');
    } else if (/radius|rounded/.test(p)) {
      pushToken(tokens, 'radius', `stitch.${prop}`, value, 'radius');
    } else if (/spacing|gap|padding|margin/.test(p)) {
      pushToken(tokens, 'spacing', `stitch.${prop}`, value, 'spacing');
    } else if (/shadow/.test(p)) {
      pushToken(tokens, 'shadow', `stitch.${prop}`, value, 'shadow');
    }
  }
}

function extractInlineColors(html: string, tokens: DesignToken[]): void {
  const colorRe = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
  const seen = new Set<string>();
  let idx = 0;
  for (const match of html.matchAll(colorRe)) {
    const value = match[0];
    if (seen.has(value)) continue;
    seen.add(value);
    pushToken(tokens, 'color', `stitch.inline-color-${idx}`, value, 'inline');
    idx++;
  }
}

function extractFontFamilies(html: string, tokens: DesignToken[]): void {
  const fontRe = /font-family\s*:\s*([^;}]+)/gi;
  const seen = new Set<string>();
  for (const match of html.matchAll(fontRe)) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    const families = raw.split(',').map((f) => f.trim().replace(/^['"]|['"]$/g, ''));
    for (const family of families) {
      if (!family || seen.has(family.toLowerCase())) continue;
      seen.add(family.toLowerCase());
      pushToken(tokens, 'fontFamily', `stitch.font.${family}`, family, 'typography');
    }
  }
}

/**
 * Extract design tokens from Stitch-generated HTML.
 */
export function extractStitchTokens(html: string, opts: StitchImportOptions = {}): DesignToken[] {
  const tokens: DesignToken[] = [];
  opts.logger?.info('[stitch] step=extract_tokens');

  extractCssVarTokens(html, tokens);
  extractInlineColors(html, tokens);
  extractFontFamilies(html, tokens);

  opts.logger?.info('[stitch] step=extract_tokens.ok', { tokenCount: tokens.length });
  return tokens;
}

/**
 * Import a Stitch screen: fetches HTML + image and extracts design tokens.
 */
export async function importStitchScreen(
  client: StitchClient,
  projectId: string,
  screenId: string,
  opts: StitchImportOptions = {},
): Promise<StitchImportResult> {
  opts.logger?.info('[stitch] step=import_screen', { projectId, screenId });

  const [html, imageUrl] = await Promise.all([
    client.getScreenHtml(projectId, screenId),
    client.getScreenImage(projectId, screenId),
  ]);

  const tokens = extractStitchTokens(html, opts);

  opts.logger?.info('[stitch] step=import_screen.ok', {
    htmlLength: html.length,
    tokenCount: tokens.length,
  });

  return { html, tokens, imageUrl };
}
