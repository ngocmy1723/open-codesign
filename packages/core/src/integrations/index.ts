/**
 * External integrations — lazy-loaded connectors for design platforms.
 * Each sub-module exposes a lightweight API client and token/import helpers.
 * Never imported at app startup; loaded on demand from IPC handlers.
 */

export {
  FigmaClient,
  extractFigmaTokens,
} from './figma/index.js';
export type {
  FigmaClientOptions,
  ExtractFigmaTokensOptions,
  FigmaColor,
  FigmaEffect,
  FigmaFileResponse,
  FigmaFileNodesResponse,
  FigmaNode,
  FigmaStyleEntry,
  FigmaStylesResponse,
  FigmaTypeStyle,
} from './figma/index.js';

export {
  StitchClient,
  extractStitchTokens,
  importStitchScreen,
} from './stitch/index.js';
export type {
  StitchClientOptions,
  StitchImportOptions,
  StitchImportResult,
  StitchEditOptions,
  StitchGenerateOptions,
  StitchProject,
  StitchScreen,
  StitchScreenContent,
  StitchToolCallResult,
} from './stitch/index.js';
