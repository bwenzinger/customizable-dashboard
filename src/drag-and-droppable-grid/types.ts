import type { ReactNode, RefObject } from 'react';

export type DraggableGridBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type DraggableGridResponsiveColumns = Partial<
  Record<DraggableGridBreakpoint, number>
>;

export type DraggableGridProps = {
  ref: RefObject<HTMLDivElement | null>;
  layout: DraggableGridItem[];
  onLayoutChanged: (nextLayout: DraggableGridItem[]) => void;
  onLayoutCommitted?: (
    nextLayout: DraggableGridItem[],
    previousLayout: DraggableGridItem[],
    reason: 'drop' | 'itemResize'
  ) => void;
  renderItem: (
    item: DraggableGridItem,
    index: number,
    isDragging: boolean
  ) => ReactNode;
  columns?: number | DraggableGridResponsiveColumns;
  initialRowCount?: number;
  minRowCount?: number;
  rowHeight?: number;
  showGridlines?: boolean;
  gap?: number;
  className?: string;
  itemClassName?: string;
  animationMs?: number;
  resizeHandleWidth?: number;
};

export type DraggableGridItem = {
  id: string;
  width: number;
  minWidth: number;
  maxWidth: number;
  height?: number;
  minHeight?: number;
  maxHeight?: number;
  row?: number;
  column?: number;
};

export type ReorderLock = {
  left: number;
  right: number;
  top: number;
  bottom: number;
} | null;

export type ResizeState = {
  itemId: string;
  layoutAtResizeStart: DraggableGridItem[];
  parentCoords: DOMRect;
} | null;

export type GridResizeState = {
  startClientY: number;
  startRowCount: number;
} | null;
