import { useRef } from 'react';
import { DraggableGrid } from './DraggableGrid';
import { DraggableGridContext } from './DraggableGridContext';
import type { DraggableGridItem, DraggableGridProps } from './types';

export function DraggableGridContextWrapper<T extends DraggableGridItem>(
  props: Omit<DraggableGridProps<T>, 'ref'>
) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  return (
    <DraggableGridContext value={{ containerRef: gridRef }}>
      <DraggableGrid<T> {...props} ref={gridRef} />
    </DraggableGridContext>
  );
}
