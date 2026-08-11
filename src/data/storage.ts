import {
  DEFAULT_WORDS_PER_GAME,
  isWordsPerGame,
  type WordsPerGame,
} from "../domain/settings";
import { normalizeTerm } from "../domain/terms";
import {
  DATA_VERSION,
  type AppData,
  type Progress,
  type Session,
  type Unit,
  type Word,
} from "../domain/types";

const DATA_KEY = "alpha-trion-vocab:data";
const WORDS_PER_GAME_KEY = "alpha-trion-vocab:words-per-game";

export function createEmptyData(): AppData {
  return {
    version: DATA_VERSION,
    units: [],
    words: [],
    progress: [],
    sessions: [],
  };
}

export function loadData(): AppData {
  let raw: string | null;
  try {
    raw = localStorage.getItem(DATA_KEY);
  } catch (error) {
    throw new Error("Local storage is unavailable.", { cause: error });
  }

  if (!raw) return createEmptyData();
  return validateData(JSON.parse(raw));
}

export function saveData(data: AppData): void {
  const validated = validateData(data);
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(validated));
  } catch (error) {
    throw new Error("Failed to save local data.", { cause: error });
  }
}

export function clearData(): void {
  try {
    localStorage.removeItem(DATA_KEY);
  } catch (error) {
    throw new Error("Failed to clear local data.", { cause: error });
  }
}

export function loadWordsPerGame(): WordsPerGame {
  try {
    const value = Number(localStorage.getItem(WORDS_PER_GAME_KEY));
    return isWordsPerGame(value) ? value : DEFAULT_WORDS_PER_GAME;
  } catch {
    return DEFAULT_WORDS_PER_GAME;
  }
}

export function saveWordsPerGame(value: WordsPerGame): void {
  if (!isWordsPerGame(value)) return;
  try {
    localStorage.setItem(WORDS_PER_GAME_KEY, String(value));
  } catch {
    // A display preference is non-critical; learning data remains unaffected.
  }
}

export function downloadBackup(data: AppData): void {
  const json = JSON.stringify(validateData(data), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  anchor.href = url;
  anchor.download = `alpha-trion-vocab-${date}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function parseBackup(text: string): AppData {
  return validateData(JSON.parse(text));
}

function validateData(value: unknown): AppData {
  if (!isRecord(value) || value.version !== DATA_VERSION) {
    throw new Error("Unsupported data version.");
  }

  if (
    !Array.isArray(value.units) ||
    !Array.isArray(value.words) ||
    !Array.isArray(value.progress) ||
    !Array.isArray(value.sessions)
  ) {
    throw new Error("Invalid data structure.");
  }

  if (!value.units.every(isUnit)) throw new Error("Invalid unit data.");
  if (!value.words.every(isWord)) throw new Error("Invalid word data.");
  if (!value.progress.every(isProgress))
    throw new Error("Invalid progress data.");
  if (!value.sessions.every(isSession))
    throw new Error("Invalid session data.");

  const units = value.units as Unit[];
  const words = value.words as Word[];
  const progress = value.progress as Progress[];
  const sessions = value.sessions as Session[];

  assertUnique(
    units.map((unit) => unit.id),
    "Duplicate unit ID.",
  );
  assertUnique(
    words.map((word) => word.id),
    "Duplicate word ID.",
  );
  assertUnique(
    words.map((word) => `${word.unitId}\0${normalizeTerm(word.term)}`),
    "Duplicate word term in unit.",
  );
  assertUnique(
    progress.map((item) => item.wordId),
    "Duplicate progress record.",
  );

  const unitIds = new Set(units.map((unit) => unit.id));
  if (words.some((word) => !unitIds.has(word.unitId))) {
    throw new Error("Word references a missing unit.");
  }

  const wordIds = new Set(words.map((word) => word.id));
  if (progress.some((item) => !wordIds.has(item.wordId))) {
    throw new Error("Progress references a missing word.");
  }

  return { version: DATA_VERSION, units, words, progress, sessions };
}

function isUnit(value: unknown): value is Unit {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isTimestamp(value.createdAt)
  );
}

function isWord(value: unknown): value is Word {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.unitId) &&
    isNonEmptyString(value.term) &&
    isNonEmptyString(value.meaning)
  );
}

function isProgress(value: unknown): value is Progress {
  return (
    isRecord(value) &&
    isNonEmptyString(value.wordId) &&
    typeof value.level === "number" &&
    Number.isInteger(value.level) &&
    value.level >= 0 &&
    value.level <= 7 &&
    (value.nextReviewAt === null || isTimestamp(value.nextReviewAt)) &&
    isNonNegativeInteger(value.correct) &&
    isNonNegativeInteger(value.wrong)
  );
}

function isSession(value: unknown): value is Session {
  return (
    isRecord(value) &&
    isTimestamp(value.date) &&
    isNonNegativeInteger(value.words) &&
    isNonNegativeInteger(value.correct) &&
    isNonNegativeInteger(value.wrong)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isTimestamp(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function assertUnique(values: string[], message: string): void {
  if (new Set(values).size !== values.length) throw new Error(message);
}
