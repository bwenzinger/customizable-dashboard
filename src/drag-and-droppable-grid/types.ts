import type { ReactNode, RefObject } from 'react';

export type DraggableGridBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type DraggableGridResponsiveColumns = Partial<
  Record<DraggableGridBreakpoint, number>
>;

export type DraggableGridProps<T extends DraggableGridItem> = {
  ref: RefObject<HTMLDivElement | null>;
  layout: T[];
  onLayoutChanged: (nextLayout: T[]) => void;
  onLayoutCommitted?: (
    nextLayout: T[],
    previousLayout: T[],
    reason: 'drop' | 'itemResize'
  ) => void;
  renderItem: (item: T, index: number, isDragging: boolean) => ReactNode;
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
  row?: number;
  column?: number;
};

export type ReorderLock = {
  left: number;
  right: number;
  top: number;
  bottom: number;
} | null;

export type ResizeState<T extends DraggableGridItem> = {
  itemId: string;
  startClientX: number;
  startWidth: number;
  layoutAtResizeStart: T[];
} | null;

export type GridResizeState = {
  startClientY: number;
  startRowCount: number;
} | null;

export interface ResizeAnchorInfo {
  clientX: number;
  width: number;
  parentCoords: DOMRect;
}
