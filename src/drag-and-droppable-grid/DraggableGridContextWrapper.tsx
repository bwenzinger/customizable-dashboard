import { useRef } from 'react';
import { DraggableGrid } from './DraggableGrid';
import { DraggableGridContext } from './DraggableGridContext';
import type { DraggableGridProps } from './types';

export function DraggableGridContextWrapper(
  props: Omit<DraggableGridProps, 'ref'>
) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  return (
    <DraggableGridContext value={{ containerRef: gridRef }}>
      <DraggableGrid {...props} ref={gridRef} />
    </DraggableGridContext>
  );
}
