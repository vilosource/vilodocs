# Markdown Viewer Test

Welcome to the **Markdown Viewer** component test! This document demonstrates various markdown features.

## Table of Contents

- [Features](#features)
- [Code Examples](#code-examples)
- [Lists](#lists)
- [Tables](#tables)
- [Math](#math)

## Features

The Markdown Viewer supports:

- ✅ **GitHub Flavored Markdown** (GFM)
- ✅ **Syntax highlighting** for code blocks
- ✅ **Math expressions** with KaTeX
- ✅ **Emoji support** :rocket: :heart: :tada:
- ✅ **Task lists**
- ✅ **Tables**
- ✅ **Collapsible Table of Contents**
- ✅ **Copy code buttons**

## Code Examples

### JavaScript

```javascript
// Example React component
function MarkdownViewer({ content, onEdit }) {
  const [showToc, setShowToc] = useState(true);
  
  return (
    <div className="markdown-viewer">
      <button onClick={onEdit}>Switch to Edit</button>
      {content && <ReactMarkdown>{content}</ReactMarkdown>}
    </div>
  );
}
```

### Python

```python
# Example Python function
def fibonacci(n):
    """Generate Fibonacci sequence up to n terms."""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    else:
        fib = [0, 1]
        for i in range(2, n):
            fib.append(fib[i-1] + fib[i-2])
        return fib

# Usage
print(fibonacci(10))
```

### TypeScript

```typescript
interface WidgetProps {
  content: string;
  filePath?: string;
  onSwitchToEdit?: () => void;
}

const MarkdownWidget: React.FC<WidgetProps> = ({ 
  content, 
  filePath, 
  onSwitchToEdit 
}) => {
  return (
    <div className="widget">
      <h1>Markdown Content</h1>
      <pre>{content}</pre>
    </div>
  );
};
```

## Lists

### Unordered Lists

- First item
- Second item
  - Nested item A
  - Nested item B
- Third item

### Ordered Lists

1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Final step

### Task Lists

- [x] Implement MarkdownViewer component
- [x] Add syntax highlighting
- [x] Create table of contents
- [ ] Add search functionality
- [ ] Implement print support
- [ ] Add export to PDF

## Tables

| Feature | Status | Priority |
|---------|--------|----------|
| Markdown rendering | ✅ Complete | High |
| Code highlighting | ✅ Complete | High |
| Table of contents | ✅ Complete | Medium |
| Math support | ✅ Complete | Medium |
| Search | ❌ Pending | Low |
| Export | ❌ Pending | Low |

## Math

The viewer supports both inline math like $E = mc^2$ and display math:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

Complex expressions work too:

$$
f(x) = \frac{1}{\sqrt{2\pi\sigma^2}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}
$$

## Blockquotes

> This is a blockquote. It can contain **bold text**, *italic text*, and even code: `console.log("Hello!")`.
>
> Blockquotes can span multiple lines and include other markdown elements.

## Links

- [External link](https://github.com)
- [Internal heading link](#features)
- [File link](./README.md)

## Images

![Sample diagram](https://via.placeholder.com/600x300/333333/FFFFFF?text=Sample+Image)

## Keyboard Shortcuts

Press <kbd>Ctrl</kbd>+<kbd>E</kbd> to switch to edit mode!

## Conclusion

This Markdown Viewer provides a rich, VS Code-like experience for viewing markdown files. Double-click anywhere to switch to edit mode, or use the edit button in the header.

Happy writing! 📝 ✨