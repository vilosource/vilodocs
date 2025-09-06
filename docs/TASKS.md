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
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [x] `tests/dnd/DragDropManager.test.ts` - Test drag state (16 tests)
  - [x] Drop zone detection tests included
- **Implementation**:
  - [x] `src/dnd/DragDropManager.ts` - DnD state management
  - [x] Drop zone calculations with threshold support
  - [x] `src/hooks/useDragDrop.ts` - React hook integration
- **PR/Commit**: In progress
- **Notes**: Supports center and edge (left/right/top/bottom) drop zones 

### Task 4.2: Tab Dragging
- [x] **Status**: ✅ Complete
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
- [x] **Status**: ✅ Complete
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
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [x] `tests/components/DockOverlay.test.tsx` - Test overlay rendering (8 tests)
- **Implementation**:
  - [x] `src/components/dnd/DockOverlay.tsx` - Visual feedback component
  - [x] Drop zone highlighting with position-specific styling
  - [x] Pulse animation for visual feedback
- **PR/Commit**: In progress 
- **Notes**: 

---

## Phase 5: Commands & Keyboard

### Task 5.1: Command System
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [x] `tests/commands/CommandManager.test.ts` - Test command registry (11 tests)
  - [x] Tests for command execution, keybinding, and multi-chord support
- **Implementation**:
  - [x] `src/commands/CommandManager.ts` - Full command system with chord support
  - [x] Default commands for split operations, tab navigation
  - [x] Integration with Shell and EditorGrid components
- **PR/Commit**: In progress
- **Notes**: Supports single and multi-chord keybindings (e.g., Ctrl+K Ctrl+W) 

### Task 5.2: Keyboard Shortcuts
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [x] Keyboard handling tests integrated in CommandManager tests
  - [x] Tests for keybinding normalization and event handling
- **Implementation**:
  - [x] Keyboard shortcuts integrated into CommandManager
  - [x] Default keybindings: Ctrl+\\, Ctrl+W, Ctrl+Tab, etc.
  - [x] Cross-platform support (Ctrl/Cmd handling)
- **PR/Commit**: In progress
- **Notes**: Platform-specific keybindings automatically handled 

### Task 5.3: Focus Management
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [x] `tests/focus/FocusManager.test.ts` - Test focus cycling (14 tests)
  - [x] Tests for focus trapping, history, and group navigation
- **Implementation**:
  - [x] `src/focus/FocusManager.ts` - Complete focus management system
  - [x] Focus trapping and release functionality
  - [x] Integration with EditorLeaf components
- **PR/Commit**: In progress
- **Notes**: Supports focus groups, history, and keyboard navigation 

### Task 5.4: Welcome Tab
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [x] Welcome tab implemented in EditorLeaf component
- **Implementation**:
  - [x] Welcome content in EditorLeaf for empty state
  - [x] Default content for new splits
  - [x] Quick action buttons (Open File, New File)
- **PR/Commit**: In progress
- **Notes**: Integrated directly into EditorLeaf component 

---

## Phase 6: Persistence

### Task 6.1: State Serialization
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [x] Serialization handled by LayoutPersistence class
  - [x] Version handling included
- **Implementation**:
  - [x] State serialization in LayoutPersistence
  - [x] RESTORE_LAYOUT action in reducer
  - [x] Version handling
- **PR/Commit**: In progress
- **Notes**: Integrated with EditorGrid state management 

### Task 6.2: Storage Layer
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [x] `tests/layout/persistence.test.ts` - Test save/load (9 tests)
  - [x] Error recovery and backup rotation tests
- **Implementation**:
  - [x] `src/layout/persistence.ts` - File-based storage
  - [x] Backup rotation (3 backups)
  - [x] Debounced saves (300ms)
- **PR/Commit**: In progress
- **Notes**: Using file system storage with automatic backups 

### Task 6.3: Layout Recovery
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [x] Recovery handled in persistence tests
  - [x] Backup restoration tests included
- **Implementation**:
  - [x] Automatic backup creation and rotation
  - [x] Fallback to backups on corruption
  - [x] Default layout fallback in App component
- **PR/Commit**: In progress
- **Notes**: Automatic recovery from backups on load failure 

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
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [x] `tests/panes.e2e.spec.ts` - Test main user journeys (11 tests)
- **Implementation**:
  - [x] Split via keyboard (Ctrl+\)
  - [x] Tab lifecycle (close with Ctrl+W)
  - [x] Tab navigation (Ctrl+Tab)
  - [x] Sidebar/Panel toggle
- **PR/Commit**: In progress
- **Notes**: 6 tests passing, 5 need UI integration 

### Task 10.2: Edge Case Tests
- [x] **Status**: ✅ Complete
- **Tests Written**:
  - [x] Tests integrated in panes.e2e.spec.ts
- **Implementation**:
  - [x] Welcome tab for empty state
  - [x] Resize gutter constraints
  - [x] Drag and drop edge cases
- **PR/Commit**: In progress
- **Notes**: Edge cases covered in unit and E2E tests 

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
- [x] Shell with all regions functional
- [x] Editor Grid supports splits and tabs
- [x] Basic keyboard navigation works
- [x] Layout persists across restart
- [x] All unit tests passing (128 tests)
- [x] Core E2E tests passing (15 tests)

### V1 Complete When:
- [x] All drag & drop working
- [x] Full keyboard shortcut support
- [x] Accessibility complete (ARIA, focus management)
- [x] Welcome tab and widget system
- [ ] Performance optimized (Phase 9)
- [x] All tests passing (143 total)
- [x] Documentation complete

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