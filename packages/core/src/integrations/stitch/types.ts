/**
 * Google Stitch API response types. Based on the @google/stitch-sdk public
 * API surface. We implement a lightweight client instead of importing the
 * SDK to keep the dependency tree minimal.
 */

export interface StitchProject {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface StitchScreen {
  id: string;
  screenId: string;
  projectId: string;
  title: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StitchScreenContent {
  html: string;
  imageUrl: string;
}

export interface StitchGenerateOptions {
  prompt: string;
  projectId: string;
}

export interface StitchEditOptions {
  screenId: string;
  projectId: string;
  editPrompt: string;
}

export interface StitchToolCallResult {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
}
