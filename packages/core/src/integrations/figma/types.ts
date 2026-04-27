/**
 * Figma REST API response types — lightweight subset covering the fields
 * Open CoDesign needs for design-token extraction and file inspection.
 * Avoids importing any Figma SDK.
 */

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaTypeStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeightPx?: number;
  letterSpacing?: number;
}

export interface FigmaEffect {
  type: string;
  visible: boolean;
  color?: FigmaColor;
  offset?: { x: number; y: number };
  radius?: number;
  spread?: number;
}

export interface FigmaStyleEntry {
  key: string;
  name: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
  description: string;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  fills?: Array<{ type: string; color?: FigmaColor; opacity?: number }>;
  strokes?: Array<{ type: string; color?: FigmaColor }>;
  cornerRadius?: number;
  rectangleCornerRadii?: number[];
  style?: FigmaTypeStyle;
  effects?: FigmaEffect[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
}

export interface FigmaFileResponse {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
  components: Record<string, { key: string; name: string; description: string }>;
  styles: Record<string, FigmaStyleEntry>;
}

export interface FigmaFileNodesResponse {
  nodes: Record<string, { document: FigmaNode }>;
}

export interface FigmaStylesResponse {
  meta: {
    styles: Array<{
      key: string;
      file_key: string;
      node_id: string;
      style_type: string;
      name: string;
      description: string;
    }>;
  };
}
