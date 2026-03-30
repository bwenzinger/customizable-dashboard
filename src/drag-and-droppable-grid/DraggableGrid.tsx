import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { Box } from '@mui/material';
import { DraggableGridCell } from './DraggableGridCell';
import { DebugGridOverlay } from './DebugGridOverlay';
import {
  getGridSlotFromPointer,
  getRequiredRowCount,
  getResizedColumnSpan,
  moveItemToGridSlot,
  normalizeItemWidth,
  normalizeLayoutPositions,
  resizeItemInLayout,
} from './gridMath';
import type {
  DraggableGridItem,
  DraggableGridProps,
  GridResizeState,
  ResizeState,
} from './types';
import { useDraggableGridInfo } from './useDraggableGridInfo';

export function DraggableGrid(props: DraggableGridProps): React.JSX.Element {
  const {
    ref,
    layout,
    onLayoutChanged,
    onLayoutCommitted,
    renderItem,
    columns = 3,
    initialRowCount = 6,
    minRowCount = 4,
    rowHeight = 140,
    showGridlines = false,
    gap = 12,
    className,
    itemClassName,
    animationMs = 320,
    resizeHandleWidth = 12,
  } = props;
  const containerPadding = 6;
  const gridResizeHandleHeight = 18;

  const { activeBreakpoint, numColumns } = useDraggableGridInfo({
    columns,
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState>(null);
  const [gridResizeState, setGridResizeState] = useState<GridResizeState>(null);
  const [rowCount, setRowCount] = useState<number>(
    Math.max(initialRowCount, minRowCount)
  );

  // const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const previousRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const isResizingRef = useRef<boolean>(false);
  const dragPointerOffsetRef = useRef<{ x: number; y: number } | null>(null);

  // Keep a normalized, collision-free version of the current committed layout
  // before it gets rendered or used as the basis for interaction math.
  const normalizedRenderedLayout = normalizeLayoutPositions(layout, numColumns);
  const requiredRowCount = getRequiredRowCount(normalizedRenderedLayout);
  // The grid can be manually expanded, but it should never shrink below the
  // rows required to display the current item placements.
  const resolvedRowCount = Math.max(rowCount, minRowCount, requiredRowCount);
  const gridContentHeight =
    resolvedRowCount * rowHeight + Math.max(0, resolvedRowCount - 1) * gap;

  useEffect(() => {
    // Normalize any externally supplied layout so widths and slot positions stay
    // valid even if the parent passes partial or out-of-date coordinates.
    const normalizedLayout = normalizeLayoutPositions(layout, numColumns);

    if (!haveSameGridLayout(layout, normalizedLayout)) {
      onLayoutChanged(normalizedLayout);
    }
  }, [layout, onLayoutChanged, numColumns]);

  useLayoutEffect(() => {
    // Measure item positions after every preview/commit so neighboring cards can
    // animate from their old slot into the new one.
    const nextRects = new Map<string, DOMRect>();
    const frameIds: number[] = [];

    normalizedRenderedLayout.forEach((item) => {
      if (item.id === draggingId) {
        return;
      }

      const element = itemRefs.current.get(item.id);

      if (!element) {
        return;
      }

      nextRects.set(item.id, element.getBoundingClientRect());
    });

    if (resizeState !== null || gridResizeState !== null) {
      // During active resizing we want direct manipulation, not FLIP motion.
      nextRects.forEach((_nextRect, itemId) => {
        const element = itemRefs.current.get(itemId);

        if (!element) {
          return;
        }

        element.style.transition = '';
        element.style.transform = '';
      });

      previousRectsRef.current = nextRects;
      return;
    }

    nextRects.forEach((nextRect, itemId) => {
      const previousRect = previousRectsRef.current.get(itemId);
      const element = itemRefs.current.get(itemId);

      if (!previousRect || !element) {
        return;
      }

      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;

      if (deltaX === 0 && deltaY === 0) {
        return;
      }

      element.style.transition = 'none';
      element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      void element.getBoundingClientRect();

      // On the next frame, remove the temporary offset so CSS animates the
      // element into the newly computed grid slot.
      const frameId = window.requestAnimationFrame(() => {
        element.style.transition = `transform ${animationMs}ms cubic-bezier(0.2, 0, 0, 1)`;
        element.style.transform = 'translate(0px, 0px)';
      });

      frameIds.push(frameId);
    });

    previousRectsRef.current = nextRects;

    return () => {
      frameIds.forEach((frameId) => {
        window.cancelAnimationFrame(frameId);
      });
    };
  }, [
    animationMs,
    draggingId,
    gridResizeState,
    normalizedRenderedLayout,
    resizeState,
  ]);

  useEffect(() => {
    if (!resizeState) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const containerElement = ref;

      if (!containerElement) {
        return;
      }

      if (!ref?.current) {
        return;
      }

      const newWidth = getResizedColumnSpan({
        containerWidth: ref?.current?.getBoundingClientRect().width,
        columns: numColumns,
        parentCoords: resizeState.parentCoords,
        clientX: event.clientX,
      });
      const activeItem = resizeState.layoutAtResizeStart.find(
        (item) => item.id === resizeState.itemId
      );

      if (!activeItem) {
        return;
      }

      // Rebuild from the snapshot captured at resize start so the item keeps a
      // stable base position while its width changes.
      const clampedWidth = normalizeItemWidth({
        width: newWidth,
        minWidth: activeItem.minWidth,
        maxWidth: activeItem.maxWidth,
        columns: numColumns,
      });
      const nextLayout = resizeItemInLayout({
        layout: resizeState.layoutAtResizeStart,
        itemId: resizeState.itemId,
        width: clampedWidth,
        columns: numColumns,
      });

      if (haveSameGridLayout(resizeState.layoutAtResizeStart, nextLayout)) {
        return;
      }

      onLayoutChanged(nextLayout);
    };

    const finishResize = () => {
      console.log('finishResize');
      const finalLayout = normalizeLayoutPositions(layout, numColumns);

      // History should only record the finished resize gesture, not the live
      // mousemove updates that happen while dragging the handle.
      if (!haveSameGridLayout(resizeState.layoutAtResizeStart, finalLayout)) {
        onLayoutCommitted?.(
          finalLayout,
          resizeState.layoutAtResizeStart,
          'itemResize'
        );
      }

      isResizingRef.current = false;
      setResizeState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', finishResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', finishResize);
    };
  }, [
    gap,
    layout,
    onLayoutChanged,
    onLayoutCommitted,
    resizeState,
    numColumns,
    ref,
  ]);

  useEffect(() => {
    if (!gridResizeState) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rowStride = rowHeight + gap;
      // Resize the overall grid in whole-row increments so extra empty space is
      // predictable and matches the visible row tracks.
      const nextRowCount = Math.max(
        minRowCount,
        requiredRowCount,
        gridResizeState.startRowCount +
          Math.round((event.clientY - gridResizeState.startClientY) / rowStride)
      );

      setRowCount(nextRowCount);
    };

    const finishResize = () => {
      setGridResizeState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', finishResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', finishResize);
    };
  }, [gap, gridResizeState, minRowCount, requiredRowCount, rowHeight]);

  const setItemRef = useCallback(
    (itemId: string) => (node: HTMLDivElement | null) => {
      if (node) {
        itemRefs.current.set(itemId, node);
        return;
      }

      itemRefs.current.delete(itemId);
    },
    []
  );

  const handleDragStart =
    (itemId: string) => (event: ReactDragEvent<HTMLDivElement>) => {
      if (resizeState || gridResizeState || isResizingRef.current) {
        event.preventDefault();
        return;
      }

      const itemRect = event.currentTarget.getBoundingClientRect();

      // Remember where inside the card the user grabbed it so slot placement
      // feels anchored to that grab point instead of the card's top-left corner.
      dragPointerOffsetRef.current = {
        x: event.clientX - itemRect.left,
        y: event.clientY - itemRect.top,
      };
      setDraggingId(itemId);

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', itemId);
    };

  const finishDrag = () => {
    dragPointerOffsetRef.current = null;
    setDraggingId(null);
  };

  const handleDragEnd = () => {
    finishDrag();
  };

  const getLayoutForPointer = useCallback(
    (
      clientX: number,
      clientY: number,
      sourceLayout: DraggableGridItem[]
    ): DraggableGridItem[] | null => {
      const activeDraggingId = draggingId;
      const containerElement = ref.current;

      if (!activeDraggingId || !containerElement) {
        return null;
      }

      const draggingItem = sourceLayout.find(
        (item) => item.id === activeDraggingId
      );

      if (!draggingItem) {
        return null;
      }

      const slot = getGridSlotFromPointer({
        // Convert the pointer back to the dragged card's top-left corner before
        // resolving the target grid slot.
        clientX: clientX - (dragPointerOffsetRef.current?.x ?? 0) + 1,
        clientY: clientY - (dragPointerOffsetRef.current?.y ?? 0) + 1,
        containerRect: containerElement.getBoundingClientRect(),
        columns: numColumns,
        rowCount: resolvedRowCount,
        rowHeight,
        gap,
        padding: containerPadding,
        itemWidth: draggingItem.width,
      });
      return moveItemToGridSlot({
        layout: sourceLayout,
        itemId: activeDraggingId,
        row: slot.row,
        column: slot.column,
        columns: numColumns,
      });
    },
    [draggingId, gap, numColumns, ref, resolvedRowCount, rowHeight]
  );

  const handleContainerDragOver = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if (resizeState || gridResizeState || isResizingRef.current) {
      return;
    }

    // Drag-over now only keeps the browser drop target active. We no longer
    // maintain a separate local preview layout while the pointer is moving.
  };

  const handleContainerDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const hoverResult = getLayoutForPointer(
      event.clientX,
      event.clientY,
      layout
    );
    const committedLayout = normalizeLayoutPositions(
      hoverResult ?? layout,
      numColumns
    );

    // Persist the final layout only when the drag actually drops.
    if (!haveSameGridLayout(layout, committedLayout)) {
      onLayoutChanged(committedLayout);
      onLayoutCommitted?.(committedLayout, layout, 'drop');
    }

    finishDrag();
  };

  const handleItemDragOver = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleResizeMouseDown =
    (item: DraggableGridItem) => (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      isResizingRef.current = true;
      setDraggingId(null);
      const parentCoords =
        event.currentTarget.parentElement?.getBoundingClientRect();

      if (!parentCoords) return;

      // Store every piece of information the resize gesture needs in one place
      // so mousemove can derive width without coordinating a separate ref.
      setResizeState({
        itemId: item.id,
        layoutAtResizeStart: normalizedRenderedLayout,
        parentCoords,
      });
    };

  const handleGridResizeMouseDown = (
    event: ReactMouseEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setGridResizeState({
      startClientY: event.clientY,
      startRowCount: resolvedRowCount,
    });
  };

  return (
    <Box
      ref={ref}
      className={className}
      onDragOver={handleContainerDragOver}
      onDrop={handleContainerDrop}
      sx={{
        position: 'relative',
        height: '100%',
        width: '100%',
        minHeight:
          gridContentHeight + containerPadding * 2 + gridResizeHandleHeight + 8,
        display: 'grid',
        gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${resolvedRowCount}, ${rowHeight}px)`,
        gap: `${gap}px`,
        alignItems: 'stretch',
        justifyItems: 'stretch',
        alignContent: 'start',
        justifyContent: 'start',
        overflow: 'auto',
        padding: containerPadding,
        paddingBottom: `${containerPadding + gridResizeHandleHeight + 8}px`,
      }}
    >
      {showGridlines ? (
        <DebugGridOverlay
          numColumns={numColumns}
          activeBreakpoint={activeBreakpoint}
          rowCount={resolvedRowCount}
          rowHeight={rowHeight}
          gap={gap}
          containerPadding={containerPadding}
        />
      ) : null}

      {normalizedRenderedLayout.map((item, index) => {
        const isDragging = item.id === draggingId;
        const clampedWidth = normalizeItemWidth({
          width: item.width,
          minWidth: item.minWidth,
          maxWidth: item.maxWidth,
          columns: numColumns,
        });

        return (
          <DraggableGridCell
            key={item.id}
            itemId={item.id}
            rowStart={item.row ?? 1}
            columnStart={item.column ?? 1}
            setItemRef={setItemRef(item.id)}
            isResizeDisabled={resizeState !== null}
            clampedWidth={clampedWidth}
            isDragging={isDragging}
            itemClassName={itemClassName}
            animationMs={animationMs}
            resizeHandleWidth={resizeHandleWidth}
            onDragStart={handleDragStart(item.id)}
            onDragEnd={handleDragEnd}
            onDragOver={handleItemDragOver}
            onResizeMouseDown={handleResizeMouseDown(item)}
          >
            {renderItem(item, index, isDragging)}
          </DraggableGridCell>
        );
      })}

      <Box
        onMouseDown={handleGridResizeMouseDown}
        sx={{
          position: 'absolute',
          top: `${gridContentHeight + containerPadding + 8}px`,
          left: '50%',
          width: 72,
          height: gridResizeHandleHeight,
          transform: 'translateX(-50%)',
          borderRadius: 999,
          cursor: 'ns-resize',
          zIndex: 3,
          bgcolor: 'rgba(15, 23, 42, 0.08)',
          border: '1px solid rgba(15, 23, 42, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
        }}
      >
        {/* Bottom handle for changing the total number of available rows. */}
        {Array.from({ length: 3 }, (_, index) => (
          <Box
            key={`grid-row-handle-${index}`}
            sx={{
              width: 14,
              height: '2px',
              borderRadius: 999,
              bgcolor: 'rgba(15, 23, 42, 0.45)',
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

function haveSameGridLayout<T extends DraggableGridItem>(
  first: T[],
  second: T[]
): boolean {
  return (
    first.length === second.length &&
    first.every((item, index) => {
      const candidate = second[index];

      return (
        item.id === candidate?.id &&
        item.width === candidate.width &&
        item.row === candidate.row &&
        item.column === candidate.column
      );
    })
  );
}
