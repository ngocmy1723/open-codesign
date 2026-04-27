/**
 * Extract DesignToken[] from a Figma file response. Pulls colors, fonts,
 * spacing, radius, and shadows from document styles and node properties.
 */

import type { DesignToken } from '@open-codesign/shared';
import type { CoreLogger } from '../../logger.js';
import { FigmaClient } from './client.js';
import type { FigmaColor, FigmaFileResponse, FigmaNode } from './types.js';

function figmaColorToHex(c: FigmaColor): string {
  const r = Math.round(c.r * 255);
  const g = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
  if (c.a < 1) {
    const a = Math.round(c.a * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${a.toString(16).padStart(2, '0')}`;
  }
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function figmaColorToRgba(c: FigmaColor): string {
  const r = Math.round(c.r * 255);
  const g = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
  if (c.a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${Number.parseFloat(c.a.toFixed(2))})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

const MAX_TOKENS_PER_TYPE = 48;

interface DedupeContext {
  seenColors: Set<string>;
  seenFonts: Set<string>;
  seenRadii: Set<string>;
}

function pushToken(
  tokens: DesignToken[],
  type: DesignToken['type'],
  name: string,
  value: string,
  group?: string,
): void {
  const typeCount = tokens.filter((t) => t.type === type).length;
  if (typeCount >= MAX_TOKENS_PER_TYPE) return;
  tokens.push({
    schemaVersion: 1,
    type,
    name,
    value,
    origin: 'figma',
    ...(group !== undefined ? { group } : {}),
  });
}

function extractColorsFromNode(node: FigmaNode, tokens: DesignToken[], ctx: DedupeContext): void {
  if (node.fills) {
    for (const fill of node.fills) {
      if (fill.type === 'SOLID' && fill.color) {
        const hex = figmaColorToHex(fill.color);
        if (!ctx.seenColors.has(hex)) {
          ctx.seenColors.add(hex);
          const rgba = figmaColorToRgba(fill.color);
          pushToken(tokens, 'color', `fill.${node.name}`, rgba, 'fill');
        }
      }
    }
  }
  if (node.strokes) {
    for (const stroke of node.strokes) {
      if (stroke.type === 'SOLID' && stroke.color) {
        const hex = figmaColorToHex(stroke.color);
        if (!ctx.seenColors.has(hex)) {
          ctx.seenColors.add(hex);
          const rgba = figmaColorToRgba(stroke.color);
          pushToken(tokens, 'color', `stroke.${node.name}`, rgba, 'stroke');
        }
      }
    }
  }
}

function extractTypographyFromNode(
  node: FigmaNode,
  tokens: DesignToken[],
  ctx: DedupeContext,
): void {
  if (!node.style) return;
  const { fontFamily, fontSize, lineHeightPx } = node.style;
  if (fontFamily && !ctx.seenFonts.has(fontFamily)) {
    ctx.seenFonts.add(fontFamily);
    pushToken(tokens, 'fontFamily', `font.${fontFamily}`, fontFamily, 'typography');
  }
  if (fontSize) {
    pushToken(tokens, 'fontSize', `fontSize.${node.name}`, `${fontSize}px`, 'typography');
  }
  if (lineHeightPx) {
    pushToken(tokens, 'lineHeight', `lineHeight.${node.name}`, `${lineHeightPx}px`, 'typography');
  }
}

function extractRadiusFromNode(node: FigmaNode, tokens: DesignToken[], ctx: DedupeContext): void {
  if (node.cornerRadius !== undefined && node.cornerRadius > 0) {
    const val = `${node.cornerRadius}px`;
    if (!ctx.seenRadii.has(val)) {
      ctx.seenRadii.add(val);
      pushToken(tokens, 'radius', `radius.${node.name}`, val, 'radius');
    }
  }
}

function extractSpacingFromNode(node: FigmaNode, tokens: DesignToken[]): void {
  if (node.itemSpacing !== undefined && node.itemSpacing > 0) {
    pushToken(tokens, 'spacing', `spacing.gap.${node.name}`, `${node.itemSpacing}px`, 'spacing');
  }
  if (node.paddingLeft !== undefined && node.paddingLeft > 0) {
    pushToken(
      tokens,
      'spacing',
      `spacing.padding.${node.name}`,
      `${node.paddingLeft}px`,
      'spacing',
    );
  }
}

function extractShadowsFromNode(node: FigmaNode, tokens: DesignToken[]): void {
  if (!node.effects) return;
  for (const effect of node.effects) {
    if (
      (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') &&
      effect.visible &&
      effect.color
    ) {
      const ox = effect.offset?.x ?? 0;
      const oy = effect.offset?.y ?? 0;
      const r = effect.radius ?? 0;
      const s = effect.spread ?? 0;
      const rgba = figmaColorToRgba(effect.color);
      const val = `${ox}px ${oy}px ${r}px ${s}px ${rgba}`;
      pushToken(tokens, 'shadow', `shadow.${node.name}`, val, 'shadow');
    }
  }
}

export interface ExtractFigmaTokensOptions {
  logger?: CoreLogger;
}

/**
 * Extract design tokens from a Figma file response. Walks the document tree
 * and pulls colors, fonts, spacing, radius, and shadows.
 */
export function extractFigmaTokens(
  file: FigmaFileResponse,
  opts: ExtractFigmaTokensOptions = {},
): DesignToken[] {
  const ctx: DedupeContext = {
    seenColors: new Set(),
    seenFonts: new Set(),
    seenRadii: new Set(),
  };

  const tokens: DesignToken[] = [];
  const allNodes = FigmaClient.collectNodes(
    file.document,
    new Set([
      'RECTANGLE',
      'ELLIPSE',
      'FRAME',
      'GROUP',
      'COMPONENT',
      'INSTANCE',
      'TEXT',
      'VECTOR',
      'LINE',
      'SECTION',
    ]),
  );

  opts.logger?.info('[figma] step=extract_tokens', { nodeCount: allNodes.length });

  for (const node of allNodes) {
    extractColorsFromNode(node, tokens, ctx);
    extractTypographyFromNode(node, tokens, ctx);
    extractRadiusFromNode(node, tokens, ctx);
    extractSpacingFromNode(node, tokens);
    extractShadowsFromNode(node, tokens);
  }

  opts.logger?.info('[figma] step=extract_tokens.ok', { tokenCount: tokens.length });
  return tokens;
}
