export const DATA_VERSION = 1 as const;

export interface Unit {
  id: string;
  name: string;
  createdAt: number;
}

export interface Word {
  id: string;
  unitId: string;
  term: string;
  meaning: string;
}

export interface Progress {
  wordId: string;
  level: number;
  nextReviewAt: number | null;
  correct: number;
  wrong: number;
}

export interface Session {
  date: number;
  words: number;
  correct: number;
  wrong: number;
}

export interface AppData {
  version: typeof DATA_VERSION;
  units: Unit[];
  words: Word[];
  progress: Progress[];
  sessions: Session[];
}

export interface ImportedWord {
  term: string;
  meaning: string;
}
