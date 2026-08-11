export const WORDS_PER_GAME_OPTIONS = [4, 6, 8, 10, 12] as const;
export const DEFAULT_WORDS_PER_GAME = 8;

export type WordsPerGame = (typeof WORDS_PER_GAME_OPTIONS)[number];

export function isWordsPerGame(value: number): value is WordsPerGame {
  return WORDS_PER_GAME_OPTIONS.includes(value as WordsPerGame);
}
