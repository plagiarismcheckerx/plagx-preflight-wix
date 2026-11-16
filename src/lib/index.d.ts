// Types for the Plagx Preflight core (plain JavaScript, copied from plagx-preflight).
export type Level = 'error' | 'warning' | 'info';

export interface Issue {
  code: string;
  level: Level;
  message: string;
  text?: string;
}

export interface Result {
  stats: { words: number; sentences: number; paragraphs: number; readingTimeMinutes: number };
  errors: number;
  warnings: number;
  infos: number;
  issues: Issue[];
}

export interface Options {
  minWords?: number;
  maxWords?: number;
  style?: 'apa' | 'mla';
  checks?: string[];
}

export const VERSION: string;
export const CHECKS: string[];
export const DEFAULT_CHECKS: string[];
export function checkDraft(text: string, options?: Options): Result;
