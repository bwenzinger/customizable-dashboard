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

export function resolveColumns(args: {
  columns: number | DraggableGridResponsiveColumns;
  matches: Record<DraggableGridBreakpoint, boolean>;
}): number {
  const { columns, matches } = args;

  if (typeof columns === 'number') {
    return Math.max(1, columns);
  }

  const orderedBreakpoints: DraggableGridBreakpoint[] = [
    'xl',
    'lg',
    'md',
    'sm',
    'xs',
  ];

  // Walk from the largest active breakpoint downward so larger layouts can
  // override smaller ones while still inheriting missing values.
  for (const breakpoint of orderedBreakpoints) {
    if (matches[breakpoint]) {
      const value = getResponsiveValueForBreakpoint({
        columns,
        breakpoint,
      });

      if (value !== undefined) {
        return Math.max(1, value);
      }
    }
  }

  return 1;
}

function getResponsiveValueForBreakpoint(args: {
  columns: DraggableGridResponsiveColumns;
  breakpoint: DraggableGridBreakpoint;
}): number | undefined {
  const { columns, breakpoint } = args;

  const fallbackOrderByBreakpoint: Record<
    DraggableGridBreakpoint,
    DraggableGridBreakpoint[]
  > = {
    xs: ['xs'],
    sm: ['sm', 'xs'],
    md: ['md', 'sm', 'xs'],
    lg: ['lg', 'md', 'sm', 'xs'],
    xl: ['xl', 'lg', 'md', 'sm', 'xs'],
  };

  for (const key of fallbackOrderByBreakpoint[breakpoint]) {
    const value = columns[key];

    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}
