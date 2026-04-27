import { describe, expect, it } from 'vitest';
import { extractFigmaTokens } from './tokenExtractor.js';
import type { FigmaFileResponse, FigmaNode } from './types.js';

function makeFile(nodes: FigmaNode[]): FigmaFileResponse {
  return {
    name: 'Test File',
    lastModified: '2024-01-01T00:00:00Z',
    thumbnailUrl: 'https://example.com/thumb.png',
    version: '1',
    document: {
      id: '0:0',
      name: 'Document',
      type: 'DOCUMENT',
      children: [
        {
          id: '0:1',
          name: 'Page 1',
          type: 'CANVAS',
          children: nodes,
        },
      ],
    },
    components: {},
    styles: {},
  };
}

describe('extractFigmaTokens()', () => {
  it('extracts color tokens from solid fills', () => {
    const file = makeFile([
      {
        id: '1:1',
        name: 'PrimaryBox',
        type: 'RECTANGLE',
        fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0, a: 1 } }],
      },
    ]);
    const tokens = extractFigmaTokens(file);
    const colors = tokens.filter((t) => t.type === 'color');

    expect(colors.length).toBe(1);
    expect(colors[0]?.value).toBe('rgb(255, 0, 0)');
    expect(colors[0]?.origin).toBe('figma');
    expect(colors[0]?.name).toBe('fill.PrimaryBox');
  });

  it('extracts colors with alpha as rgba', () => {
    const file = makeFile([
      {
        id: '1:1',
        name: 'Overlay',
        type: 'RECTANGLE',
        fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 0.5 } }],
      },
    ]);
    const tokens = extractFigmaTokens(file);
    const colors = tokens.filter((t) => t.type === 'color');

    expect(colors[0]?.value).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('deduplicates colors by hex value', () => {
    const file = makeFile([
      {
        id: '1:1',
        name: 'Box1',
        type: 'RECTANGLE',
        fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0, a: 1 } }],
      },
      {
        id: '1:2',
        name: 'Box2',
        type: 'RECTANGLE',
        fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0, a: 1 } }],
      },
    ]);
    const tokens = extractFigmaTokens(file);
    const colors = tokens.filter((t) => t.type === 'color');

    expect(colors.length).toBe(1);
  });

  it('extracts font family tokens from text nodes', () => {
    const file = makeFile([
      {
        id: '1:1',
        name: 'Heading',
        type: 'TEXT',
        style: { fontFamily: 'Inter', fontSize: 24, fontWeight: 700 },
      },
    ]);
    const tokens = extractFigmaTokens(file);
    const fonts = tokens.filter((t) => t.type === 'fontFamily');
    const sizes = tokens.filter((t) => t.type === 'fontSize');

    expect(fonts.length).toBe(1);
    expect(fonts[0]?.value).toBe('Inter');
    expect(sizes.length).toBe(1);
    expect(sizes[0]?.value).toBe('24px');
  });

  it('deduplicates font families', () => {
    const file = makeFile([
      {
        id: '1:1',
        name: 'H1',
        type: 'TEXT',
        style: { fontFamily: 'Inter', fontSize: 32, fontWeight: 700 },
      },
      {
        id: '1:2',
        name: 'H2',
        type: 'TEXT',
        style: { fontFamily: 'Inter', fontSize: 24, fontWeight: 600 },
      },
    ]);
    const tokens = extractFigmaTokens(file);
    const fonts = tokens.filter((t) => t.type === 'fontFamily');

    expect(fonts.length).toBe(1);
  });

  it('extracts border radius tokens', () => {
    const file = makeFile([
      {
        id: '1:1',
        name: 'Card',
        type: 'RECTANGLE',
        cornerRadius: 8,
      },
    ]);
    const tokens = extractFigmaTokens(file);
    const radii = tokens.filter((t) => t.type === 'radius');

    expect(radii.length).toBe(1);
    expect(radii[0]?.value).toBe('8px');
    expect(radii[0]?.name).toBe('radius.Card');
  });

  it('extracts spacing from itemSpacing and padding', () => {
    const file = makeFile([
      {
        id: '1:1',
        name: 'Stack',
        type: 'FRAME',
        itemSpacing: 16,
        paddingLeft: 24,
      },
    ]);
    const tokens = extractFigmaTokens(file);
    const spacing = tokens.filter((t) => t.type === 'spacing');

    expect(spacing.length).toBe(2);
    expect(spacing.some((t) => t.value === '16px')).toBe(true);
    expect(spacing.some((t) => t.value === '24px')).toBe(true);
  });

  it('extracts shadow tokens from drop shadows', () => {
    const file = makeFile([
      {
        id: '1:1',
        name: 'Elevated',
        type: 'RECTANGLE',
        effects: [
          {
            type: 'DROP_SHADOW',
            visible: true,
            color: { r: 0, g: 0, b: 0, a: 0.25 },
            offset: { x: 0, y: 4 },
            radius: 8,
            spread: 0,
          },
        ],
      },
    ]);
    const tokens = extractFigmaTokens(file);
    const shadows = tokens.filter((t) => t.type === 'shadow');

    expect(shadows.length).toBe(1);
    expect(shadows[0]?.value).toContain('0px 4px 8px');
  });

  it('skips invisible effects', () => {
    const file = makeFile([
      {
        id: '1:1',
        name: 'Ghost',
        type: 'RECTANGLE',
        effects: [
          {
            type: 'DROP_SHADOW',
            visible: false,
            color: { r: 0, g: 0, b: 0, a: 0.25 },
            offset: { x: 0, y: 4 },
            radius: 8,
          },
        ],
      },
    ]);
    const tokens = extractFigmaTokens(file);
    const shadows = tokens.filter((t) => t.type === 'shadow');

    expect(shadows.length).toBe(0);
  });

  it('sets origin to figma on all tokens', () => {
    const file = makeFile([
      {
        id: '1:1',
        name: 'Mixed',
        type: 'FRAME',
        fills: [{ type: 'SOLID', color: { r: 0.2, g: 0.4, b: 0.6, a: 1 } }],
        cornerRadius: 4,
        itemSpacing: 8,
      },
    ]);
    const tokens = extractFigmaTokens(file);

    expect(tokens.length).toBeGreaterThan(0);
    for (const t of tokens) {
      expect(t.origin).toBe('figma');
    }
  });

  it('returns empty array for file with no extractable nodes', () => {
    const file = makeFile([]);
    const tokens = extractFigmaTokens(file);

    expect(tokens).toEqual([]);
  });

  it('extracts lineHeight tokens', () => {
    const file = makeFile([
      {
        id: '1:1',
        name: 'Body',
        type: 'TEXT',
        style: { fontFamily: 'Roboto', fontSize: 16, fontWeight: 400, lineHeightPx: 24 },
      },
    ]);
    const tokens = extractFigmaTokens(file);
    const lineHeights = tokens.filter((t) => t.type === 'lineHeight');

    expect(lineHeights.length).toBe(1);
    expect(lineHeights[0]?.value).toBe('24px');
  });
});
