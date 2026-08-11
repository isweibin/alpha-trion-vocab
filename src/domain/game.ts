import { shuffle } from "../utils/random";
import type { Word } from "./types";

export type CardKind = "term" | "meaning";

export interface GameCard {
  id: string;
  wordId: string;
  kind: CardKind;
  text: string;
  matched: boolean;
}

export interface GameWordState {
  wordId: string;
  hadError: boolean;
}

export interface GameState {
  words: Word[];
  cards: GameCard[];
  selectedCardId: string | null;
  locked: boolean;
  correct: number;
  wrong: number;
  wordStates: GameWordState[];
}

export function createGame(source: readonly Word[], pairCount = 8): GameState {
  const words = shuffle(source).slice(0, pairCount);
  const cards = shuffle(
    words.flatMap((word): GameCard[] => [
      {
        id: `${word.id}:term`,
        wordId: word.id,
        kind: "term",
        text: word.term,
        matched: false,
      },
      {
        id: `${word.id}:meaning`,
        wordId: word.id,
        kind: "meaning",
        text: word.meaning,
        matched: false,
      },
    ]),
  );

  return {
    words,
    cards,
    selectedCardId: null,
    locked: false,
    correct: 0,
    wrong: 0,
    wordStates: words.map((word) => ({ wordId: word.id, hadError: false })),
  };
}

export function markWordError(state: GameState, wordId: string): void {
  const item = state.wordStates.find((entry) => entry.wordId === wordId);
  if (item) item.hadError = true;
}

export function isGameComplete(state: GameState): boolean {
  return state.cards.every((card) => card.matched);
}
