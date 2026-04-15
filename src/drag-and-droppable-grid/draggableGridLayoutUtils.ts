import { getItemHeight, getItemWidth } from './gridMath';
import type { DraggableGridItem } from './types';

export function haveSameGridLayout<T extends DraggableGridItem>(
  first: T[],
  second: T[]
): boolean {
  return (
    first.length === second.length &&
    first.every((item, index) => {
      const candidate = second[index];

      return (
        item.id === candidate?.id &&
        getItemWidth(item) === getItemWidth(candidate) &&
        getItemHeight(item) === getItemHeight(candidate) &&
        item.row === candidate.row &&
        item.column === candidate.column
      );
    })
  );
}

export function areRectsApproximatelyEqual(
  first: DOMRect,
  second: DOMRect,
  epsilon = 0.5
): boolean {
  return (
    Math.abs(first.left - second.left) <= epsilon &&
    Math.abs(first.top - second.top) <= epsilon &&
    Math.abs(first.width - second.width) <= epsilon &&
    Math.abs(first.height - second.height) <= epsilon
  );
}

export function doGridItemsOverlap(
  first: Pick<DraggableGridItem, 'row' | 'column' | 'width' | 'height'>,
  second: Pick<DraggableGridItem, 'row' | 'column' | 'width' | 'height'>
): boolean {
  const firstRowStart = first.row ?? 1;
  const firstColumnStart = first.column ?? 1;
  const firstRowEnd = firstRowStart + getItemHeight(first) - 1;
  const firstColumnEnd = firstColumnStart + getItemWidth(first) - 1;
  const secondRowStart = second.row ?? 1;
  const secondColumnStart = second.column ?? 1;
  const secondRowEnd = secondRowStart + getItemHeight(second) - 1;
  const secondColumnEnd = secondColumnStart + getItemWidth(second) - 1;

  return !(
    firstRowEnd < secondRowStart ||
    secondRowEnd < firstRowStart ||
    firstColumnEnd < secondColumnStart ||
    secondColumnEnd < firstColumnStart
  );
}
