export const style = `
:root {
  color-scheme: dark;
  --bg: #070707;
  --panel: #111;
  --text: #e0e0e0;
  --muted: #9ba3af;
  --border: #2a2f36;
  --shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
}

body {
  background: var(--bg);
  color: var(--text);
  font: 16px/1.5 Verdana, sans-serif;
}

.topBar,
.manageTop,
.authWrap,
.authCard,
.editorCard,
.noteActions,
.blockActions {
  direction: ltr;
}

.titleText,
.defaultText,
.editorField,
.blockField {
  direction: auto;
  unicode-bidi: plaintext;
}

.topBar,
.manageTop {
  justify-content: flex-start;
}

main {
  max-width: 1440px;
  margin: 0 auto;
  padding: 1rem;
}

.topBar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin: 0 0 1rem;
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 0.75rem;
  background: rgba(7, 7, 7, 0.88);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.topBar input,
.topBar select,
.topBar button,
.authForm input,
.authForm button,
.editorField,
.blockField {
  background: #111;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.7rem 0.85rem;
  font: inherit;
}

.topBar input,
.authForm input,
.editorField,
.blockField {
  min-width: min(100%, 320px);
  flex: 1 1 280px;
}

.topBar select,
.topBar button,
.authForm button {
  flex: 0 0 auto;
}

.topBar button,
.authForm button,
.noteActions button,
.manageTop button,
.blockActions button {
  cursor: pointer;
}

.topBar button:hover,
.topBar select:hover,
.topBar input:hover,
.authForm input:hover,
.authForm button:hover,
.noteActions button:hover,
.manageTop button:hover,
.blockActions button:hover,
.editorField:hover,
.blockField:hover {
  border-color: #3d4652;
}

.meta {
  color: var(--muted);
  font-size: 0.95rem;
  margin-inline-start: auto;
  direction: ltr;
  unicode-bidi: plaintext;
}

.presetAction {
  min-width: auto !important;
  padding-inline: 0.9rem;
}

.presetAction.subtle {
  opacity: 0.82;
}

.presetBar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0 0.75rem 1rem;
}

.presetBarLabel {
  color: var(--muted);
  font-size: 0.92rem;
  padding-top: 0.4rem;
}

.presetList {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex: 1 1 100%;
}

.presetChipWrap {
  display: inline-flex;
  align-items: stretch;
  gap: 0.35rem;
}

.presetChip {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  max-width: min(100%, 280px);
  text-align: left;
  padding: 0.7rem 0.85rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #111;
  color: var(--text);
  cursor: pointer;
}

.presetChip:hover {
  border-color: #3d4652;
}

.presetChip.isActive {
  border-color: #89b4ff;
  box-shadow: 0 0 0 1px rgba(137, 180, 255, 0.16);
}

.presetChipLabel {
  font-weight: 600;
  line-height: 1.2;
}

.presetChipMeta {
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.2;
}

.presetChipDelete {
  min-width: auto !important;
  width: 2rem;
  padding: 0;
  border-radius: 12px;
  align-self: stretch;
  border: 1px solid var(--border);
  background: #111;
  color: var(--text);
}

.presetChipDelete:hover {
  border-color: #3d4652;
}

.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  align-items: start;
}

.defaultBox {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 320px;
  border-radius: 16px;
  padding: 0.9rem;
  box-shadow: var(--shadow);
  border: 1px solid rgba(255,255,255,0.04);
}

.defaultTitle {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0;
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  user-select: none;
  font-size: 1rem;
  line-height: 1.4;
  direction: auto;
  unicode-bidi: plaintext;
}

.titleText {
  flex: 1 1 auto;
}

.kindBadge {
  flex: 0 0 auto;
  font-size: 0.72rem;
  line-height: 1;
  letter-spacing: 0.08em;
  padding: 0.4rem 0.5rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.12);
}

.defaultTitle input[type="checkbox"] {
  width: 1.15rem;
  height: 1.15rem;
  margin: 0.1rem 0 0;
  accent-color: #89b4ff;
  flex: 0 0 auto;
}

.defaultText {
  margin: 0;
  padding: 0.8rem;
  border-radius: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  user-select: text;
  transition: background-color 0.15s ease, opacity 0.15s ease;
  direction: auto;
  unicode-bidi: plaintext;
}

.defaultText.canCopy { cursor: pointer; }
.defaultText.canCopy:hover { outline: 1px solid rgba(255,255,255,0.08); }

.pinToggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  margin-inline-start: auto;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
  cursor: pointer;
  flex: 0 0 auto;
}

.pinToggle:hover {
  background: rgba(255,255,255,0.08);
}

.pinIcon {
  width: 1rem;
  height: 1rem;
  display: block;
}

.noteBox { background-color: #1a0f24; }
.ticketBox { background-color: #15181c; }
.importantBox { background-color: #24110f; }

.noteTitle { background-color: #a569e2; color: #f6edff; }
.ticketTitle { background-color: #4682B4; color: #edf5ff; }
.importantTitle { background-color: #ff9800; color: #000; }

.noteText { color: #d7c2f2; background: rgba(165, 105, 226, 0.07); }
.ticketText { color: #e6eaf0; background: rgba(70, 130, 180, 0.08); }
.importantText { color: #ffd6a3; background: rgba(255, 152, 0, 0.08); }

.noteText:hover { background-color: #241530; }
.ticketText:hover { background-color: #242830; }
.importantText:hover { background-color: #321916; }

.isDone {
  filter: grayscale(100%) brightness(70%);
  opacity: 0.62;
}

.isPinned {
  box-shadow: 0 0 0 1px rgba(124,167,255,0.18), var(--shadow);
}

.isHidden { display: none !important; }

#toast {
  text-align: center;
  min-width: 120px;
  max-width: min(90vw, 460px);
  background-color: #f0f0f0;
  color: #070707;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  position: fixed;
  z-index: 9999;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  transition: opacity 0.25s ease;
  user-select: none;
  box-shadow: var(--shadow);
}

.emptyState {
  color: var(--muted);
  padding: 2rem 0.5rem;
  text-align: center;
  grid-column: 1 / -1;
}

.authWrap {
  max-width: 520px;
  margin: 10vh auto 0;
  padding: 1rem;
}

.authCard, .editorCard {
  background: #111;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 18px;
  box-shadow: var(--shadow);
  padding: 1rem;
}

.authCard h1, .editorCard h2 {
  margin: 0 0 0.75rem;
  font-size: 1.3rem;
}

.authForm {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.authForm input,
.editorField,
.blockField {
  direction: auto;
  unicode-bidi: plaintext;
}

.manageTop {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin: 0 0 1rem;
}

.manageGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
}

.editorCard {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.editorRow {
  display: grid;
  gap: 0.5rem;
}

.editorRow label {
  font-size: 0.9rem;
  color: var(--muted);
}

.editorField {
  width: 100%;
  min-width: 0;
}

.blockList {
  display: grid;
  gap: 0.75rem;
}

.blockItem {
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  background: rgba(255,255,255,0.02);
}

.blockFlags {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  color: var(--muted);
  font-size: 0.9rem;
}

.blockFlags label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.blockActions, .noteActions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.noteActions {
  margin-top: auto;
}

.manageHint {
  color: var(--muted);
  font-size: 0.92rem;
}

@media (max-width: 640px) {
  main { padding: 0.75rem; }
  .topBar { padding: 0.6rem; }
  .topBar input { flex-basis: 100%; }
  .meta { width: 100%; margin-inline-start: 0; }
  .manageGrid { grid-template-columns: 1fr; }
}


.placeholderHelp {
  display: grid;
  gap: 0.5rem;
}
.placeholderHelp summary {
  cursor: pointer;
  color: var(--muted);
  font-size: 0.9rem;
}
.placeholderGrid {
  display: grid;
  gap: 0.65rem;
}
.placeholderGroup {
  display: grid;
  gap: 0.4rem;
}
.placeholderGroupTitle {
  color: var(--muted);
  font-size: 0.85rem;
}
.placeholderButtons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.placeholderChip {
  border: 1px solid var(--border);
  background: #0f0f0f;
  color: var(--text);
  border-radius: 999px;
  padding: 0.4rem 0.65rem;
  font: inherit;
}
.placeholderChip:hover {
  border-color: #3d4652;
}

.copyModal {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 1rem;
}
.copyModal[hidden] {
  display: none !important;
}
.copyModalBackdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
}
.copyModalCard {
  position: relative;
  z-index: 1;
  width: min(760px, 100%);
  max-height: min(90vh, 900px);
  overflow: auto;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.08);
  background: #111318;
  box-shadow: 0 18px 50px rgba(0,0,0,0.55);
  padding: 1rem;
  display: grid;
  gap: 0.85rem;
  direction: ltr;
}
.copyModalHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}
.copyModalHeader h2 {
  margin: 0;
  font-size: 1.1rem;
}
.copyModalMeta {
  color: var(--muted);
  font-size: 0.85rem;
  margin-top: 0.2rem;
}
.copyModalHint {
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.5;
}
.copyModalForm {
  display: grid;
  gap: 0.75rem;
}
.copyModalField {
  display: grid;
  gap: 0.35rem;
  color: var(--text);
}
.copyModalField span,
.copyModalPreviewLabel {
  color: var(--muted);
  font-size: 0.9rem;
}
.copyModalField input,
.copyModalPreview,
.copyModalButton,
.copyModalClose {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #0f0f0f;
  color: var(--text);
  font: inherit;
}
.copyModalField input {
  padding: 0.7rem 0.85rem;
  direction: auto;
  unicode-bidi: plaintext;
}
.copyModalPreview {
  min-height: 180px;
  resize: vertical;
  padding: 0.8rem;
  white-space: pre-wrap;
  direction: auto;
  unicode-bidi: plaintext;
}
.copyModalActions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.copyModalButton,
.copyModalClose {
  padding: 0.65rem 0.9rem;
  cursor: pointer;
}
.copyModalButton.primary {
  background: #2b6cff;
  border-color: rgba(255,255,255,0.12);
}
.copyModalEmpty {
  color: var(--muted);
  font-size: 0.9rem;
  padding: 0.5rem 0;
}
html.modalOpen, html.modalOpen body {
  overflow: hidden;
}



.historySection {
  display: grid;
  gap: 0.65rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.historyHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.historyHeaderMain {
  display: grid;
  gap: 0.25rem;
}

.historyHeader h3 {
  margin: 0;
  font-size: 0.98rem;
}

.historyTopActions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.historyDiff {
  display: grid;
  gap: 0.5rem;
}

.historyDiff summary {
  cursor: pointer;
  color: var(--muted);
  font-size: 0.84rem;
}

.historyDiffText {
  margin: 0;
  padding: 0.75rem;
  border-radius: 10px;
  background: rgba(0,0,0,0.22);
  color: var(--text);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  direction: ltr;
  unicode-bidi: plaintext;
  font-size: 0.82rem;
  line-height: 1.45;
}

.historyList {
  display: grid;
  gap: 0.65rem;
}

.historyEntry {
  display: grid;
  gap: 0.45rem;
  padding: 0.7rem;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.03);
}

.historyMeta {
  color: var(--muted);
  font-size: 0.84rem;
}

.historySnapshot {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 0.9rem;
  color: var(--text);
  direction: auto;
  unicode-bidi: plaintext;
}

.historyActions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.toastAction {
  margin-inline-start: 0.75rem;
  border: 0;
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  background: #2b6cff;
  color: #fff;
  font: inherit;
  cursor: pointer;
}

.toastAction:hover {
  filter: brightness(1.06);
}

`;
