import type { ReactNode, RefObject } from 'react';

export type DraggableGridBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type DraggableGridResponsiveColumns = Partial<
  Record<DraggableGridBreakpoint, number>
>;

export type DraggableGridLayoutCommitReason =
  | 'drop'
  | 'itemResize'
  | 'collapse'
  | 'optimize';

export type DraggableGridChartType =
  | 'line'
  | 'scatter'
  | 'pie'
  | 'column';

export type DraggableGridChartPoint = {
  x: number;
  y: number;
};

export type DraggableGridItemKind =
  | 'card'
  | 'button'
  | 'chart'
  | 'richText'
  | 'image'
  | 'metric';

export type DraggableGridProps = {
  ref: RefObject<HTMLDivElement | null>;
  layout: DraggableGridItem[];
  onLayoutChanged: (nextLayout: DraggableGridItem[]) => void;
  onLayoutCommitted?: (
    nextLayout: DraggableGridItem[],
    previousLayout: DraggableGridItem[],
    reason: DraggableGridLayoutCommitReason
  ) => void;
  renderItem: (
    item: DraggableGridItem,
    index: number,
    isDragging: boolean,
    isResizing: boolean
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
  canEdit?: boolean;
  enableUndo?: boolean;
  enableCollapse?: boolean;
  enableOptimize?: boolean;
};

export type DraggableGridItem = {
  id: string;
  kind?: DraggableGridItemKind;
  title?: string;
  description?: string;
  body?: string;
  actionLabel?: string;
  chartType?: DraggableGridChartType;
  chartTrend?: string;
  chartValues?: number[];
  chartLabels?: string[];
  chartPoints?: DraggableGridChartPoint[];
  metricLabel?: string;
  metricValue?: string;
  metricTrend?: string;
  imageSrc?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
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
