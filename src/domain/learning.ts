import type { GameState } from "./game";
import { applyWordOutcome } from "./review";
import type { AppData, Session } from "./types";

export type GameMode = "daily" | "practice";

export function completeGame(
  data: AppData,
  game: GameState,
  mode: GameMode,
  now = Date.now(),
): AppData {
  let next = data;

  if (mode === "daily") {
    for (const state of game.wordStates) {
      next = applyWordOutcome(next, state.wordId, state.hadError, now);
    }
  }

  const session: Session = {
    date: now,
    words: game.words.length,
    correct: game.correct,
    wrong: game.wrong,
  };

  return { ...next, sessions: [...next.sessions, session] };
}
