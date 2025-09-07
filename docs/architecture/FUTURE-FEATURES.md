# Future Features Roadmap

This document outlines planned features for Vilodocs, based on extensive research of VS Code, Obsidian, Typora, and other leading Electron applications. These features will enhance Vilodocs into a powerful, keyboard-friendly document editor with advanced markdown capabilities.

## Priority Matrix

| Feature | Priority | Complexity | User Impact | Implementation Phase |
|---------|----------|------------|-------------|---------------------|
| Markdown Viewer (Default) | High | Medium | High | Phase 1 |
| Markdown Editor with Preview | High | Medium | High | Phase 2 |
| Command Palette | High | Low | High | Phase 3 |
| VS Code Keyboard Shortcuts | High | Medium | High | Phase 3 |
| Browser Widget | Medium | High | Medium | Phase 4 |
| Keybinding Configuration | Medium | Medium | Medium | Phase 5 |
| Export (PDF/HTML) | Low | Medium | Medium | Phase 6 |

## Feature Overview

### 1. Markdown System (High Priority)

**Goal**: Provide a best-in-class markdown experience similar to Obsidian/Typora

**Key Requirements**:
- Default to rendered view when opening .md files
- Seamless mode switching (view/edit/split)
- Synchronized scrolling between editor and preview
- Support for GitHub Flavored Markdown, Mermaid, MathJax
- Export capabilities (PDF, HTML)

**Rationale**: 
- Markdown is the de facto standard for technical documentation
- Users expect a polished reading experience by default
- Editing should be accessible but not intrusive

[Detailed specification: [MARKDOWN-SYSTEM.md](./MARKDOWN-SYSTEM.md)]

### 2. Command Palette (High Priority)

**Goal**: Implement VS Code-style command palette for keyboard-first navigation

**Key Requirements**:
- Fuzzy search for commands, files, and symbols
- Recent commands tracking
- Context-aware command filtering
- Extensible command registration
- Standard shortcut: `Ctrl+Shift+P`

**Rationale**:
- Essential for power users and keyboard warriors
- Dramatically improves discoverability
- Industry standard in modern editors

[Detailed specification: [COMMAND-PALETTE.md](./COMMAND-PALETTE.md)]

### 3. VS Code-Compatible Keyboard System (High Priority)

**Goal**: Support VS Code keyboard shortcuts for zero learning curve

**Key Requirements**:
- All essential VS Code shortcuts
- Multi-key sequences (chords)
- Context-aware bindings
- User-configurable keybindings.json
- Platform-specific variations

**Rationale**:
- VS Code has become the de facto standard
- Reduces learning curve for millions of developers
- Enables muscle memory transfer

[Detailed specification: [KEYBOARD-SYSTEM.md](./KEYBOARD-SYSTEM.md)]

### 4. Browser Widget (Medium Priority)

**Goal**: Enable web browsing within tabs for documentation and reference

**Key Requirements**:
- WebContentsView implementation (2024 standard)
- Full security sandboxing
- Navigation controls (URL bar, back/forward)
- No Node.js access in browser context
- Tab integration

**Rationale**:
- Useful for viewing documentation alongside code
- Enables integrated development workflows
- Common feature in modern editors

[Detailed specification: [BROWSER-WIDGET.md](./BROWSER-WIDGET.md)]

### 5. Advanced Features (Future Consideration)

**Potential additions**:
- Terminal integration
- Git integration
- Extension/plugin system
- Collaborative editing
- Cloud sync
- AI assistance integration

## Implementation Strategy

### Phase 1: Markdown Foundation (Weeks 1-2)
- Implement MarkdownViewer widget
- File type detection system
- Basic rendering with remark
- Integration with tab system

### Phase 2: Enhanced Editing (Weeks 3-4)
- Markdown editor with syntax highlighting
- Mode switching (view/edit/split)
- Synchronized scrolling
- Markdown-specific shortcuts

### Phase 3: Command System (Weeks 5-6)
- Command palette UI
- Fuzzy search implementation
- VS Code keyboard compatibility
- Command registration API

### Phase 4: Browser Integration (Week 7)
- WebContentsView setup
- Security implementation
- Navigation controls
- Tab integration

### Phase 5: Configuration (Week 8)
- Keybinding editor
- Settings UI
- Import/export functionality
- User preferences

### Phase 6: Polish & Export (Weeks 9-10)
- PDF/HTML export
- Performance optimization
- Documentation
- Testing

## Architecture Considerations

### Current Architecture Strengths
✅ **Widget system** - Ready for new widget types
✅ **Command infrastructure** - CommandManager exists
✅ **Layout system** - Supports splits and tabs
✅ **State management** - Can handle complex state

### Required Architectural Additions

1. **Service Layer Expansion**
   ```typescript
   - MarkdownService (parsing, rendering)
   - KeybindingService (management, conflicts)
   - CommandPaletteService (search, filtering)
   - BrowserService (WebContentsView management)
   ```

2. **Main Process Enhancements**
   ```typescript
   - WebContentsView lifecycle management
   - Global shortcut registration
   - Export functionality (PDF generation)
   ```

3. **IPC Channels**
   ```typescript
   - Browser navigation commands
   - Export operations
   - Global shortcut management
   ```

## Research Insights

### VS Code Analysis
- Complex but well-organized command system
- Service-based architecture with dependency injection
- Sophisticated keybinding context system
- WebView for markdown preview with synchronized scrolling

### Obsidian/Typora Patterns
- Default to reading mode for better UX
- Seamless mode transitions
- Fast markdown rendering with virtual scrolling
- Export functionality built-in

### Industry Trends (2024)
- WebContentsView replacing deprecated BrowserView
- Remark/unified ecosystem for markdown processing
- Mousetrap for complex keyboard handling
- Emphasis on security sandboxing

## Success Metrics

- **Performance**: 
  - Markdown files open in <100ms
  - Command palette responds in <50ms
  - No lag in synchronized scrolling

- **Usability**:
  - VS Code users can use without relearning
  - Discoverable features via command palette
  - Intuitive mode switching

- **Security**:
  - Full sandbox for browser widget
  - No Node.js exposure to web content
  - CSP implementation

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|-------------------|
| Performance degradation | Virtual scrolling, lazy loading, worker threads |
| Security vulnerabilities | Strict sandboxing, regular updates, security audits |
| Complex keyboard conflicts | Conflict detection, user override options |
| Markdown rendering bugs | Extensive testing, graceful fallbacks |
| Browser memory usage | Tab limits, automatic suspension |

## Dependencies

### NPM Packages Required
```json
{
  "remark": "^15.0.0",           // Markdown processing
  "remark-gfm": "^4.0.0",        // GitHub Flavored Markdown
  "remark-math": "^6.0.0",       // Math support
  "remark-mermaid": "^0.5.0",    // Diagram support
  "mousetrap": "^1.6.5",         // Keyboard handling
  "fuse.js": "^6.6.2",           // Fuzzy search
  "puppeteer": "^21.0.0"         // PDF export
}
```

## Next Steps

1. Review and approve feature specifications
2. Establish development timeline
3. Set up feature branches
4. Begin Phase 1 implementation
5. Regular testing and feedback cycles

## References

- [VS Code Command API](https://code.visualstudio.com/api/references/commands)
- [Electron WebContentsView](https://www.electronjs.org/docs/latest/api/web-contents-view)
- [Remark Ecosystem](https://github.com/remarkjs/remark)
- [Obsidian Developer Docs](https://docs.obsidian.md/)

---

*This document is a living specification and will be updated as requirements evolve and new insights emerge.*