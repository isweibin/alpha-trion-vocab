import "./style.css";

import {
  clearData,
  createEmptyData,
  downloadBackup,
  loadData,
  loadWordsPerGame,
  parseBackup,
  saveData,
  saveWordsPerGame,
} from "./data/storage";
import {
  createGame,
  isGameComplete,
  markWordError,
  type GameState,
} from "./domain/game";
import {
  applyImport,
  createImportDiff,
  parseWordList,
  serializeWordList,
  type ImportDiff,
} from "./domain/importer";
import { completeGame, type GameMode } from "./domain/learning";
import { selectDailyWords } from "./domain/review";
import { isWordsPerGame } from "./domain/settings";
import { normalizeTerm } from "./domain/terms";
import type { Unit, Word } from "./domain/types";
import {
  confirmDialog,
  infoDialog,
  textDialog,
  wordDialog,
} from "./ui/dialogs";
import {
  renderAppView,
  renderGameView,
  renderImportErrors,
  renderImportPreview,
  renderStorageErrorView,
  type MainPage,
  type PendingGame,
  type Route,
} from "./ui/views";
import { createId } from "./utils/id";

const HISTORY_MARKER = "alpha-trion-vocab";
const appRoot = document.querySelector<HTMLDivElement>("#app");
if (!appRoot) throw new Error("App root was not found.");
const app: HTMLDivElement = appRoot;

let data = createEmptyData();
let storageError = false;
try {
  data = loadData();
} catch (error) {
  storageError = true;
  console.error("Failed to load local data.", error);
}

let route: Route = { page: "study" };
let game: GameState | null = null;
let gameSource: Word[] = [];
let gameTitle = "消词";
let gameMode: GameMode = "practice";
let gameSettled = false;
let pendingGame: PendingGame | null = null;
let importDiff: ImportDiff | null = null;
let importText = "";
let wordsPerGame = loadWordsPerGame();

window.history.replaceState({ app: HISTORY_MARKER, route }, "");
window.addEventListener("popstate", (event: PopStateEvent) => {
  const state = event.state as { app?: string; route?: Route } | null;
  route =
    state?.app === HISTORY_MARKER && state.route
      ? state.route
      : { page: "study" };
  render();
  scrollToTop();
});

render();

function render(): void {
  if (storageError) {
    renderStorageError();
    return;
  }

  if (route.page === "game") {
    renderGame();
    return;
  }

  app.innerHTML = renderAppView({
    data,
    route,
    wordsPerGame,
    importText,
    importDiff,
    pendingGame,
  });

  bindCommonNavigation();
  bindRouteEvents();
}

function renderStorageError(): void {
  app.innerHTML = renderStorageErrorView();

  const fileInput = document.querySelector<HTMLInputElement>("#fatal-file");
  document
    .querySelector("#fatal-restore")
    ?.addEventListener("click", () => fileInput?.click());

  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      const restored = parseBackup(await file.text());
      saveData(restored);
      data = restored;
      storageError = false;
      navigate({ page: "study" }, true);
    } catch {
      await infoDialog(
        "无法恢复",
        "这个文件不是当前版本可识别的 Alpha Trion Vocab 备份，或者浏览器无法保存数据。",
      );
    } finally {
      fileInput.value = "";
    }
  });

  document
    .querySelector("#fatal-reset")
    ?.addEventListener("click", async () => {
      const ok = await confirmDialog(
        "清空本地数据？",
        "这会删除当前浏览器里的损坏数据。只有在没有可用备份时再这样做。",
        "清空",
        true,
      );
      if (!ok) return;

      try {
        clearData();
        data = createEmptyData();
        storageError = false;
        navigate({ page: "study" }, true);
      } catch {
        await infoDialog("无法清空", "浏览器当前无法访问 localStorage。");
      }
    });
}

function renderGame(): void {
  if (!game) {
    navigate({ page: "study" }, true);
    return;
  }

  app.innerHTML = renderGameView(game, gameTitle, gameMode);

  if (isGameComplete(game)) {
    document.querySelector("#game-again")?.addEventListener("click", () => {
      const source = gameMode === "daily" ? (game?.words ?? []) : gameSource;
      startGame(source, gameTitle, "practice", false, true);
    });
    document
      .querySelector("#game-home")
      ?.addEventListener("click", () => historyBack({ page: "study" }));
    return;
  }

  document.querySelector("#quit-game")?.addEventListener("click", async () => {
    const ok = await confirmDialog(
      "退出本局？",
      "当前这局不会计入学习记录。",
      "退出",
    );
    if (ok) historyBack({ page: "study" });
  });

  document
    .querySelectorAll<HTMLButtonElement>("[data-card-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const cardId = button.dataset.cardId;
        if (cardId) handleCardClick(cardId);
      });
    });
}

function bindCommonNavigation(): void {
  document
    .querySelectorAll<HTMLButtonElement>("[data-nav]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const page = button.dataset.nav as MainPage | undefined;
        if (page) navigate({ page });
      });
    });
}

function bindRouteEvents(): void {
  switch (route.page) {
    case "study":
      bindStudy();
      break;
    case "words":
      bindWords();
      break;
    case "stats":
      bindStats();
      break;
    case "unit":
      bindUnit(route.unitId);
      break;
    case "import":
      bindImport(route.unitId);
      break;
    case "preview":
      bindPreview();
      break;
    case "game":
      break;
  }
}

function bindStudy(): void {
  document.querySelector("#start-daily")?.addEventListener("click", () => {
    const words = selectDailyWords(data, wordsPerGame);
    if (!words.length) return;

    const learnedIds = new Set(data.progress.map((item) => item.wordId));
    if (words.some((word) => !learnedIds.has(word.id))) {
      pendingGame = { words, title: "今日学习", mode: "daily" };
      navigate({ page: "preview" });
      return;
    }

    startGame(words, "今日学习", "daily");
  });

  document
    .querySelector<HTMLSelectElement>("#words-per-game")
    ?.addEventListener("change", (event) => {
      const value = Number((event.currentTarget as HTMLSelectElement).value);
      if (!isWordsPerGame(value)) return;

      wordsPerGame = value;
      saveWordsPerGame(value);
      render();
    });

  document.querySelector("#start-practice")?.addEventListener("click", () => {
    const select = document.querySelector<HTMLSelectElement>("#practice-scope");
    if (!select) return;

    const source =
      select.value === "all"
        ? data.words
        : data.words.filter((word) => word.unitId === select.value);
    if (!source.length) return;

    const title =
      select.value === "all"
        ? "全部单词"
        : (getUnit(select.value)?.name ?? "自由练习");
    startGame(source, title, "practice");
  });
}

function bindWords(): void {
  document.querySelector("#new-unit")?.addEventListener("click", async () => {
    const name = await textDialog("新建单元", "单元名称", "例如：三上 Unit 1");
    if (!name) return;

    const unit: Unit = { id: createId(), name, createdAt: Date.now() };
    if (!commit({ ...data, units: [...data.units, unit] })) return;
    navigate({ page: "unit", unitId: unit.id });
  });

  document
    .querySelectorAll<HTMLButtonElement>("[data-unit-open]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const unitId = button.dataset.unitOpen;
        if (unitId) navigate({ page: "unit", unitId });
      });
    });
}

function bindUnit(unitId: string): void {
  document
    .querySelector("#back-from-unit")
    ?.addEventListener("click", () => historyBack({ page: "words" }));

  document.querySelector("#import-unit")?.addEventListener("click", () => {
    importText = serializeWordList(
      data.words.filter((word) => word.unitId === unitId),
    );
    importDiff = null;
    navigate({ page: "import", unitId });
  });

  document
    .querySelector("#rename-unit")
    ?.addEventListener("click", async () => {
      const unit = getUnit(unitId);
      if (!unit) return;

      const name = await textDialog("重命名单元", "单元名称", "", unit.name);
      if (!name || name === unit.name) return;

      if (
        !commit({
          ...data,
          units: data.units.map((item) =>
            item.id === unitId ? { ...item, name } : item,
          ),
        })
      ) {
        return;
      }
      render();
    });

  document
    .querySelector("#delete-unit")
    ?.addEventListener("click", async () => {
      const unit = getUnit(unitId);
      if (!unit) return;

      const ok = await confirmDialog(
        `删除「${unit.name}」？`,
        "该单元的单词和对应学习进度会一起删除，历史统计保留。",
        "删除",
        true,
      );
      if (!ok) return;

      const wordIds = new Set(
        data.words
          .filter((word) => word.unitId === unitId)
          .map((word) => word.id),
      );
      if (
        !commit({
          ...data,
          units: data.units.filter((item) => item.id !== unitId),
          words: data.words.filter((word) => word.unitId !== unitId),
          progress: data.progress.filter((item) => !wordIds.has(item.wordId)),
        })
      ) {
        return;
      }
      historyBack({ page: "words" });
    });

  document
    .querySelectorAll<HTMLButtonElement>("[data-word-edit]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        const word = data.words.find(
          (item) => item.id === button.dataset.wordEdit,
        );
        if (!word) return;

        const result = await wordDialog(word);
        if (!result) return;

        const collision = data.words.some(
          (item) =>
            item.unitId === unitId &&
            item.id !== word.id &&
            normalizeTerm(item.term) === normalizeTerm(result.term),
        );
        if (collision) {
          await infoDialog("无法保存", "同一单元内已经存在这个英文单词。");
          return;
        }

        if (
          !commit({
            ...data,
            words: data.words.map((item) =>
              item.id === word.id
                ? { ...item, term: result.term, meaning: result.meaning }
                : item,
            ),
          })
        ) {
          return;
        }
        render();
      });
    });
}

function bindImport(unitId: string): void {
  document
    .querySelector("#back-from-import")
    ?.addEventListener("click", () => historyBack({ page: "unit", unitId }));

  const textarea = document.querySelector<HTMLTextAreaElement>("#import-text");
  textarea?.addEventListener("input", () => {
    importText = textarea.value;
    importDiff = null;
    document.querySelector("#import-preview")?.replaceChildren();
  });

  document.querySelector("#preview-import")?.addEventListener("click", () => {
    importText = textarea?.value ?? importText;
    const result = parseWordList(importText);
    const preview = document.querySelector<HTMLElement>("#import-preview");

    if (result.errors.length) {
      importDiff = null;
      if (preview) preview.innerHTML = renderImportErrors(result.errors);
      return;
    }

    importDiff = createImportDiff(data, unitId, result.words);
    if (preview) preview.innerHTML = renderImportPreview(importDiff);
    bindApplyImport(unitId);
  });

  bindApplyImport(unitId);
}

function bindApplyImport(unitId: string): void {
  document
    .querySelector("#apply-import")
    ?.addEventListener("click", async () => {
      if (!importDiff) return;

      const ok = importDiff.removed.length
        ? await confirmDialog(
            "确认更新单元？",
            `这次同步会删除 ${importDiff.removed.length} 个不再出现在当前列表中的单词及其学习进度。`,
            "更新并删除",
            true,
          )
        : true;
      if (!ok) return;

      if (!commit(applyImport(data, unitId, importDiff))) return;
      importDiff = null;
      importText = "";
      historyBack({ page: "unit", unitId });
    });
}

function bindPreview(): void {
  document
    .querySelector("#back-from-preview")
    ?.addEventListener("click", () => historyBack({ page: "study" }));

  document
    .querySelectorAll<HTMLButtonElement>("[data-preview-speak]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const word = pendingGame?.words.find(
          (item) => item.id === button.dataset.previewSpeak,
        );
        if (word) speak(word.term);
      });
    });

  document
    .querySelector("#begin-preview-game")
    ?.addEventListener("click", () => {
      if (!pendingGame) return;

      const next = pendingGame;
      pendingGame = null;
      startGame(next.words, next.title, next.mode, true, true);
    });
}

function bindStats(): void {
  document.querySelector("#backup-export")?.addEventListener("click", () => {
    try {
      downloadBackup(data);
    } catch {
      void infoDialog("无法导出", "当前数据未能通过完整性检查。");
    }
  });

  const fileInput = document.querySelector<HTMLInputElement>("#backup-file");
  document
    .querySelector("#backup-import")
    ?.addEventListener("click", () => fileInput?.click());

  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      const restored = parseBackup(await file.text());
      const ok = await confirmDialog(
        "恢复这份备份？",
        "恢复会覆盖当前浏览器里的全部词库、进度和统计。",
        "恢复",
        true,
      );
      if (!ok) return;

      saveData(restored);
      data = restored;
      render();
    } catch {
      await infoDialog(
        "无法恢复",
        "这个文件不是当前版本可识别的 Alpha Trion Vocab 备份，或者浏览器无法保存数据。",
      );
    } finally {
      fileInput.value = "";
    }
  });
}

function startGame(
  source: readonly Word[],
  title: string,
  mode: GameMode,
  exactSource = false,
  replaceRoute = false,
): void {
  if (!source.length) return;

  gameSource = [...source];
  game = createGame(source, exactSource ? source.length : wordsPerGame);
  gameTitle = title;
  gameMode = mode;
  gameSettled = false;
  navigate({ page: "game" }, replaceRoute);
}

function handleCardClick(cardId: string): void {
  if (!game || game.locked) return;

  const card = game.cards.find((item) => item.id === cardId);
  if (!card || card.matched) return;

  if (card.kind === "term") speak(card.text);

  if (!game.selectedCardId) {
    game.selectedCardId = card.id;
    renderGame();
    return;
  }

  const first = game.cards.find((item) => item.id === game?.selectedCardId);
  if (!first || first.id === card.id) {
    game.selectedCardId = null;
    renderGame();
    return;
  }

  if (first.kind === card.kind) {
    game.selectedCardId = card.id;
    renderGame();
    return;
  }

  game.locked = true;
  if (first.wordId === card.wordId) {
    first.matched = true;
    card.matched = true;
    game.correct += 1;
    game.selectedCardId = null;

    window.setTimeout(() => {
      if (!game) return;
      game.locked = false;
      if (isGameComplete(game)) finishGame();
      renderGame();
    }, 220);
    renderGame();
    return;
  }

  game.wrong += 1;
  markWordError(game, first.wordId);
  markWordError(game, card.wordId);
  game.selectedCardId = null;
  renderGame();

  markWrongCard(first.id);
  markWrongCard(card.id);

  window.setTimeout(() => {
    if (!game) return;
    game.locked = false;
    renderGame();
  }, 420);
}

function markWrongCard(cardId: string): void {
  document
    .querySelector<HTMLElement>(`[data-card-id="${CSS.escape(cardId)}"]`)
    ?.classList.add("wrong");
}

function finishGame(): void {
  if (!game || gameSettled) return;
  if (commit(completeGame(data, game, gameMode))) gameSettled = true;
}

function speak(text: string): void {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function navigate(next: Route, replace = false): void {
  route = next;
  const state = { app: HISTORY_MARKER, route: next };
  if (replace) window.history.replaceState(state, "");
  else window.history.pushState(state, "");
  render();
  scrollToTop();
}

function historyBack(fallback: Route): void {
  const state = window.history.state as { app?: string } | null;
  if (state?.app === HISTORY_MARKER && window.history.length > 1) {
    window.history.back();
    return;
  }
  navigate(fallback, true);
}

function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: "instant" });
}

function commit(next: typeof data): boolean {
  try {
    saveData(next);
    data = next;
    return true;
  } catch (error) {
    console.error("Failed to save local data.", error);
    void infoDialog(
      "保存失败",
      "浏览器无法写入 localStorage，本次修改没有保存。",
    );
    return false;
  }
}

function getUnit(unitId: string): Unit | undefined {
  return data.units.find((unit) => unit.id === unitId);
}
