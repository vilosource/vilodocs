# Electron App Split Layout & Tabs — Functional Specification

Version: 1.0
Status: Draft (ready for implementation)

## 1. Purpose & Scope

Define a VS Code–style workspace layout for an Electron desktop app:

* Center **Editor Grid** supports **recursive splits** (vertical & horizontal).
* Each **leaf** of the grid hosts a **tabbed stack** of **widgets** (pluggable UI components).
* Surrounding regions: Activity Bar, Side Bars (left/right), Panel (bottom/right), Status Bar.
* Persistent layout state, keyboard access, drag & drop, and accessibility.
  **Design constraint:** No nested tabs — each leaf exposes a single tab panel; widgets must not add another top-level tab bar.

**Non‑goals:** Theme design details, widget business logic, or app‑specific menus.

---

## 2. Terminology

* **Region**: Major UI area (Activity Bar, Primary Side Bar, Secondary Side Bar, Panel, Editor Grid, Status Bar).
* **Editor Grid**: Central area; a tree of **Split** and **Leaf** nodes.
* **Split**: Container that arranges children in a row (horizontal) or column (vertical) with resizable gutters.
* **Leaf**: Terminal node that renders tab(s) — one **active** at a time.
* **Widget**: A pluggable UI component rendered inside a tab (e.g., Editor, Markdown Preview, Terminal, Logs).

---

## 3. Top‑Level Regions & Behavior

1. **Activity Bar** (left, narrow): icons to switch views (Explorer, Search, SCM, Extensions, etc.).

   * Show/Hide, reorder icons, tooltips, keyboard focus.
2. **Primary Side Bar** (left): hosts the active view content (file tree, search panel, etc.).

   * Collapsible; remembers width; min width 200px; resizable via gutter.
3. **Secondary Side Bar** (right, optional): hosts a second view concurrently.

   * Same rules as Primary Side Bar.
4. **Panel** (bottom by default; movable to right): Problems, Output, Debug Console, Terminal, etc.

   * Collapsible; remembers size; resizable via gutter; move between bottom/right.
5. **Editor Grid** (center): recursive splits + tabs per leaf. See Sections 4–7.
6. **Status Bar** (bottom strip): app status; not a container.

All regions must be **toggleable** (visible/hidden) and **persist** last size/position.

---

## 4. Editor Grid — Data Model (conceptual)

```
LayoutNode = Split | Leaf

Split {
  id: string
  dir: 'row' | 'col'               // row = horizontal split bars; children laid left→right
  sizes: number[]                   // normalized fractions summing ~1, length = children.length
  children: LayoutNode[]            // ≥ 2
  constraints?: { minChildSizePx?: number }
}

Leaf {
  id: string
  tabs: Tab[]                       // 0..n (0 = empty leaf placeholder)
  activeTabId?: string
  constraints?: { minSizePx?: number }
}

Tab {
  id: string
  title: string
  icon?: string                      // optional icon name/key
  dirty?: boolean                    // unsaved state indicator
  closeable?: boolean
  widget: WidgetRef
}

WidgetRef {
  type: string                       // e.g., 'text-editor', 'markdown-preview', 'terminal'
  props?: Record<string, unknown>    // serializable initial props
}
```

**IDs** must be stable across sessions for rehydration.

---

## 5. Editor Grid — Core Actions (state transitions)

All actions must be **pure** (reducer‑style); UI dispatches intents with validated payloads.

* `ADD_TAB(targetLeafId, tab, index?)`
* `ACTIVATE_TAB(tabId)`
* `CLOSE_TAB(tabId, { force?: boolean })` → if `dirty` and not `force`, emit confirm request
* `SPLIT_LEAF(targetLeafId, dir: 'row'|'col', ratio?: number)` → returns new sibling Leaf; focus new Leaf
* `MERGE_LEAF(leafId)` → if leaf becomes empty and has a sibling, remove it and rebalance parent Split; collapse singleton Splits
* `MOVE_TAB(tabId, dstLeafId, index?)` → reparent tab; update both leaves' `activeTabId`
* `REORDER_TABS(leafId, fromIndex, toIndex)`
* `RESIZE_SPLIT(splitId, newSizes: number[])` → must respect min size constraints; renormalize to sum = 1
* `CLOSE_TABS_TO_RIGHT(leafId, fromIndex)` / `CLOSE_ALL_TABS(leafId)`

**Invariants:**

* Split children length ≥ 2; if it drops to 1, replace Split with the child (tree compaction).
* Sizes always normalized; enforce `minSizePx` when resizing.
* Each leaf maintains a valid `activeTabId` if it has tabs.

---

## 6. Drag & Drop Model

* **Tab drag** sources: tab label/handle; carry `tabId` + origin `leafId`.
* **Drop targets:**

  * **Center** of leaf → reorder or move into that tab stack.
  * **Edge zones** of leaf (N/E/S/W) → create a new split in that direction and drop tab into the new leaf.
* **Previews:** highlight prospective target; show split overlay & insertion marker.
* **Keyboard alternative:** focus tab → `Ctrl+Alt+Arrow` to split and move; `Ctrl+Shift+PageUp/Down` to reorder.

---

## 7. Resizing Behavior

* Gutter drag emits `RESIZE_SPLIT` with pixel delta → convert to proportional `sizes[]`.
* Enforce per‑child min size; if violated, clamp and redistribute remaining space.
* Double‑click gutter: equalize children (`sizes = 1/n`).
* Persist computed `sizes` on every change.

---

## 8. Persistence & Migration

* Persist **layout state** and **visible regions** to a versioned blob:

```
PersistedLayout {
  version: 1,
  editorGrid: LayoutNode,
  regions: {
    sideBarPrimary: { visible: boolean, widthPx: number },
    sideBarSecondary: { visible: boolean, widthPx: number },
    panel: { visible: boolean, position: 'bottom'|'right', sizePx: number },
    activityBar: { visible: boolean },
    statusBar: { visible: boolean }
  },
  lastFocused: { region: string, leafId?: string, tabId?: string }
}
```

* Storage: local JSON file or IndexedDB; atomic writes; keep last N snapshots for recovery.
* Migration: on version mismatch, run transformer functions; fallback to a sane default layout.

---

## 9. Accessibility (A11y)

* **Tabs:** ARIA roles `tablist`/`tab`/`tabpanel`; keyboard: `Ctrl+Tab` next, `Ctrl+Shift+Tab` prev; `Delete` closes.
* **Gutters:** focusable handles with `aria-orientation`; keyboard resize via `Arrow` keys + modifier.
* **Region toggles:** all toggles reachable via keyboard; visible focus outline.
* **Announcements:** when splitting/merging, announce changes to screen readers.

---

## 10. Keyboard Shortcuts (defaults)

* Toggle Primary Side Bar: `Ctrl+B`
* Toggle Panel: `Ctrl+J`
* Toggle Secondary Side Bar: `Ctrl+K Ctrl+B`
* Split Right/Down (from leaf): `Ctrl+\` / `Ctrl+Alt+\`
* Focus cycle (Activity Bar → Side Bars → Editor Grid → Panel → Status Bar): `F6` / `Shift+F6`
* Move tab left/right: `Ctrl+Shift+PageUp/Down`
* Move tab to new split: `Ctrl+Alt+Arrow`

(Use platform‑appropriate variants on macOS.)

---

\$1

**Constraint:** Widgets must not render an additional top‑level tab bar; multi-view widgets should use in‑widget navigation that is visually secondary and does not conflict with the layout tab strip.

**Lifecycle & API**

* `mount(container, props, services)` → returns `{ dispose?: () => void }`
* `onFocus()` / `onBlur()`
* `onResize(bounds)`
* `serializeState()` → JSON; used for persistence
* `restoreState(state)`

**Services (via preload contextBridge)**

* `events`: pub/sub bus for tab activation, file events
* `fs`: sanitized file ops
* `settings`: get/set app settings
* `ipc`: request/response to main for privileged actions

**Capabilities (optional metadata)**

* `wantsMonospace`, `prefersKeepAlive`, `supportsDragDrop`, `supportsSearchInWidget`

---

## 12. Rendering & Performance

* Use **CSS Grid or Flex** for splits; throttle `resize` events (rAF or 16ms).
* **Lazy mount** inactive tabs; optional keep‑alive for heavy widgets.
* Debounce persistence (e.g., 250ms) to limit disk writes.
* Avoid layout thrash: measure once per frame; use transforms for previews.

---

## 13. Error Handling

* Widget exceptions: surface in renderer console; show tab error badge; allow “Reload Tab”.
* Main/renderer crash: show non‑blocking toast and offer “Restore last layout”.
* Invalid persisted layout: fall back to default; keep a backup for support.

---

## 14. Testing Criteria

* **Unit:** reducer invariants (split/merge/resize/move), serialization → hydration idempotence.
* **E2E (Playwright):**

  * Split/merge via mouse and keyboard
  * Drag tab to create new split; reorder
  * Resize gutters; respect min sizes
  * Persistence across relaunch
  * No console errors during core flows

---

## 15. Default Layout (initial)

* Activity Bar: visible.
* Primary Side Bar: visible width 280px; view = Explorer.
* Secondary Side Bar: hidden.
* Panel: hidden (docked bottom).
* Editor Grid: single Leaf with one Welcome tab.

---

## 16. Open Questions (implementation‑time options)

* Should empty leaves auto‑merge immediately or show a drop target placeholder for a grace period?
* Keep‑alive policy for inactive tabs (global vs per‑widget)?
* Do we support floating windows/pop‑outs in v1?

---

## 17. Split Creation & Default Tab Behavior

### Commands & Context

* **Split Right / Split Down (keyboard or command palette):**

  * Creates a new sibling **Leaf** to the right/down of the current leaf.
  * If no tab is explicitly specified to move, the new leaf is initialized with a **Welcome** tab.
  * **Focus** moves to the new leaf.
* **Open in Split** (tab context menu) or **Drag tab to edge**:

  * Creates a new split in the drop direction and moves the dragged/selected tab into the new leaf (no Welcome tab).
  * Source leaf remains; if it becomes empty, compaction rules apply (auto-merge).

### Welcome Tab

* `id: 'welcome'` (unique per leaf instance), `title: 'Welcome'`, `closeable: true`.
* Contents: quick actions (Open File, New File, Open Folder, Recent, Settings) and keyboard hints.
* Shown only when a split is created **without** a tab being moved into it.
* Persisted like any other tab; may be auto-closed on first document open (configurable).

### Focus & Activation

* After any split, the **new leaf** is focused and its tab (Welcome or moved tab) is active.

## 18. Acceptance Criteria (v1)

* **No nested "tab inside a tab" UI:** each leaf exposes exactly one tab strip; widgets must not add another top-level tab bar.

1. User can split/merge recursively in both axes.
2. Each leaf supports tabs with close/reorder/move; state persists.
3. Side bars/panel toggle, resize, and persist; panel movable to right.
4. Keyboard access across all actions; a11y roles present.
5. All reducer actions are pure; invariants enforced.
6. Restarting the app restores the last layout exactly.

## 19. Implementation Order (MVP → v1)

**Answer to “what first?”** Build a thin **shell** for the global panes so sizing/toggles are real, but prioritize the **Editor Grid engine** early since it’s the most complex. Recommended order:

**MVP steps**

1. **Shell scaffolding:** Activity Bar, Primary/Secondary Side Bars, Panel, Status Bar — placeholders with show/hide + persisted sizes.
2. **Shared components:** ResizeGutter, SplitContainer, TabStrip, DockOverlay (drag previews), FocusRing.
3. **Editor Grid core:** state model + pure reducer; render tree; split/merge; per‑leaf tabs; keyboard nav; persistence.
4. **Drag & drop:** move/reorder tabs; edge drops to create splits.
5. **Commands:** Split Right/Down; Open in Split; default Welcome tab and compaction rules.
6. **Persistence & recovery:** versioned save, debounce writes, snapshot/restore.
7. **Accessibility:** ARIA for tablist/tabpanel, focusable gutters with keyboard resize.
8. **CI & E2E:** Playwright smoke covering split/drag/resize/no‑console‑errors.

**v1 extras**

* Panel movable to right; Secondary Side Bar polish.
* Shortcut customization; theming tokens; high‑contrast mode.
* Telemetry (optional): layout ops counters for UX tuning.

## 20. Deliverables & Definition of Done

* Pure reducer with invariant tests (split/merge/resize/move/tab lifecycle).
* Renderer components: Editor Grid, TabStrip, Gutter, DockOverlay.
* Preload “services” contract (ipc, settings, events); no Node API in widgets.
* Persisted layout with migration v1 → vNext.
* Playwright E2E suite and GitHub Actions workflow.
* Developer docs: API of actions, widget contract, keyboard map.

## 21. Risks & Mitigations

* **Nested‑tab confusion:** disallowed by spec; style inner widget navigation as secondary.
* **Performance on heavy widgets:** lazy‑mount inactive tabs; throttle resize; consider virtualization.
* **State corruption:** snapshot rotation; safe defaults on parse/migrate failure.
* **D\&D accessibility:** provide full keyboard alternatives; visible focus & drop hints.

