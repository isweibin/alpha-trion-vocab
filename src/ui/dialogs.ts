import { escapeAttribute, escapeHtml } from "./html";
import type { Word } from "../domain/types";

export async function textDialog(
  title: string,
  label: string,
  placeholder = "",
  initial = "",
): Promise<string | null> {
  const dialog = createDialog(`
    <form method="dialog" class="dialog-body">
      <h2>${escapeHtml(title)}</h2>
      <div class="field">
        <label for="dialog-input">${escapeHtml(label)}</label>
        <input class="input" id="dialog-input" value="${escapeAttribute(initial)}" placeholder="${escapeAttribute(placeholder)}" autocomplete="off">
      </div>
      <div class="dialog-actions">
        <button class="btn" value="cancel">取消</button>
        <button class="btn primary" value="confirm">确定</button>
      </div>
    </form>
  `);

  const input = dialog.querySelector<HTMLInputElement>("#dialog-input");
  dialog.showModal();
  input?.focus();
  input?.select();

  const result = await waitForDialog(dialog);
  if (result !== "confirm") return null;
  return input?.value.trim() || null;
}

export async function wordDialog(
  word: Word,
): Promise<{ term: string; meaning: string } | null> {
  const dialog = createDialog(`
    <form method="dialog" class="dialog-body">
      <h2>编辑单词</h2>
      <div class="field">
        <label for="word-term">英文</label>
        <input class="input" id="word-term" value="${escapeAttribute(word.term)}" autocomplete="off">
      </div>
      <div class="field">
        <label for="word-meaning">中文</label>
        <input class="input" id="word-meaning" value="${escapeAttribute(word.meaning)}" autocomplete="off">
      </div>
      <div class="dialog-actions">
        <button class="btn" value="cancel">取消</button>
        <button class="btn primary" value="confirm">保存</button>
      </div>
    </form>
  `);

  const termInput = dialog.querySelector<HTMLInputElement>("#word-term");
  dialog.showModal();
  termInput?.focus();
  termInput?.select();

  const result = await waitForDialog(dialog);
  if (result !== "confirm") return null;

  const term = termInput?.value.trim() ?? "";
  const meaning =
    dialog.querySelector<HTMLInputElement>("#word-meaning")?.value.trim() ?? "";
  if (!term || !meaning) return null;
  return { term, meaning };
}

export async function confirmDialog(
  title: string,
  message: string,
  confirmLabel: string,
  danger = false,
): Promise<boolean> {
  const dialog = createDialog(`
    <form method="dialog" class="dialog-body">
      <h2>${escapeHtml(title)}</h2>
      <p class="dialog-message">${escapeHtml(message)}</p>
      <div class="dialog-actions">
        <button class="btn" value="cancel">取消</button>
        <button class="btn ${danger ? "danger" : "primary"}" value="confirm">${escapeHtml(confirmLabel)}</button>
      </div>
    </form>
  `);

  dialog.showModal();
  return (await waitForDialog(dialog)) === "confirm";
}

export async function infoDialog(
  title: string,
  message: string,
): Promise<void> {
  const dialog = createDialog(`
    <form method="dialog" class="dialog-body">
      <h2>${escapeHtml(title)}</h2>
      <p class="dialog-message">${escapeHtml(message)}</p>
      <div class="dialog-actions">
        <button class="btn primary" value="confirm">知道了</button>
      </div>
    </form>
  `);

  dialog.showModal();
  await waitForDialog(dialog);
}

function createDialog(content: string): HTMLDialogElement {
  const dialog = document.createElement("dialog");
  dialog.className = "dialog";
  dialog.innerHTML = content;
  document.body.append(dialog);
  return dialog;
}

function waitForDialog(dialog: HTMLDialogElement): Promise<string> {
  return new Promise((resolve) => {
    dialog.addEventListener(
      "close",
      () => {
        const result = dialog.returnValue;
        dialog.remove();
        resolve(result);
      },
      { once: true },
    );
  });
}
