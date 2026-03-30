import { typedKeys } from './typedKeys';
import type {
  DraggableGridBreakpoint,
  DraggableGridResponsiveColumns,
} from './types';

export function reorderItems<T>(
  items: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  if (fromIndex === toIndex) {
    return items;
  }

  const nextItems = [...items];
  const movedItem = nextItems[fromIndex];

  if (!movedItem) {
    return items;
  }

  nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);

  return nextItems;
}

export function shouldReorderOnOverlap(args: {
  draggingRect: DOMRect | undefined;
  targetRect: DOMRect;
  clientX: number;
  clientY: number;
  overlapPx: number;
}): boolean {
  const { draggingRect, targetRect, clientX, clientY, overlapPx } = args;

  if (!draggingRect) {
    return (
      clientY >= targetRect.top + Math.min(overlapPx, targetRect.height / 2)
    );
  }

  // If both items visually occupy the same row, reorder based on horizontal
  // overlap; otherwise use vertical overlap for cross-row movement.
  const sameRow = hasMeaningfulVerticalOverlap(draggingRect, targetRect);

  if (sameRow) {
    const threshold = Math.min(overlapPx, targetRect.width / 2);
    const draggingCenterX = draggingRect.left + draggingRect.width / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;

    if (draggingCenterX <= targetCenterX) {
      return clientX >= targetRect.left + threshold;
    }

    return clientX <= targetRect.right - threshold;
  }

  const threshold = Math.min(overlapPx, targetRect.height / 2);
  const draggingCenterY = draggingRect.top + draggingRect.height / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  if (draggingCenterY <= targetCenterY) {
    return clientY >= targetRect.top + threshold;
  }

  return clientY <= targetRect.bottom - threshold;
}

export function findReorderIndexFromPointer<T extends { id: string }>(args: {
  items: T[];
  draggingId: string;
  rectByItemId: Map<string, DOMRect>;
  clientX: number;
  clientY: number;
}): number | null {
  const { items, draggingId, rectByItemId, clientX, clientY } = args;
  const rowTolerancePx = 8;
  const visualItems = items
    .filter((item) => item.id !== draggingId)
    .map((item, index) => {
      const rect = rectByItemId.get(item.id);

      if (!rect) {
        return null;
      }

      return {
        itemId: item.id,
        index,
        rect,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((first, second) => {
      const topDelta = first.rect.top - second.rect.top;

      if (Math.abs(topDelta) > rowTolerancePx) {
        return topDelta;
      }

      return first.rect.left - second.rect.left;
    });

  if (visualItems.length === 0) {
    return null;
  }

  const rows: Array<typeof visualItems> = [];

  visualItems.forEach((item) => {
    const lastRow = rows.at(-1);

    if (
      !lastRow ||
      Math.abs(lastRow[0].rect.top - item.rect.top) > rowTolerancePx
    ) {
      rows.push([item]);
      return;
    }

    lastRow.push(item);
  });

  for (const row of rows) {
    const rowTop = Math.min(...row.map((item) => item.rect.top));
    const rowBottom = Math.max(...row.map((item) => item.rect.bottom));

    if (clientY < rowTop) {
      return items.findIndex((item) => item.id === row[0].itemId);
    }

    if (clientY <= rowBottom) {
      for (const item of row) {
        if (clientX < item.rect.left + item.rect.width / 2) {
          return items.findIndex((entry) => entry.id === item.itemId);
        }
      }

      const lastItem = row[row.length - 1];

      return items.findIndex((entry) => entry.id === lastItem.itemId) + 1;
    }
  }

  return items.length - 1;
}

function hasMeaningfulVerticalOverlap(
  firstRect: DOMRect,
  secondRect: DOMRect
): boolean {
  const overlapTop = Math.max(firstRect.top, secondRect.top);
  const overlapBottom = Math.min(firstRect.bottom, secondRect.bottom);
  const overlapHeight = Math.max(0, overlapBottom - overlapTop);
  const minimumRelevantOverlap =
    Math.min(firstRect.height, secondRect.height) * 0.35;

  return overlapHeight >= minimumRelevantOverlap;
}

export function isPointWithinRect(args: {
  clientX: number;
  clientY: number;
  rect: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}): boolean {
  const { clientX, clientY, rect } = args;

  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

export function expandRect(args: { rect: DOMRect; paddingPx: number }): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const { rect, paddingPx } = args;

  return {
    left: rect.left - paddingPx,
    right: rect.right + paddingPx,
    top: rect.top - paddingPx,
    bottom: rect.bottom + paddingPx,
  };
}

export function getResizedColumnSpan(args: {
  containerWidth: number;
  columns: number;
  gap: number;
  startWidth: number;
  deltaX: number;
}): number {
  const { containerWidth, columns, gap, startWidth, deltaX } = args;

  const singleColumnWidth = (containerWidth - gap * (columns - 1)) / columns;
  const strideWidth = singleColumnWidth + gap;
  // Require a bit of horizontal travel before changing span so minor pointer
  // jitter does not cause accidental resize jumps.
  const activationPx = Math.min(40, Math.max(20, strideWidth * 0.18));

  console.log('activationPx: ', activationPx);

  if (deltaX >= activationPx) {
    return startWidth + Math.floor((deltaX - activationPx) / strideWidth) + 1;
  }

  if (deltaX <= -activationPx) {
    return (
      startWidth - (Math.floor((-deltaX - activationPx) / strideWidth) + 1)
    );
  }

  return startWidth;
}

export function clamp(
  value: number,
  minValue: number,
  maxValue: number
): number {
  return Math.min(Math.max(value, minValue), maxValue);
}

export function normalizeItemWidth(args: {
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

export function normalizeLayoutWidths<
  T extends {
    width: number;
    minWidth: number;
    maxWidth: number;
  },
>(layout: T[], columns: number): T[] {
  return layout.map((item) => {
    const normalizedWidth = normalizeItemWidth({
      width: item.width,
      minWidth: item.minWidth,
      maxWidth: item.maxWidth,
      columns,
    });

    if (normalizedWidth === item.width) {
      return item;
    }

    return {
      ...item,
      width: normalizedWidth,
    };
  });
}

export function normalizeLayoutPositions<
  T extends {
    id: string;
    width: number;
    minWidth: number;
    maxWidth: number;
    row?: number;
    column?: number;
  },
>(layout: T[], columns: number): T[] {
  const occupiedCells = new Set<string>();

  return normalizeLayoutWidths(layout, columns).map((item) => {
    const desiredRow = Math.max(1, item.row ?? 1);
    const maxColumnStart = Math.max(1, columns - item.width + 1);
    const desiredColumn = clamp(item.column ?? 1, 1, maxColumnStart);
    // Keep each item as close as possible to its requested slot, but push it
    // forward if that slot is already occupied by an earlier item.
    const placement = findNextAvailableSlot({
      occupiedCells,
      columns,
      width: item.width,
      startRow: desiredRow,
      startColumn: desiredColumn,
    });

    markOccupiedCells({
      occupiedCells,
      row: placement.row,
      column: placement.column,
      width: item.width,
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

export function moveItemToGridSlot<
  T extends {
    id: string;
    width: number;
    minWidth: number;
    maxWidth: number;
    row?: number;
    column?: number;
  },
>(args: {
  layout: T[];
  itemId: string;
  row: number;
  column: number;
  columns: number;
}): T[] {
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

export function resizeItemInLayout<
  T extends {
    id: string;
    width: number;
    minWidth: number;
    maxWidth: number;
    row?: number;
    column?: number;
  },
>(args: { layout: T[]; itemId: string; width: number; columns: number }): T[] {
  const { layout, itemId, width, columns } = args;
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
    },
    columns,
  });
}

export function getRequiredRowCount<T extends { row?: number }>(
  layout: T[]
): number {
  return layout.reduce((maxRow, item) => Math.max(maxRow, item.row ?? 1), 1);
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
  } = args;
  const availableWidth = containerRect.width - padding * 2;
  const innerWidth = availableWidth - gap * Math.max(0, columns - 1);
  const columnWidth = innerWidth / columns;
  const columnStride = columnWidth + gap;
  const rowStride = rowHeight + gap;
  const itemPixelWidth =
    itemWidth * columnWidth + Math.max(0, itemWidth - 1) * gap;
  const maxColumnStart = Math.max(1, columns - itemWidth + 1);
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
    projectedTop + rowHeight / 2,
    rowHeight / 2,
    rowStride * Math.max(1, rowCount) - gap - rowHeight / 2
  );
  // Convert the center point to the nearest valid *start column* for an item of
  // this width. Using the dragged item's full width keeps wider cards from
  // feeling biased to the right while 1x1 cards still snap naturally.
  const rawColumn =
    Math.round((centerX - itemPixelWidth / 2) / columnStride) + 1;
  const rawRow = Math.round((centerY - rowHeight / 2) / rowStride) + 1;

  return {
    row: clamp(rawRow, 1, rowCount),
    column: clamp(rawColumn, 1, maxColumnStart),
  };
}

function findNextAvailableSlot(args: {
  occupiedCells: Set<string>;
  columns: number;
  width: number;
  startRow: number;
  startColumn: number;
}): { row: number; column: number } {
  const { occupiedCells, columns, width, startRow, startColumn } = args;

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
}): boolean {
  const { occupiedCells, row, column, width } = args;

  for (let offset = 0; offset < width; offset += 1) {
    if (occupiedCells.has(getOccupiedCellKey(row, column + offset))) {
      return false;
    }
  }

  return true;
}

function markOccupiedCells(args: {
  occupiedCells: Set<string>;
  row: number;
  column: number;
  width: number;
}): void {
  const { occupiedCells, row, column, width } = args;

  for (let offset = 0; offset < width; offset += 1) {
    occupiedCells.add(getOccupiedCellKey(row, column + offset));
  }
}

function getOccupiedCellKey(row: number, column: number): string {
  return `${row}:${column}`;
}

function normalizeLayoutWithPriority<
  T extends {
    id: string;
    width: number;
    minWidth: number;
    maxWidth: number;
    row?: number;
    column?: number;
  },
>(args: { layout: T[]; prioritizedItem: T; columns: number }): T[] {
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
  const breakpointKeys = typedKeys(matches);

  for (const breakpoint of breakpointKeys) {
    if (matches[breakpoint]) {
      return breakpoint;
    }
  }

  return 'xs';
}
