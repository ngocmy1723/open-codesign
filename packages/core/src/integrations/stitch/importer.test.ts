import { describe, expect, it } from 'vitest';
import { extractStitchTokens } from './importer.js';

describe('extractStitchTokens()', () => {
  it('extracts CSS custom property color tokens', () => {
    const html = `
      <style>
        :root {
          --primary-color: #3b82f6;
          --bg-surface: #f8f9fa;
        }
      </style>
    `;
    const tokens = extractStitchTokens(html);
    const colors = tokens.filter((t) => t.type === 'color');

    expect(colors.length).toBeGreaterThanOrEqual(2);
    expect(colors.some((t) => t.value === '#3b82f6')).toBe(true);
    expect(colors.some((t) => t.value === '#f8f9fa')).toBe(true);
  });

  it('extracts font-family tokens from CSS variables', () => {
    const html = `
      <style>
        :root {
          --font-family-sans: 'Inter', sans-serif;
        }
      </style>
    `;
    const tokens = extractStitchTokens(html);
    const fonts = tokens.filter((t) => t.type === 'fontFamily');

    expect(fonts.some((t) => t.name.includes('font-family-sans'))).toBe(true);
  });

  it('extracts radius tokens from CSS variables', () => {
    const html = `
      <style>
        :root {
          --radius-md: 8px;
          --rounded-lg: 12px;
        }
      </style>
    `;
    const tokens = extractStitchTokens(html);
    const radii = tokens.filter((t) => t.type === 'radius');

    expect(radii.length).toBe(2);
  });

  it('extracts spacing tokens from CSS variables', () => {
    const html = `
      <style>
        :root {
          --spacing-sm: 8px;
          --gap-md: 16px;
        }
      </style>
    `;
    const tokens = extractStitchTokens(html);
    const spacing = tokens.filter((t) => t.type === 'spacing');

    expect(spacing.length).toBe(2);
  });

  it('extracts inline colors from HTML', () => {
    const html = `
      <div style="background: #ff6600; color: rgba(0,0,0,0.87);">Hello</div>
    `;
    const tokens = extractStitchTokens(html);
    const colors = tokens.filter((t) => t.type === 'color');

    expect(colors.some((t) => t.value === '#ff6600')).toBe(true);
    expect(colors.some((t) => t.value === 'rgba(0,0,0,0.87)')).toBe(true);
  });

  it('extracts font-family from inline styles', () => {
    const html = `
      <p style="font-family: 'Roboto', Arial, sans-serif;">Text</p>
    `;
    const tokens = extractStitchTokens(html);
    const fonts = tokens.filter((t) => t.type === 'fontFamily');

    expect(fonts.some((t) => t.value === 'Roboto')).toBe(true);
    expect(fonts.some((t) => t.value === 'Arial')).toBe(true);
  });

  it('deduplicates inline color values', () => {
    const html = `
      <div style="color: #333;">A</div>
      <div style="color: #333;">B</div>
    `;
    const tokens = extractStitchTokens(html);
    const colors = tokens.filter((t) => t.type === 'color' && t.value === '#333');

    expect(colors.length).toBe(1);
  });

  it('sets origin to stitch on all tokens', () => {
    const html = `
      <style>:root { --primary-color: blue; }</style>
      <div style="border-radius: 4px;">X</div>
    `;
    const tokens = extractStitchTokens(html);

    for (const t of tokens) {
      expect(t.origin).toBe('stitch');
    }
  });

  it('returns empty array for plain text', () => {
    const tokens = extractStitchTokens('Hello, World!');
    expect(tokens).toEqual([]);
  });

  it('extracts shadow tokens from CSS variables', () => {
    const html = `
      <style>
        :root {
          --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
        }
      </style>
    `;
    const tokens = extractStitchTokens(html);
    const shadows = tokens.filter((t) => t.type === 'shadow');

    expect(shadows.length).toBe(1);
  });
});
