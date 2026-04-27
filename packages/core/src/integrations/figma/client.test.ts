import { describe, expect, it } from 'vitest';
import { FigmaClient } from './client.js';

describe('FigmaClient.parseFileKey()', () => {
  it('extracts key from /file/ URL', () => {
    expect(FigmaClient.parseFileKey('https://www.figma.com/file/ABC123xyz/My-Design')).toBe(
      'ABC123xyz',
    );
  });

  it('extracts key from /design/ URL', () => {
    expect(FigmaClient.parseFileKey('https://www.figma.com/design/XYZ789abc/Landing')).toBe(
      'XYZ789abc',
    );
  });

  it('returns raw key when input is already a key', () => {
    expect(FigmaClient.parseFileKey('ABC123xyz')).toBe('ABC123xyz');
  });

  it('trims whitespace', () => {
    expect(FigmaClient.parseFileKey('  ABC123xyz  ')).toBe('ABC123xyz');
  });

  it('throws for invalid input', () => {
    expect(() => FigmaClient.parseFileKey('not a valid key!')).toThrow();
  });
});

describe('FigmaClient.collectNodes()', () => {
  it('collects nodes of specified types', () => {
    const root = {
      id: '0:0',
      name: 'Doc',
      type: 'DOCUMENT',
      children: [
        {
          id: '1:0',
          name: 'Page',
          type: 'CANVAS',
          children: [
            { id: '1:1', name: 'Rect', type: 'RECTANGLE' },
            { id: '1:2', name: 'Text', type: 'TEXT' },
            {
              id: '1:3',
              name: 'Frame',
              type: 'FRAME',
              children: [{ id: '1:4', name: 'Inner', type: 'RECTANGLE' }],
            },
          ],
        },
      ],
    };
    const rects = FigmaClient.collectNodes(root, new Set(['RECTANGLE']));
    expect(rects.length).toBe(2);
    expect(rects.map((n) => n.name)).toContain('Rect');
    expect(rects.map((n) => n.name)).toContain('Inner');
  });

  it('returns empty for no matching types', () => {
    const root = { id: '0:0', name: 'Doc', type: 'DOCUMENT' };
    const result = FigmaClient.collectNodes(root, new Set(['ELLIPSE']));
    expect(result).toEqual([]);
  });
});
