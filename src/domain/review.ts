import { shuffle } from "../utils/random";
import type { AppData, Progress, Word } from "./types";

export const MASTERED_LEVEL = 7;

const REVIEW_INTERVALS = [
  10 * 60 * 1000,
  24 * 60 * 60 * 1000,
  3 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  14 * 24 * 60 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000,
];

export function getNewWords(data: AppData): Word[] {
  const learned = new Set(data.progress.map((item) => item.wordId));
  return data.words.filter((word) => !learned.has(word.id));
}

export function getDueWords(data: AppData, now = Date.now()): Word[] {
  const dueById = new Map(
    data.progress
      .filter(
        (item) =>
          item.level < MASTERED_LEVEL &&
          item.nextReviewAt !== null &&
          item.nextReviewAt <= now,
      )
      .map((item) => [item.wordId, item.nextReviewAt as number]),
  );

  return data.words
    .filter((word) => dueById.has(word.id))
    .sort((a, b) => (dueById.get(a.id) ?? 0) - (dueById.get(b.id) ?? 0));
}

export function getMasteredCount(data: AppData): number {
  return data.progress.filter((item) => item.level >= MASTERED_LEVEL).length;
}

export function selectDailyWords(data: AppData, limit: number): Word[] {
  const due = getDueWords(data);
  const selected = due.slice(0, limit);
  if (selected.length >= limit) return selected;

  const selectedIds = new Set(selected.map((word) => word.id));
  const fresh = shuffle(getNewWords(data)).filter(
    (word) => !selectedIds.has(word.id),
  );
  return [...selected, ...fresh.slice(0, limit - selected.length)];
}

export function applyWordOutcome(
  data: AppData,
  wordId: string,
  hadError: boolean,
  now = Date.now(),
): AppData {
  const existing = data.progress.find((item) => item.wordId === wordId);
  const base: Progress = existing ?? {
    wordId,
    level: 0,
    nextReviewAt: null,
    correct: 0,
    wrong: 0,
  };

  let next: Progress;
  if (hadError) {
    next = {
      ...base,
      level: Math.max(base.level - 1, 0),
      nextReviewAt: now + REVIEW_INTERVALS[0],
      wrong: base.wrong + 1,
    };
  } else {
    const level = Math.min(base.level + 1, MASTERED_LEVEL);
    next = {
      ...base,
      level,
      nextReviewAt:
        level >= MASTERED_LEVEL
          ? null
          : now + REVIEW_INTERVALS[Math.max(level - 1, 0)],
      correct: base.correct + 1,
    };
  }

  return {
    ...data,
    progress: [...data.progress.filter((item) => item.wordId !== wordId), next],
  };
}
