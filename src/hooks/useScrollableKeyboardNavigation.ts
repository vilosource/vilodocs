import { useEffect, RefObject } from 'react';

interface UseScrollableKeyboardNavigationOptions {
  /** Whether this scrollable area is currently active/focused */
  isActive?: boolean;
  /** Pixels to scroll for arrow keys (default: 40) */
  arrowKeyStep?: number;
  /** Percentage of viewport to scroll for page keys (default: 0.9) */
  pageStep?: number;
  /** Enable vim-style j/k navigation (default: false) */
  enableVimNavigation?: boolean;
  /** Custom key handlers to extend or override default behavior */
  customKeyHandlers?: Record<string, (event: KeyboardEvent, element: HTMLElement) => void>;
}

/**
 * Hook that adds keyboard navigation to a scrollable element.
 * Implements VS Code-style keyboard navigation patterns.
 */
export function useScrollableKeyboardNavigation(
  containerRef: RefObject<HTMLElement>,
  options: UseScrollableKeyboardNavigationOptions = {}
) {
  const {
    isActive = true,
    arrowKeyStep = 40,
    pageStep = 0.9,
    enableVimNavigation = false,
    customKeyHandlers = {}
  } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isActive) return;

    // Focus the container when it becomes active
    const focusTimeout = setTimeout(() => {
      if (!document.activeElement || 
          !container.contains(document.activeElement) ||
          document.activeElement === document.body) {
        container.focus();
      }
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      const element = container;
      
      // Check for custom handlers first
      if (customKeyHandlers[event.key]) {
        customKeyHandlers[event.key](event, element);
        return;
      }

      // Don't handle if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.contentEditable === 'true') {
        return;
      }

      let handled = true;
      const viewportHeight = element.clientHeight;
      const scrollHeight = element.scrollHeight;
      const currentScroll = element.scrollTop;
      const maxScroll = scrollHeight - viewportHeight;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          element.scrollBy({
            top: -arrowKeyStep,
            behavior: 'smooth'
          });
          break;

        case 'ArrowDown':
          event.preventDefault();
          element.scrollBy({
            top: arrowKeyStep,
            behavior: 'smooth'
          });
          break;

        case 'PageUp':
          event.preventDefault();
          element.scrollBy({
            top: -(viewportHeight * pageStep),
            behavior: 'smooth'
          });
          break;

        case 'PageDown':
          event.preventDefault();
          element.scrollBy({
            top: viewportHeight * pageStep,
            behavior: 'smooth'
          });
          break;

        case 'Home':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            element.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
          }
          break;

        case 'End':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            element.scrollTo({
              top: maxScroll,
              behavior: 'smooth'
            });
          }
          break;

        case ' ': // Spacebar
          if (!event.shiftKey) {
            // Page down
            event.preventDefault();
            element.scrollBy({
              top: viewportHeight * pageStep,
              behavior: 'smooth'
            });
          } else {
            // Shift+Space: Page up
            event.preventDefault();
            element.scrollBy({
              top: -(viewportHeight * pageStep),
              behavior: 'smooth'
            });
          }
          break;

        case 'j':
          if (enableVimNavigation && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            element.scrollBy({
              top: arrowKeyStep,
              behavior: 'smooth'
            });
          } else {
            handled = false;
          }
          break;

        case 'k':
          if (enableVimNavigation && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            element.scrollBy({
              top: -arrowKeyStep,
              behavior: 'smooth'
            });
          } else {
            handled = false;
          }
          break;

        case 'g':
          if (enableVimNavigation && !event.ctrlKey && !event.metaKey && !event.altKey) {
            // Check for gg (go to top) - would need stateful handling
            // For now, just g goes to top
            event.preventDefault();
            element.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
          } else {
            handled = false;
          }
          break;

        case 'G':
          if (enableVimNavigation && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            element.scrollTo({
              top: maxScroll,
              behavior: 'smooth'
            });
          } else {
            handled = false;
          }
          break;

        default:
          handled = false;
      }

      if (!handled) {
        // Let the event bubble up for other handlers
        return;
      }
    };

    // Add event listener
    container.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      clearTimeout(focusTimeout);
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    containerRef,
    isActive,
    arrowKeyStep,
    pageStep,
    enableVimNavigation,
    customKeyHandlers
  ]);

  // Return scroll position info that components might find useful
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      
      // Could emit custom events or update state here if needed
      container.setAttribute('data-scroll-percentage', scrollPercentage.toFixed(2));
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef]);
}

export default useScrollableKeyboardNavigation;