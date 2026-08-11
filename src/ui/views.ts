import { WORDS_PER_GAME_OPTIONS, type WordsPerGame } from "../domain/settings";
import type { GameState } from "../domain/game";
import type { ImportDiff, ImportError } from "../domain/importer";
import type { GameMode } from "../domain/learning";
import {
  MASTERED_LEVEL,
  getDueWords,
  getMasteredCount,
  selectDailyWords,
} from "../domain/review";
import type { AppData, Progress, Word } from "../domain/types";
import { escapeAttribute, escapeHtml } from "./html";

export type MainPage = "study" | "words" | "stats";

export type Route =
  | { page: MainPage }
  | { page: "unit"; unitId: string }
  | { page: "import"; unitId: string }
  | { page: "preview" }
  | { page: "game" };

export interface PendingGame {
  words: Word[];
  title: string;
  mode: GameMode;
}

export interface AppViewState {
  data: AppData;
  route: Route;
  wordsPerGame: WordsPerGame;
  importText: string;
  importDiff: ImportDiff | null;
  pendingGame: PendingGame | null;
}

export function renderAppView(state: AppViewState): string {
  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">Alpha Trion <small>Vocab</small></div>
      </header>
      ${renderNavigation(state.route)}
      <main class="content">${renderRoute(state)}</main>
    </div>
  `;
}

export function renderStorageErrorView(): string {
  return `
    <div class="fatal-shell">
      <section class="card fatal-card">
        <div class="hint">Alpha Trion Vocab</div>
        <h1>本地数据无法读取</h1>
        <p>浏览器中现有数据可能已损坏，程序没有自动把它当成空词库。可以恢复之前导出的 JSON 备份，或者确认后清空本地数据重新开始。</p>
        <div class="button-row actions-spaced">
          <button class="btn primary" id="fatal-restore">恢复备份</button>
          <button class="btn danger" id="fatal-reset">清空本地数据</button>
          <input type="file" id="fatal-file" accept="application/json,.json" hidden>
        </div>
      </section>
    </div>
  `;
}

export function renderImportErrors(errors: readonly ImportError[]): string {
  if (!errors.length) return "";
  return `
    <ul class="error-list">
      ${errors
        .map(
          (error) =>
            `<li>${error.line ? `第 ${error.line} 行：` : ""}${escapeHtml(error.message)}</li>`,
        )
        .join("")}
    </ul>
  `;
}

export function renderImportPreview(diff: ImportDiff | null): string {
  if (!diff) return "";

  const { added, updated, removed, unchanged } = diff;
  const totalChanges = added.length + updated.length + removed.length;
  const dangerClass = removed.length ? "danger" : "primary";

  return `
    <div class="diff-section">
      <h3>同步预览</h3>
      <div class="stat-list">
        <div class="stat-row"><strong>新增</strong><span>${added.length}</span></div>
        <div class="stat-row"><strong>修改</strong><span>${updated.length}</span></div>
        <div class="stat-row"><strong>删除</strong><span>${removed.length}</span></div>
        <div class="stat-row"><strong>保持</strong><span>${unchanged.length}</span></div>
      </div>

      ${renderDiffItems(
        "新增",
        added.map((item) => `+ ${item.term}　${item.meaning}`),
        "added",
      )}
      ${renderDiffItems(
        "修改",
        updated.map(
          (item) =>
            `~ ${item.before.term}　${item.before.meaning} → ${item.after.term}　${item.after.meaning}`,
        ),
        "",
      )}
      ${renderDiffItems(
        "删除",
        removed.map((item) => `- ${item.term}　${item.meaning}`),
        "removed",
      )}

      <div class="button-row diff-actions">
        <button class="btn ${dangerClass}" id="apply-import">
          ${totalChanges ? (removed.length ? `更新单元 · 删除 ${removed.length}` : "更新单元") : "确认无变化"}
        </button>
      </div>
    </div>
  `;
}

export function renderGameView(
  game: GameState,
  title: string,
  mode: GameMode,
): string {
  const complete = game.cards.every((card) => card.matched);
  if (complete) {
    const repeatLabel = mode === "daily" ? "再练一遍" : "再来一局";
    return `
      <div class="game-shell">
        <div class="game-result">
          <section class="card">
            <div class="hint">${escapeHtml(title)}</div>
            <div class="result-number">完成</div>
            <p>${game.words.length} 个单词 · 错误尝试 ${game.wrong} 次</p>
            ${mode === "daily" ? '<p class="result-note">今日学习已经结算；再练一遍只作为自由练习，不会再次推进复习进度。</p>' : ""}
            <div class="button-row centered result-actions">
              <button class="btn primary" id="game-again">${repeatLabel}</button>
              <button class="btn" id="game-home">返回学习</button>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  const matched = game.cards.filter((card) => card.matched).length / 2;
  return `
    <div class="game-shell">
      <header class="game-head">
        <button class="btn ghost" id="quit-game">← 退出</button>
        <div>
          <strong>${escapeHtml(title)}</strong>
          <span class="progress-text">${matched}/${game.words.length}</span>
        </div>
      </header>
      <main class="game-board">
        ${game.cards.map((card) => renderGameCard(game, card)).join("")}
      </main>
    </div>
  `;
}

function renderNavigation(route: Route): string {
  const active = getActiveMainPage(route);
  return `
    <nav class="bottom-nav" aria-label="主导航">
      ${navButton("study", "学习", active)}
      ${navButton("words", "单词", active)}
      ${navButton("stats", "统计", active)}
    </nav>
  `;
}

function getActiveMainPage(route: Route): MainPage {
  if (route.page === "unit" || route.page === "import") return "words";
  if (route.page === "preview" || route.page === "game") return "study";
  return route.page;
}

function navButton(page: MainPage, label: string, active: MainPage): string {
  return `<button class="nav-btn ${active === page ? "active" : ""}" data-nav="${page}">${label}</button>`;
}

function renderRoute(state: AppViewState): string {
  switch (state.route.page) {
    case "study":
      return renderStudy(state.data, state.wordsPerGame);
    case "words":
      return renderWords(state.data);
    case "stats":
      return renderStats(state.data);
    case "unit":
      return renderUnit(state.data, state.route.unitId);
    case "import":
      return renderImport(
        state.data,
        state.route.unitId,
        state.importText,
        state.importDiff,
      );
    case "preview":
      return renderPreview(state.data, state.pendingGame);
    case "game":
      return "";
  }
}

function renderStudy(data: AppData, wordsPerGame: WordsPerGame): string {
  const planned = selectDailyWords(data, wordsPerGame);
  const dueIds = new Set(getDueWords(data).map((word) => word.id));
  const dueCount = planned.filter((word) => dueIds.has(word.id)).length;
  const newCount = planned.length - dueCount;
  const hasDaily = planned.length > 0;

  const unitOptions = [...data.units]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(
      (unit) =>
        `<option value="${escapeAttribute(unit.id)}">${escapeHtml(unit.name)}</option>`,
    )
    .join("");

  return `
    <section class="page-head">
      <div>
        <h1>今天</h1>
        <p>先处理最早到期的单词，再补充新词。</p>
      </div>
    </section>

    <section class="card hero">
      <div class="daily-plan">
        <strong>${planned.length}</strong>
        <span>今日学习</span>
      </div>
      <div class="plan-tags">
        <span>复习 ${dueCount}</span>
        <span>新词 ${newCount}</span>
        <label class="plan-size" for="words-per-game">
          每局
          <select id="words-per-game" aria-label="每局单词数">${renderWordsPerGameOptions(wordsPerGame)}</select>
          个
        </label>
      </div>
      <button class="btn primary hero-action" id="start-daily" ${hasDaily ? "" : "disabled"}>
        ${hasDaily ? `开始 · ${planned.length} 个词` : data.words.length ? "今日已完成" : "先导入单词"}
      </button>
    </section>

    <section class="card section-gap">
      <h2>自由练习</h2>
      <p>从所选范围随机抽取 ${wordsPerGame} 个单词；不足时使用全部单词。自由练习只记录统计，不改变复习进度。</p>
      <div class="grid two actions-spaced">
        <div class="field">
          <label for="practice-scope">练习范围</label>
          <select class="select" id="practice-scope" ${data.words.length ? "" : "disabled"}>
            <option value="all">全部单词</option>
            ${unitOptions}
          </select>
        </div>
        <div class="field align-end">
          <button class="btn soft" id="start-practice" ${data.words.length ? "" : "disabled"}>随机消词</button>
        </div>
      </div>
    </section>
  `;
}

function renderWordsPerGameOptions(selected: WordsPerGame): string {
  return WORDS_PER_GAME_OPTIONS.map(
    (value) =>
      `<option value="${value}" ${value === selected ? "selected" : ""}>${value}</option>`,
  ).join("");
}

function renderWords(data: AppData): string {
  const progressByWordId = new Map(
    data.progress.map((progress) => [progress.wordId, progress]),
  );
  const rows = [...data.units]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((unit) => {
      const words = data.words.filter((word) => word.unitId === unit.id);
      const learned = words.filter((word) =>
        progressByWordId.has(word.id),
      ).length;
      const mastered = words.filter(
        (word) => (progressByWordId.get(word.id)?.level ?? 0) >= MASTERED_LEVEL,
      ).length;
      return `
        <div class="unit-row">
          <button class="unit-open" data-unit-open="${escapeAttribute(unit.id)}">
            <span>
              <strong>${escapeHtml(unit.name)}</strong>
              <small>${words.length} 词 · ${learned} 已学习 · ${mastered} 已掌握</small>
            </span>
            <span class="unit-arrow" aria-hidden="true">›</span>
          </button>
        </div>
      `;
    })
    .join("");

  return `
    <section class="page-head">
      <div>
        <h1>单词</h1>
        <p>按单元管理，可直接从 Excel / WPS 的英文、中文两列复制导入。</p>
      </div>
      <div class="button-row">
        <button class="btn primary" id="new-unit">新建单元</button>
      </div>
    </section>
    <section class="unit-list">
      ${rows || '<div class="empty">还没有单元。先新建一个单元，再粘贴导入单词。</div>'}
    </section>
  `;
}

function renderUnit(data: AppData, unitId: string): string {
  const unit = data.units.find((item) => item.id === unitId);
  if (!unit) return '<div class="empty">单元不存在。</div>';

  const words = data.words.filter((word) => word.unitId === unitId);
  const progressByWordId = new Map(
    data.progress.map((progress) => [progress.wordId, progress]),
  );
  const learned = words.filter((word) => progressByWordId.has(word.id)).length;
  const mastered = words.filter(
    (word) => (progressByWordId.get(word.id)?.level ?? 0) >= MASTERED_LEVEL,
  ).length;

  const rows = words
    .map((word) => {
      const progress = progressByWordId.get(word.id);
      return `
        <div class="word-row">
          <div class="word-copy">
            <strong>${escapeHtml(word.term)}</strong>
            <span>${escapeHtml(word.meaning)}</span>
          </div>
          <div class="button-row word-actions">
            <span class="word-meta">${formatProgress(progress)}</span>
            <button class="btn icon" data-word-edit="${escapeAttribute(word.id)}">编辑</button>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <button class="back-link" id="back-from-unit">← 返回单元</button>
    <section class="page-head">
      <div>
        <h1>${escapeHtml(unit.name)}</h1>
        <p>${words.length} 词 · ${learned} 已学习 · ${mastered} 已掌握</p>
      </div>
      <div class="button-row">
        <button class="btn primary" id="import-unit">导入 / 更新</button>
        <button class="btn" id="rename-unit">重命名</button>
        <button class="btn danger" id="delete-unit">删除</button>
      </div>
    </section>
    <section class="word-list">
      ${rows || '<div class="empty">这个单元还是空的。点击「导入 / 更新」粘贴单词列表。</div>'}
    </section>
  `;
}

function renderImport(
  data: AppData,
  unitId: string,
  importText: string,
  importDiff: ImportDiff | null,
): string {
  const unit = data.units.find((item) => item.id === unitId);
  if (!unit) return '<div class="empty">单元不存在。</div>';

  return `
    <button class="back-link" id="back-from-import">← 返回 ${escapeHtml(unit.name)}</button>
    <section class="page-head">
      <div>
        <h1>导入 / 更新</h1>
        <p>每行固定两列，以 Tab 分隔。建议直接从 Excel / WPS 的英文、中文两列复制粘贴；文本框已带出当前单元完整内容。</p>
      </div>
    </section>

    <section class="card">
      <div class="field">
        <label for="import-text">单词列表</label>
        <textarea class="textarea" id="import-text" spellcheck="false" placeholder="从 Excel / WPS 复制英文、中文两列后粘贴到这里">${escapeHtml(importText)}</textarea>
      </div>
      <div class="button-row actions-spaced">
        <button class="btn primary" id="preview-import">生成预览</button>
      </div>
      <div id="import-preview">${renderImportPreview(importDiff)}</div>
    </section>
  `;
}

function renderDiffItems(
  title: string,
  items: readonly string[],
  className: string,
): string {
  if (!items.length) return "";
  return `
    <div class="diff-section">
      <h3>${escapeHtml(title)}</h3>
      <div class="diff-list">
        ${items.map((item) => `<div class="diff-item ${className}">${escapeHtml(item)}</div>`).join("")}
      </div>
    </div>
  `;
}

function renderPreview(data: AppData, pendingGame: PendingGame | null): string {
  if (!pendingGame) return '<div class="empty">没有待开始的学习内容。</div>';
  const learnedIds = new Set(data.progress.map((item) => item.wordId));
  const newWords = pendingGame.words.filter((word) => !learnedIds.has(word.id));

  return `
    <button class="back-link" id="back-from-preview">← 返回学习</button>
    <section class="page-head">
      <div>
        <h1>先看一遍</h1>
        <p>本局有 ${newWords.length} 个新词。先建立一次中英联系，点击英文可以听发音。</p>
      </div>
    </section>
    <section class="preview-list">
      ${newWords
        .map(
          (word) => `
            <button class="preview-row" data-preview-speak="${escapeAttribute(word.id)}">
              <strong>${escapeHtml(word.term)}</strong>
              <span>${escapeHtml(word.meaning)}</span>
              <small aria-hidden="true">🔊</small>
            </button>
          `,
        )
        .join("")}
    </section>
    <div class="preview-action">
      <button class="btn primary" id="begin-preview-game">开始消词</button>
    </div>
  `;
}

function renderStats(data: AppData): string {
  const now = Date.now();
  const startToday = startOfDay(now);
  const weekStartDate = new Date(startToday);
  weekStartDate.setDate(weekStartDate.getDate() - 6);
  const startWeek = weekStartDate.getTime();

  const today = data.sessions.filter((session) => session.date >= startToday);
  const week = data.sessions.filter((session) => session.date >= startWeek);
  const allCorrect = data.sessions.reduce(
    (sum, session) => sum + session.correct,
    0,
  );
  const allWrong = data.sessions.reduce(
    (sum, session) => sum + session.wrong,
    0,
  );
  const attempts = allCorrect + allWrong;
  const accuracy = attempts ? Math.round((allCorrect / attempts) * 100) : 0;

  return `
    <section class="page-head">
      <div>
        <h1>统计</h1>
        <p>只保留对学习有用的少量汇总。</p>
      </div>
    </section>

    <section class="grid two">
      <div class="card">
        <h2>词汇</h2>
        <div class="stat-list stats-spaced">
          ${statRow("总词数", data.words.length)}
          ${statRow("已学习", data.progress.length)}
          ${statRow("已掌握", getMasteredCount(data))}
          ${statRow("当前待复习", getDueWords(data).length)}
        </div>
      </div>
      <div class="card">
        <h2>练习</h2>
        <div class="stat-list stats-spaced">
          ${statRow(
            "今日完成",
            today.reduce((sum, item) => sum + item.words, 0),
          )}
          ${statRow(
            "近 7 天完成",
            week.reduce((sum, item) => sum + item.words, 0),
          )}
          ${statRow("累计局数", data.sessions.length)}
          ${statRow("正确率", `${accuracy}%`)}
        </div>
      </div>
    </section>

    <section class="card section-gap">
      <h2>数据</h2>
      <p>所有数据都在当前浏览器的 localStorage 中。建议偶尔导出 JSON 备份。</p>
      <div class="button-row actions-spaced">
        <button class="btn" id="backup-export">导出数据</button>
        <button class="btn" id="backup-import">恢复数据</button>
        <input type="file" id="backup-file" accept="application/json,.json" hidden>
      </div>
    </section>
  `;
}

function statRow(label: string, value: string | number): string {
  return `<div class="stat-row"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(String(value))}</span></div>`;
}

function renderGameCard(
  game: GameState,
  card: GameState["cards"][number],
): string {
  const selected = game.selectedCardId === card.id;
  return `
    <button
      class="game-card ${card.kind} ${selected ? "selected" : ""} ${card.matched ? "matched" : ""}"
      data-card-id="${escapeAttribute(card.id)}"
      ${card.matched || game.locked ? "disabled" : ""}
    >${escapeHtml(card.text)}</button>
  `;
}

function formatProgress(
  progress: Progress | undefined,
  now = Date.now(),
): string {
  if (!progress) return "未学习";
  if (progress.level >= MASTERED_LEVEL) return "已掌握";
  if (progress.nextReviewAt === null) return "复习中";

  const delta = progress.nextReviewAt - now;
  if (delta <= 0) return "待复习";

  const minutes = Math.ceil(delta / (60 * 1000));
  if (minutes < 60) return `${minutes} 分钟后`;

  const hours = Math.ceil(delta / (60 * 60 * 1000));
  if (hours < 24) return `${hours} 小时后`;

  const days = Math.ceil(delta / (24 * 60 * 60 * 1000));
  return `${days} 天后`;
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}
