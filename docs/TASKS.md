# Implementation Tasks for UI-SPEC

This document tracks the implementation of the VS Code-style layout system as specified in UI-SPEC.md.
Each task follows Test-Driven Development (TDD) methodology.

## Task Tracking Format

Each task follows this structure:
- [ ] **Status**: ⏳ Not Started | 🚧 In Progress | ✅ Complete | ⚠️ Blocked
- **Tests Written**: List of test files
- **Implementation**: List of implementation files
- **PR/Commit**: Link to PR or commit hash
- **Notes**: Any important observations or decisions

---

## Phase 1: Foundation & Shell Scaffolding

### Task 1.1: Project Structure Setup
- [x] **Status**: ✅ Complete
- **Tests Written**: 
  - [x] `tests/layout/regions.test.ts` - Test region visibility states
  - [x] `tests/layout/persistence.test.ts` - Test layout serialization
- **Implementation**:
  - [x] Create `src/layout/` directory structure
  - [x] Create `src/components/` for UI components
  - [x] Create `src/state/` for state management (partial)
- **PR/Commit**: c090187
- **Notes**: Structure created with layout management and persistence 

### Task 1.2: Layout State Model & Types
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [ ] `tests/unit/state/layout-types.test.ts` - Validate TypeScript types
  - [ ] `tests/unit/state/layout-model.test.ts` - Test model creation/validation
- **Implementation**:
  - [ ] `src/renderer/types/layout.ts` - Define LayoutNode, Split, Leaf, Tab types
  - [ ] `src/renderer/types/widget.ts` - Define Widget interface
  - [ ] `src/renderer/types/regions.ts` - Define region types
- **PR/Commit**: 
- **Notes**: 

### Task 1.3: Shell Layout Component
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [ ] `tests/unit/components/AppShell.test.ts` - Test shell rendering
  - [ ] `tests/e2e/shell.spec.ts` - E2E test for shell regions
- **Implementation**:
  - [ ] `src/renderer/components/AppShell.tsx` - Main layout container
  - [ ] `src/renderer/components/AppShell.css` - CSS Grid/Flexbox layout
  - [ ] Update `src/renderer.ts` to render AppShell
- **PR/Commit**: 
- **Notes**: 

### Task 1.4: Activity Bar
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [ ] `tests/unit/components/ActivityBar.test.ts` - Test icon rendering, selection
  - [ ] `tests/e2e/activity-bar.spec.ts` - Test click interactions
- **Implementation**:
  - [ ] `src/renderer/components/ActivityBar.tsx` - Activity bar component
  - [ ] `src/renderer/components/ActivityBarItem.tsx` - Individual items
  - [ ] `src/renderer/hooks/useActivityBar.ts` - State management
- **PR/Commit**: 
- **Notes**: 

### Task 1.5: Side Bar Containers
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [ ] `tests/unit/components/SideBar.test.ts` - Test show/hide, resize
  - [ ] `tests/e2e/sidebars.spec.ts` - Test toggle and resize
- **Implementation**:
  - [ ] `src/renderer/components/PrimarySideBar.tsx`
  - [ ] `src/renderer/components/SecondarySideBar.tsx`
  - [ ] `src/renderer/hooks/useSideBar.ts` - Visibility & width state
- **PR/Commit**: 
- **Notes**: 

### Task 1.6: Panel Container
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [ ] `tests/unit/components/Panel.test.ts` - Test position switching
  - [ ] `tests/e2e/panel.spec.ts` - Test toggle and dock position
- **Implementation**:
  - [ ] `src/renderer/components/Panel.tsx` - Panel component
  - [ ] `src/renderer/hooks/usePanel.ts` - Position & visibility state
- **PR/Commit**: 
- **Notes**: 

### Task 1.7: Status Bar
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [ ] `tests/unit/components/StatusBar.test.ts` - Test status items
- **Implementation**:
  - [ ] `src/renderer/components/StatusBar.tsx`
  - [ ] `src/renderer/components/StatusBarItem.tsx`
- **PR/Commit**: 
- **Notes**: 

---

## Phase 2: Shared Components

### Task 2.1: Resize Gutter Component
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [ ] `tests/unit/components/ResizeGutter.test.ts` - Test drag events
  - [ ] `tests/unit/components/ResizeGutter.test.ts` - Test min/max constraints
- **Implementation**:
  - [ ] `src/renderer/components/shared/ResizeGutter.tsx`
  - [ ] `src/renderer/hooks/useResize.ts` - Resize logic
- **PR/Commit**: 
- **Notes**: 

### Task 2.2: Tab Strip Component
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [ ] `tests/unit/components/TabStrip.test.ts` - Test tab rendering
  - [ ] `tests/unit/components/TabStrip.test.ts` - Test tab interactions
- **Implementation**:
  - [ ] `src/renderer/components/shared/TabStrip.tsx`
  - [ ] `src/renderer/components/shared/Tab.tsx`
  - [ ] `src/renderer/components/shared/TabStrip.css`
- **PR/Commit**: 
- **Notes**: 

### Task 2.3: Split Container Component
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [ ] `tests/unit/components/SplitContainer.test.ts` - Test split layouts
  - [ ] `tests/unit/components/SplitContainer.test.ts` - Test size distribution
- **Implementation**:
  - [ ] `src/renderer/components/shared/SplitContainer.tsx`
  - [ ] `src/renderer/utils/splitCalculations.ts`
- **PR/Commit**: 
- **Notes**: 

### Task 2.4: Focus Ring & Accessibility
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [ ] `tests/unit/components/FocusRing.test.ts` - Test focus visibility
  - [ ] `tests/e2e/accessibility.spec.ts` - Test keyboard navigation
- **Implementation**:
  - [ ] `src/renderer/components/shared/FocusRing.tsx`
  - [ ] `src/renderer/utils/focusManager.ts`
  - [ ] `src/renderer/utils/aria.ts` - ARIA helpers
- **PR/Commit**: 
- **Notes**: 

---

## Phase 3: Editor Grid Core

### Task 3.1: Layout Reducer
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [x] `tests/state/layoutReducer.test.ts` - Test all actions (16 tests)
  - [x] `tests/state/layoutReducer.test.ts` - Test invariants
- **Implementation**:
  - [x] `src/state/layoutReducer.ts` - Pure reducer with all actions
  - [x] Tree manipulation helpers (compact, replace, rebuild)
  - [x] Size enforcement with minimum constraints
- **PR/Commit**: In progress
- **Notes**: Automatic tree compaction when leaves become empty 

### Task 3.2: Editor Grid Component
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [x] `tests/components/EditorGrid.test.tsx` - Test tree rendering (9 tests)
  - [x] Tests for splits, tabs, keyboard shortcuts, resize
- **Implementation**:
  - [x] `src/components/editor/EditorGrid.tsx` - Main grid with keyboard shortcuts
  - [x] `src/components/editor/EditorLeaf.tsx` - Leaf nodes with tab strip
  - [x] `src/components/editor/EditorSplit.tsx` - Split nodes with resize
- **PR/Commit**: In progress
- **Notes**: Integrated with shared components (TabStrip, SplitContainer) 

### Task 3.3: Split/Merge Actions
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [x] Included in `tests/state/layoutReducer.test.ts`
  - [x] Test split logic (horizontal and vertical)
  - [x] Test merge & automatic compaction
- **Implementation**:
  - [x] SPLIT_LEAF action in reducer
  - [x] MERGE_LEAF action in reducer
  - [x] Automatic tree compaction when leaves become empty
- **PR/Commit**: In progress
- **Notes**: Split creates Welcome tab, auto-merges empty leaves 

### Task 3.4: Tab Lifecycle Actions
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [x] Included in `tests/state/layoutReducer.test.ts`
  - [x] Test tab CRUD operations
  - [x] Test dirty tab protection
- **Implementation**:
  - [x] ADD_TAB action with index support
  - [x] CLOSE_TAB action with dirty protection
  - [x] ACTIVATE_TAB action with focus tracking
  - [x] MOVE_TAB action between leaves
  - [x] REORDER_TABS action within leaf
- **PR/Commit**: In progress
- **Notes**: Includes dirty tab protection and focus history 

### Task 3.5: Resize Split Action
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [x] Included in `tests/state/layoutReducer.test.ts`
  - [x] Test resize with size normalization
  - [x] Test minimum size constraints (10%)
- **Implementation**:
  - [x] RESIZE_SPLIT action in reducer
  - [x] Size normalization to always sum to 100%
  - [x] Intelligent minimum size enforcement
- **PR/Commit**: In progress
- **Notes**: Redistributes space when hitting minimums 

---

## Phase 4: Drag & Drop

### Task 4.1: Drag & Drop Infrastructure
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/dnd/dragManager.test.ts` - Test drag state
  - [ ] `tests/unit/dnd/dropZones.test.ts` - Test drop zone detection
- **Implementation**:
  - [ ] `src/renderer/utils/dragManager.ts` - DnD state management
  - [ ] `src/renderer/utils/dropZones.ts` - Drop zone calculations
  - [ ] `src/renderer/hooks/useDragDrop.ts` - React hooks
- **PR/Commit**: 
- **Notes**: 

### Task 4.2: Tab Dragging
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/components/DraggableTab.test.ts` - Test drag initiation
  - [ ] `tests/e2e/tab-drag.spec.ts` - Test tab dragging
- **Implementation**:
  - [ ] Update Tab component with drag handlers
  - [ ] Add drag preview rendering
  - [ ] Implement tab reordering via drag
- **PR/Commit**: 
- **Notes**: 

### Task 4.3: Split via Drag
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/dnd/edge-drop.test.ts` - Test edge detection
  - [ ] `tests/e2e/drag-split.spec.ts` - Test split creation via drag
- **Implementation**:
  - [ ] Add edge drop zones to leaves
  - [ ] Implement drop overlay visualization
  - [ ] Create splits on edge drops
- **PR/Commit**: 
- **Notes**: 

### Task 4.4: Dock Overlay
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/components/DockOverlay.test.ts` - Test overlay rendering
- **Implementation**:
  - [ ] `src/renderer/components/shared/DockOverlay.tsx`
  - [ ] Drop zone highlighting
  - [ ] Preview animations
- **PR/Commit**: 
- **Notes**: 

---

## Phase 5: Commands & Keyboard

### Task 5.1: Command System
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/commands/commandManager.test.ts` - Test command registry
  - [ ] `tests/unit/commands/commands.test.ts` - Test command execution
- **Implementation**:
  - [ ] `src/renderer/commands/commandManager.ts`
  - [ ] `src/renderer/commands/layoutCommands.ts`
  - [ ] Command palette integration
- **PR/Commit**: 
- **Notes**: 

### Task 5.2: Keyboard Shortcuts
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/keyboard/shortcuts.test.ts` - Test key bindings
  - [ ] `tests/e2e/keyboard.spec.ts` - Test keyboard navigation
- **Implementation**:
  - [ ] `src/renderer/keyboard/shortcutManager.ts`
  - [ ] `src/renderer/keyboard/defaultKeybindings.ts`
  - [ ] Platform-specific bindings
- **PR/Commit**: 
- **Notes**: 

### Task 5.3: Focus Management
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/focus/focusManager.test.ts` - Test focus cycling
  - [ ] `tests/e2e/focus.spec.ts` - Test F6/Shift+F6 cycling
- **Implementation**:
  - [ ] `src/renderer/focus/focusManager.ts`
  - [ ] `src/renderer/focus/focusTrap.ts`
  - [ ] Region focus cycling (F6)
- **PR/Commit**: 
- **Notes**: 

### Task 5.4: Welcome Tab
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/widgets/WelcomeTab.test.ts` - Test welcome content
  - [ ] `tests/e2e/welcome.spec.ts` - Test welcome interactions
- **Implementation**:
  - [ ] `src/renderer/widgets/WelcomeTab.tsx`
  - [ ] Default content for new splits
  - [ ] Quick action buttons
- **PR/Commit**: 
- **Notes**: 

---

## Phase 6: Persistence

### Task 6.1: State Serialization
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/persistence/serialization.test.ts` - Test serialize/deserialize
  - [ ] `tests/unit/persistence/migration.test.ts` - Test version migration
- **Implementation**:
  - [ ] `src/renderer/persistence/serializer.ts`
  - [ ] `src/renderer/persistence/migrations.ts`
  - [ ] Version handling
- **PR/Commit**: 
- **Notes**: 

### Task 6.2: Storage Layer
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/persistence/storage.test.ts` - Test save/load
  - [ ] `tests/unit/persistence/storage.test.ts` - Test error recovery
- **Implementation**:
  - [ ] `src/renderer/persistence/storage.ts`
  - [ ] IndexedDB or localStorage backend
  - [ ] Debounced saves
- **PR/Commit**: 
- **Notes**: 

### Task 6.3: Layout Recovery
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/persistence/recovery.test.ts` - Test crash recovery
  - [ ] `tests/e2e/persistence.spec.ts` - Test restore across restart
- **Implementation**:
  - [ ] `src/renderer/persistence/recovery.ts`
  - [ ] Snapshot rotation
  - [ ] Fallback to default layout
- **PR/Commit**: 
- **Notes**: 

---

## Phase 7: Widget System

### Task 7.1: Widget Interface
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/widgets/widgetInterface.test.ts` - Test widget lifecycle
- **Implementation**:
  - [ ] `src/renderer/widgets/WidgetBase.ts` - Base class/interface
  - [ ] `src/renderer/widgets/WidgetRegistry.ts` - Widget registration
  - [ ] Widget lifecycle methods
- **PR/Commit**: 
- **Notes**: 

### Task 7.2: Text Editor Widget
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/widgets/TextEditor.test.ts` - Test editor widget
  - [ ] `tests/e2e/text-editor.spec.ts` - Test editing
- **Implementation**:
  - [ ] `src/renderer/widgets/TextEditor.tsx`
  - [ ] Monaco or CodeMirror integration
  - [ ] Save/load file content
- **PR/Commit**: 
- **Notes**: 

### Task 7.3: Services Bridge
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/services/services.test.ts` - Test service injection
- **Implementation**:
  - [ ] `src/renderer/services/ServiceProvider.tsx`
  - [ ] `src/renderer/services/FileService.ts`
  - [ ] `src/renderer/services/EventService.ts`
  - [ ] IPC bridge updates
- **PR/Commit**: 
- **Notes**: 

---

## Phase 8: Accessibility

### Task 8.1: ARIA Implementation
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/a11y/aria.test.ts` - Test ARIA attributes
  - [ ] `tests/e2e/a11y.spec.ts` - Test screen reader support
- **Implementation**:
  - [ ] Add ARIA roles to all components
  - [ ] Implement live regions
  - [ ] Focus indicators
- **PR/Commit**: 
- **Notes**: 

### Task 8.2: Keyboard Navigation
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/e2e/keyboard-nav.spec.ts` - Test all keyboard paths
- **Implementation**:
  - [ ] Tab navigation within regions
  - [ ] Arrow key navigation
  - [ ] Escape key handling
- **PR/Commit**: 
- **Notes**: 

### Task 8.3: Screen Reader Announcements
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/a11y/announcements.test.ts` - Test announcements
- **Implementation**:
  - [ ] `src/renderer/a11y/announcer.ts`
  - [ ] Split/merge announcements
  - [ ] Tab change announcements
- **PR/Commit**: 
- **Notes**: 

---

## Phase 9: Performance & Polish

### Task 9.1: Performance Optimization
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/performance/resize.perf.ts` - Test resize performance
  - [ ] `tests/performance/render.perf.ts` - Test render performance
- **Implementation**:
  - [ ] Implement React.memo where needed
  - [ ] Add resize throttling
  - [ ] Lazy loading for inactive tabs
- **PR/Commit**: 
- **Notes**: 

### Task 9.2: Error Handling
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/errors/errorBoundary.test.ts` - Test error recovery
- **Implementation**:
  - [ ] `src/renderer/components/ErrorBoundary.tsx`
  - [ ] Widget error handling
  - [ ] Toast notifications
- **PR/Commit**: 
- **Notes**: 

### Task 9.3: Theme Integration
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/unit/theme/theme.test.ts` - Test theme application
- **Implementation**:
  - [ ] CSS variables for theming
  - [ ] Dark/light mode support
  - [ ] High contrast mode
- **PR/Commit**: 
- **Notes**: 

---

## Phase 10: E2E Test Suite

### Task 10.1: Core Flow Tests
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/e2e/core-flows.spec.ts` - Test main user journeys
- **Implementation**:
  - [ ] Split/merge via mouse
  - [ ] Tab lifecycle
  - [ ] Persistence across restart
- **PR/Commit**: 
- **Notes**: 

### Task 10.2: Edge Case Tests
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/e2e/edge-cases.spec.ts` - Test boundary conditions
- **Implementation**:
  - [ ] Min size constraints
  - [ ] Empty leaf handling
  - [ ] Invalid state recovery
- **PR/Commit**: 
- **Notes**: 

### Task 10.3: Performance Tests
- [ ] **Status**: ⏳ Not Started
- **Tests Written**:
  - [ ] `tests/e2e/performance.spec.ts` - Test performance metrics
- **Implementation**:
  - [ ] Measure resize FPS
  - [ ] Measure tab switching time
  - [ ] Memory leak detection
- **PR/Commit**: 
- **Notes**: 

---

## Completion Checklist

### MVP Complete When:
- [ ] Shell with all regions functional
- [ ] Editor Grid supports splits and tabs
- [ ] Basic keyboard navigation works
- [ ] Layout persists across restart
- [ ] All unit tests passing
- [ ] Core E2E tests passing

### V1 Complete When:
- [ ] All drag & drop working
- [ ] Full keyboard shortcut support
- [ ] Accessibility complete (ARIA, focus management)
- [ ] Welcome tab and widget system
- [ ] Performance optimized
- [ ] All tests passing
- [ ] Documentation complete

---

## Notes

### TDD Process for Each Task:
1. Write failing tests first
2. Implement minimal code to pass tests
3. Refactor for clarity and performance
4. Update this document with completion status
5. Create PR for review

### Definition of Done:
- Tests written and passing
- Code reviewed
- E2E tests updated if needed
- Documentation updated
- No console errors
- Accessibility verified

### Risk Mitigation:
- Start with simpler tasks to establish patterns
- Keep PRs small and focused
- Test on multiple screen sizes
- Verify keyboard-only navigation
- Test with screen readers

---

*Last Updated: [Date]*
*Current Phase: Not Started*
*Blocked Tasks: None*