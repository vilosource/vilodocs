export type LayoutNode = Split | Leaf;

export interface Split {
  id: string;
  type?: 'split';
  dir: 'row' | 'col';
  sizes: number[];
  children: LayoutNode[];
  constraints?: {
    minChildSizePx?: number;
  };
}

export interface Leaf {
  id: string;
  type?: 'leaf';
  tabs: Tab[];
  activeTabId?: string;
  constraints?: {
    minSizePx?: number;
  };
}

export interface Tab {
  id: string;
  title: string;
  icon?: string;
  dirty?: boolean;
  closeable?: boolean;
  widget: WidgetRef;
}

export interface WidgetRef {
  type: string;
  props?: Record<string, unknown>;
}

export function isSplit(node: LayoutNode): node is Split {
  return 'dir' in node && 'children' in node;
}

export function isLeaf(node: LayoutNode): node is Leaf {
  return 'tabs' in node;
}