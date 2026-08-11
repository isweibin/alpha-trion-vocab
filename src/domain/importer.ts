import { createId } from "../utils/id";
import { normalizeTerm } from "./terms";
import type { AppData, ImportedWord, Word } from "./types";

export interface ImportError {
  line: number;
  message: string;
}

export interface UpdatedWord {
  before: Word;
  after: ImportedWord;
}

export interface ImportDiff {
  added: ImportedWord[];
  updated: UpdatedWord[];
  removed: Word[];
  unchanged: Word[];
  incoming: ImportedWord[];
}

export function serializeWordList(
  words: readonly Pick<Word, "term" | "meaning">[],
): string {
  return words.map((word) => `${word.term}\t${word.meaning}`).join("\n");
}

export function parseWordList(text: string): {
  words: ImportedWord[];
  errors: ImportError[];
} {
  const words: ImportedWord[] = [];
  const errors: ImportError[] = [];
  const seen = new Map<string, number>();

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const lineNumber = index + 1;
    if (!rawLine.trim()) return;

    const columns = rawLine.split("\t");
    if (columns.length !== 2) {
      errors.push({ line: lineNumber, message: "应为两列「英文<TAB>中文」。" });
      return;
    }

    const [rawTerm, rawMeaning] = columns;
    const term = rawTerm.trim();
    const meaning = rawMeaning.trim();
    if (!term || !meaning) {
      errors.push({ line: lineNumber, message: "英文和中文都不能为空。" });
      return;
    }

    const key = normalizeTerm(term);
    const firstLine = seen.get(key);
    if (firstLine !== undefined) {
      errors.push({
        line: lineNumber,
        message: `英文重复，首次出现在第 ${firstLine} 行。`,
      });
      return;
    }

    seen.set(key, lineNumber);
    words.push({ term, meaning });
  });

  if (words.length === 0 && errors.length === 0) {
    errors.push({ line: 0, message: "没有识别到可导入的单词。" });
  }

  return { words, errors };
}

export function createImportDiff(
  data: AppData,
  unitId: string,
  incoming: ImportedWord[],
): ImportDiff {
  const current = data.words.filter((word) => word.unitId === unitId);
  const currentByTerm = new Map(
    current.map((word) => [normalizeTerm(word.term), word]),
  );
  const incomingKeys = new Set(
    incoming.map((item) => normalizeTerm(item.term)),
  );
  const added: ImportedWord[] = [];
  const updated: UpdatedWord[] = [];
  const unchanged: Word[] = [];

  for (const item of incoming) {
    const existing = currentByTerm.get(normalizeTerm(item.term));
    if (!existing) {
      added.push(item);
      continue;
    }

    if (existing.term !== item.term || existing.meaning !== item.meaning) {
      updated.push({ before: existing, after: item });
    } else {
      unchanged.push(existing);
    }
  }

  const removed = current.filter(
    (word) => !incomingKeys.has(normalizeTerm(word.term)),
  );
  return { added, updated, removed, unchanged, incoming };
}

export function applyImport(
  data: AppData,
  unitId: string,
  diff: ImportDiff,
): AppData {
  const current = data.words.filter((word) => word.unitId === unitId);
  const currentByTerm = new Map(
    current.map((word) => [normalizeTerm(word.term), word]),
  );
  const keptIds = new Set<string>();

  const syncedWords = diff.incoming.map((item): Word => {
    const existing = currentByTerm.get(normalizeTerm(item.term));
    if (existing) {
      keptIds.add(existing.id);
      return { ...existing, term: item.term, meaning: item.meaning };
    }

    return {
      id: createId(),
      unitId,
      term: item.term,
      meaning: item.meaning,
    };
  });

  const currentIds = new Set(current.map((word) => word.id));
  return {
    ...data,
    words: [
      ...data.words.filter((word) => word.unitId !== unitId),
      ...syncedWords,
    ],
    progress: data.progress.filter(
      (item) => !currentIds.has(item.wordId) || keptIds.has(item.wordId),
    ),
  };
}
