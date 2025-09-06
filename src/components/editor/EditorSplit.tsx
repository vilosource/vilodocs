import React from 'react';
import { Split } from '../../layout/types';
import { SplitContainer } from '../shared/SplitContainer';
import './EditorSplit.css';

interface EditorSplitProps {
  split: Split;
  activeLeafId: string;
  onResize: (sizes: number[]) => void;
  children: React.ReactNode[];
}

export const EditorSplit: React.FC<EditorSplitProps> = ({
  split,
  activeLeafId,
  onResize,
  children
}) => {
  return (
    <div className="editor-split">
      <SplitContainer
        direction={split.dir === 'row' ? 'horizontal' : 'vertical'}
        sizes={split.sizes}
        minSize={100}
        onSizesChange={onResize}
      >
        {children}
      </SplitContainer>
    </div>
  );
};