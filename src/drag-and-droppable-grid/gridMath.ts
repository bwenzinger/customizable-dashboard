import type {
  DraggableGridBreakpoint,
  DraggableGridItem,
  DraggableGridResponsiveColumns,
} from './types';

export function getResizedColumnSpan(args: {
  containerWidth: number;
  columns: number;
  gap: number;
  padding: number;
  parentCoords: DOMRect;
  clientX: number;
  currentWidth: number;
  resizeDirection: 'increase' | 'decrease' | null;
  stepThreshold?: number;
}): number {
  const {
    containerWidth,
    columns,
    gap,
    padding,
    parentCoords,
    clientX,
    currentWidth,
    resizeDirection,
    stepThreshold = 0.9,
  } = args;
  const availableWidth = containerWidth - padding * 2;
  const innerWidth = availableWidth - gap * Math.max(0, columns - 1);
  const singleColumnWidth = innerWidth / columns;
  const columnStride = singleColumnWidth + gap;
  const distanceFromLeftToMouse = clientX - parentCoords.left;
  const rawWidth = (distanceFromLeftToMouse + gap) / columnStride;

  return getDirectionalResizeSpan({
    rawSpan: rawWidth,
    currentSpan: currentWidth,
    resizeDirection,
    stepThreshold,
  });
}

export function getResizedRowSpan(args: {
  parentCoords: DOMRect;
  clientY: number;
  rowHeight: number;
  gap: number;
  currentHeight: number;
  resizeDirection: 'increase' | 'decrease' | null;
  stepThreshold?: number;
}): number {
  const {
    parentCoords,
    clientY,
    rowHeight,
    gap,
    currentHeight,
    resizeDirection,
    stepThreshold = 0.9,
  } = args;
  const rowStride = rowHeight + gap;
  const distanceFromTopToMouse = clientY - parentCoords.top;
  const rawHeight = (distanceFromTopToMouse + gap) / rowStride;

  return getDirectionalResizeSpan({
    rawSpan: rawHeight,
    currentSpan: currentHeight,
    resizeDirection,
    stepThreshold,
  });
}

export function clamp(
  value: number,
  minValue: number,
  maxValue: number
): number {
  return Math.min(Math.max(value, minValue), maxValue);
}

export function clampItemWidth(args: {
  width: number;
  minWidth: number;
  maxWidth: number;
  columns: number;
}): number {
  const { width, minWidth, maxWidth, columns } = args;
  const maxAllowedWidth = Math.max(1, Math.min(maxWidth, columns));
  const minAllowedWidth = Math.min(Math.max(1, minWidth), maxAllowedWidth);

  return clamp(width, minAllowedWidth, maxAllowedWidth);
}

export function getItemHeight(
  item?: Pick<DraggableGridItem, 'height'>
): number {
  return Math.max(1, item?.height ?? 1);
}

export function clampItemHeight(args: {
  height: number;
  minHeight: number;
  maxHeight: number;
}): number {
  const { height, minHeight, maxHeight } = args;
  const maxAllowedHeight = Math.max(1, maxHeight);
  const minAllowedHeight = Math.min(Math.max(1, minHeight), maxAllowedHeight);

  return clamp(height, minAllowedHeight, maxAllowedHeight);
}

export function normalizeLayoutSpans(
  layout: DraggableGridItem[],
  columns: number
): DraggableGridItem[] {
  return layout.map((item) => {
    const normalizedWidth = clampItemWidth({
      width: item.width,
      minWidth: item.minWidth,
      maxWidth: item.maxWidth,
      columns,
    });
    const normalizedHeight = clampItemHeight({
      height: getItemHeight(item),
      minHeight: item.minHeight ?? 1,
      maxHeight: item.maxHeight ?? getItemHeight(item),
    });
    const hasWidthChanged = normalizedWidth !== item.width;
    const hasHeightChanged = normalizedHeight !== getItemHeight(item);

    if (!hasWidthChanged && !hasHeightChanged) {
      return item;
    }

    return {
      ...item,
      ...(hasWidthChanged ? { width: normalizedWidth } : {}),
      ...(hasHeightChanged ? { height: normalizedHeight } : {}),
    };
  });
}

export function normalizeLayoutPositions(
  layout: DraggableGridItem[],
  columns: number
): DraggableGridItem[] {
  const occupiedCells = new Set<string>();

  return normalizeLayoutSpans(layout, columns).map((item) => {
    const desiredRow = Math.max(1, item.row ?? 1);
    const maxColumnStart = Math.max(1, columns - item.width + 1);
    const desiredColumn = clamp(item.column ?? 1, 1, maxColumnStart);
    const itemHeight = getItemHeight(item);
    // Keep each item as close as possible to its requested slot, but push it
    // forward if that slot is already occupied by an earlier item.
    const placement = findNextAvailableSlot({
      occupiedCells,
      columns,
      width: item.width,
      height: itemHeight,
      startRow: desiredRow,
      startColumn: desiredColumn,
    });
    markOccupiedCells({
      occupiedCells,
      row: placement.row,
      column: placement.column,
      width: item.width,
      height: itemHeight,
    });

    if (item.row === placement.row && item.column === placement.column) {
      return item;
    }

    return {
      ...item,
      row: placement.row,
      column: placement.column,
    };
  });
}

export function moveItemToGridSlot(args: {
  layout: DraggableGridItem[];
  itemId: string;
  row: number;
  column: number;
  columns: number;
}): DraggableGridItem[] {
  const { layout, itemId, row, column, columns } = args;
  const movedItem = layout.find((item) => item.id === itemId);

  if (!movedItem) {
    return layout;
  }

  // Give the actively moved item priority at the requested slot, then reflow
  // every other item around it.
  return normalizeLayoutWithPriority({
    layout,
    prioritizedItem: {
      ...movedItem,
      row,
      column,
    },
    columns,
  });
}

export function resizeItemInLayout(args: {
  layout: DraggableGridItem[];
  itemId: string;
  width: number;
  height: number;
  columns: number;
}): DraggableGridItem[] {
  const { layout, itemId, width, height, columns } = args;
  const resizedItem = layout.find((item) => item.id === itemId);

  if (!resizedItem) {
    return layout;
  }

  // Keep the actively resized item anchored to its current slot first, then let
  // the rest of the grid move around it. This avoids "skipping" widths when an
  // earlier item temporarily occupies the resized space.
  return normalizeLayoutWithPriority({
    layout,
    prioritizedItem: {
      ...resizedItem,
      width,
      height,
    },
    columns,
  });
}

export function getRequiredRowCount<T extends { row?: number; height?: number }>(
  layout: T[]
): number {
  return layout.reduce((maxRow, item) => {
    const rowEnd = (item.row ?? 1) + getItemHeight(item) - 1;

    return Math.max(maxRow, rowEnd);
  }, 1);
}

export function getGridSlotFromPointer(args: {
  clientX: number;
  clientY: number;
  containerRect: DOMRect;
  columns: number;
  rowCount: number;
  rowHeight: number;
  gap: number;
  padding: number;
  itemWidth: number;
  itemHeight: number;
}): { row: number; column: number } {
  const {
    clientX,
    clientY,
    containerRect,
    columns,
    rowCount,
    rowHeight,
    gap,
    padding,
    itemWidth,
    itemHeight,
  } = args;
  const availableWidth = containerRect.width - padding * 2;
  const innerWidth = availableWidth - gap * Math.max(0, columns - 1);
  const columnWidth = innerWidth / columns;
  const columnStride = columnWidth + gap;
  const rowStride = rowHeight + gap;
  const gridHeight = rowCount * rowHeight + Math.max(0, rowCount - 1) * gap;
  const itemPixelWidth =
    itemWidth * columnWidth + Math.max(0, itemWidth - 1) * gap;
  const itemPixelHeight =
    itemHeight * rowHeight + Math.max(0, itemHeight - 1) * gap;
  const maxColumnStart = Math.max(1, columns - itemWidth + 1);
  const maxRowStart = Math.max(1, rowCount - itemHeight + 1);
  // `clientX`/`clientY` represent the dragged card's projected top-left corner.
  // Snap using the card's visual center so moving left/right feels symmetric.
  const projectedLeft = clientX - containerRect.left - padding;
  const projectedTop = clientY - containerRect.top - padding;
  const centerX = clamp(
    projectedLeft + itemPixelWidth / 2,
    columnWidth / 2,
    availableWidth - itemPixelWidth / 2
  );
  const centerY = clamp(
    projectedTop + itemPixelHeight / 2,
    itemPixelHeight / 2,
    gridHeight - itemPixelHeight / 2
  );
  // Convert the center point to the nearest valid *start column* for an item of
  // this width. Using the dragged item's full width keeps wider cards from
  // feeling biased to the right while 1x1 cards still snap naturally.
  const rawColumn =
    Math.round((centerX - itemPixelWidth / 2) / columnStride) + 1;
  const rawRow = Math.round((centerY - itemPixelHeight / 2) / rowStride) + 1;

  return {
    row: clamp(rawRow, 1, maxRowStart),
    column: clamp(rawColumn, 1, maxColumnStart),
  };
}

function getDirectionalResizeSpan(args: {
  rawSpan: number;
  currentSpan: number;
  resizeDirection: 'increase' | 'decrease' | null;
  stepThreshold: number;
}): number {
  const {
    rawSpan,
    currentSpan,
    resizeDirection,
    stepThreshold,
  } = args;
  const clampedStepThreshold = clamp(stepThreshold, 0, 1);
  const thresholdOffset = 1 - clampedStepThreshold;

  if (resizeDirection === 'increase') {
    return Math.max(currentSpan, Math.floor(rawSpan + thresholdOffset));
  }

  if (resizeDirection === 'decrease') {
    return Math.min(currentSpan, Math.ceil(rawSpan - thresholdOffset));
  }

  return currentSpan;
}

function findNextAvailableSlot(args: {
  occupiedCells: Set<string>;
  columns: number;
  width: number;
  height: number;
  startRow: number;
  startColumn: number;
}): { row: number; column: number } {
  const { occupiedCells, columns, width, height, startRow, startColumn } = args;

  // Search from the desired slot outward so items preserve intentional gaps
  // whenever possible instead of always collapsing back to row 1 / column 1.
  for (let row = startRow; row < startRow + 500; row += 1) {
    const firstColumn = row === startRow ? startColumn : 1;
    const lastColumn = Math.max(1, columns - width + 1);

    for (let column = firstColumn; column <= lastColumn; column += 1) {
      if (
        canPlaceItem({
          occupiedCells,
          row,
          column,
          width,
          height,
        })
      ) {
        return {
          row,
          column,
        };
      }
    }
  }

  return {
    row: startRow,
    column: startColumn,
  };
}

function canPlaceItem(args: {
  occupiedCells: Set<string>;
  row: number;
  column: number;
  width: number;
  height: number;
}): boolean {
  const { occupiedCells, row, column, width, height } = args;

  for (let rowOffset = 0; rowOffset < height; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < width; columnOffset += 1) {
      if (
        occupiedCells.has(
          getOccupiedCellKey(row + rowOffset, column + columnOffset)
        )
      ) {
        return false;
      }
    }
  }

  return true;
}

function markOccupiedCells(args: {
  occupiedCells: Set<string>;
  row: number;
  column: number;
  width: number;
  height: number;
}): void {
  const { occupiedCells, row, column, width, height } = args;

  for (let rowOffset = 0; rowOffset < height; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < width; columnOffset += 1) {
      occupiedCells.add(getOccupiedCellKey(row + rowOffset, column + columnOffset));
    }
  }
}

function getOccupiedCellKey(row: number, column: number): string {
  return `${row}:${column}`;
}

function normalizeLayoutWithPriority(args: {
  layout: DraggableGridItem[];
  prioritizedItem: DraggableGridItem;
  columns: number;
}): DraggableGridItem[] {
  const { layout, prioritizedItem, columns } = args;
  const prioritizedLayout = [
    prioritizedItem,
    ...layout.filter((item) => item.id !== prioritizedItem.id),
  ];
  const resolvedLayout = normalizeLayoutPositions(prioritizedLayout, columns);
  const resolvedById = new Map(
    resolvedLayout.map((item) => [item.id, item] as const)
  );

  return layout.map((item) => resolvedById.get(item.id) ?? item);
}

export function getNumColumns(args: {
  columns: number | DraggableGridResponsiveColumns;
  activeBreakpoint: DraggableGridBreakpoint;
}): number {
  const { columns, activeBreakpoint } = args;

  if (typeof columns === 'number') {
    return Math.max(1, columns);
  }

  return columns[activeBreakpoint] || 1;
}

export function getActiveBreakpoint(
  matches: Record<DraggableGridBreakpoint, boolean>
): DraggableGridBreakpoint {
  const breakpointOrder: DraggableGridBreakpoint[] = [
    'xl',
    'lg',
    'md',
    'sm',
    'xs',
  ];

  for (const breakpoint of breakpointOrder) {
    if (matches[breakpoint]) {
      return breakpoint;
    }
  }

  return 'xs';
}
