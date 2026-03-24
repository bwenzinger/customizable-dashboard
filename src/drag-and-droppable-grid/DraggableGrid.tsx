import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { DraggableGridCell } from './DraggableGridCell';
import { DebugGridOverlay } from './DebugGridOverlay';
import {
  getActiveBreakpoint,
  getGridSlotFromPointer,
  getRequiredRowCount,
  getResizedColumnSpan,
  moveItemToGridSlot,
  normalizeItemWidth,
  normalizeLayoutPositions,
  resolveColumns,
} from './gridMath';
import type {
  DraggableGridItem,
  DraggableGridProps,
  GridResizeState,
  ResizeState,
} from './types';

export type {
  DraggableGridBreakpoint,
  DraggableGridItem,
  DraggableGridProps,
  DraggableGridResponsiveColumns,
} from './types';

export function DraggableGrid<T extends DraggableGridItem>(
  props: DraggableGridProps<T>
): React.JSX.Element {
  const {
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

  const theme = useTheme();
  const matchesXs = useMediaQuery(theme.breakpoints.up('xs'));
  const matchesSm = useMediaQuery(theme.breakpoints.up('sm'));
  const matchesMd = useMediaQuery(theme.breakpoints.up('md'));
  const matchesLg = useMediaQuery(theme.breakpoints.up('lg'));
  const matchesXl = useMediaQuery(theme.breakpoints.up('xl'));
  const breakpointMatches = {
    xs: matchesXs,
    sm: matchesSm,
    md: matchesMd,
    lg: matchesLg,
    xl: matchesXl,
  };

  const resolvedColumns = resolveColumns({
    columns,
    matches: breakpointMatches,
  });
  const activeBreakpoint = getActiveBreakpoint(breakpointMatches);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draftLayout, setDraftLayout] = useState<T[] | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState<T>>(null);
  const [gridResizeState, setGridResizeState] = useState<GridResizeState>(null);
  const [rowCount, setRowCount] = useState<number>(
    Math.max(initialRowCount, minRowCount)
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const previousRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const isResizingRef = useRef<boolean>(false);
  const dragPointerOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const hoverPreviewTimeoutRef = useRef<number | null>(null);
  const hoverPreviewKeyRef = useRef<string | null>(null);

  const renderedLayout =
    (draggingId !== null || resizeState !== null) && draftLayout !== null
      ? draftLayout
      : layout;
  // Keep a normalized, collision-free version of the layout for both preview
  // rendering and committed state updates.
  const normalizedRenderedLayout = normalizeLayoutPositions(
    renderedLayout,
    resolvedColumns
  );
  const requiredRowCount = getRequiredRowCount(normalizedRenderedLayout);
  // The grid can be manually expanded, but it should never shrink below the
  // rows required to display the current item placements.
  const resolvedRowCount = Math.max(rowCount, minRowCount, requiredRowCount);
  const gridContentHeight =
    resolvedRowCount * rowHeight + Math.max(0, resolvedRowCount - 1) * gap;

  useEffect(() => {
    // Normalize any externally supplied layout so widths and slot positions stay
    // valid even if the parent passes partial or out-of-date coordinates.
    const normalizedLayout = normalizeLayoutPositions(layout, resolvedColumns);

    if (!haveSameGridLayout(layout, normalizedLayout)) {
      onLayoutChanged(normalizedLayout);
    }
  }, [layout, onLayoutChanged, resolvedColumns]);

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
      const containerElement = containerRef.current;

      if (!containerElement) {
        return;
      }

      const nextWidth = getResizedColumnSpan({
        containerWidth: containerElement.getBoundingClientRect().width,
        columns: resolvedColumns,
        gap,
        startWidth: resizeState.startWidth,
        deltaX: event.clientX - resizeState.startClientX,
      });
      // Rebuild from the snapshot captured at resize start so the item keeps a
      // stable base position while its width changes.
      const nextLayout = normalizeLayoutPositions(
        resizeState.layoutAtResizeStart.map((item) => {
          if (item.id !== resizeState.itemId) {
            return item;
          }

          const clampedWidth = normalizeItemWidth({
            width: nextWidth,
            minWidth: item.minWidth,
            maxWidth: item.maxWidth,
            columns: resolvedColumns,
          });

          if (clampedWidth === item.width) {
            return item;
          }

          return {
            ...item,
            width: clampedWidth,
          };
        }),
        resolvedColumns
      );

      if (haveSameGridLayout(resizeState.layoutAtResizeStart, nextLayout)) {
        return;
      }

      setDraftLayout(nextLayout);
      onLayoutChanged(nextLayout);
    };

    const finishResize = () => {
      const finalLayout = normalizeLayoutPositions(
        draftLayout ?? layout,
        resolvedColumns
      );

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
    draftLayout,
    gap,
    layout,
    onLayoutChanged,
    onLayoutCommitted,
    resizeState,
    resolvedColumns,
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
      setDraftLayout(normalizeLayoutPositions(layout, resolvedColumns));

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', itemId);
    };

  const clearHoverPreview = useCallback(() => {
    if (hoverPreviewTimeoutRef.current !== null) {
      window.clearTimeout(hoverPreviewTimeoutRef.current);
      hoverPreviewTimeoutRef.current = null;
    }

    hoverPreviewKeyRef.current = null;
  }, []);

  const finishDrag = () => {
    clearHoverPreview();
    dragPointerOffsetRef.current = null;
    setDraggingId(null);
    setDraftLayout(null);
  };

  const handleDragEnd = () => {
    finishDrag();
  };

  const getLayoutForPointer = useCallback(
    (
      clientX: number,
      clientY: number,
      sourceLayout: T[]
    ): { nextLayout: T[]; hoverKey: string } | null => {
      const activeDraggingId = draggingId;
      const containerElement = containerRef.current;

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
        columns: resolvedColumns,
        rowCount: resolvedRowCount,
        rowHeight,
        gap,
        padding: containerPadding,
        itemWidth: draggingItem.width,
      });
      const nextLayout = moveItemToGridSlot({
        layout: sourceLayout,
        itemId: activeDraggingId,
        row: slot.row,
        column: slot.column,
        columns: resolvedColumns,
      });

      return {
        nextLayout,
        hoverKey: `${activeDraggingId}:${slot.row}:${slot.column}:${draggingItem.width}`,
      };
    },
    [
      containerPadding,
      draggingId,
      gap,
      resolvedColumns,
      resolvedRowCount,
      rowHeight,
    ]
  );

  const handleContainerDragOver = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if (resizeState || gridResizeState || isResizingRef.current) {
      return;
    }

    const activeDraggingId = draggingId;
    const currentDraftLayout =
      draggingId !== null && draftLayout !== null ? draftLayout : layout;
    const hoverResult = getLayoutForPointer(
      event.clientX,
      event.clientY,
      currentDraftLayout
    );

    if (!activeDraggingId || !hoverResult) {
      return;
    }
    const { nextLayout, hoverKey } = hoverResult;

    if (haveSameGridLayout(currentDraftLayout, nextLayout)) {
      clearHoverPreview();
      return;
    }

    if (hoverPreviewKeyRef.current === hoverKey) {
      return;
    }

    // Only preview a move after hovering over the same target for a short time.
    // This keeps "passing over" another card from immediately reshuffling it.
    clearHoverPreview();
    hoverPreviewKeyRef.current = hoverKey;
    hoverPreviewTimeoutRef.current = window.setTimeout(() => {
      setDraftLayout((currentValue) => {
        const sourceLayout = currentValue ?? layout;
        const latestHoverResult = getLayoutForPointer(
          event.clientX,
          event.clientY,
          sourceLayout
        );

        if (!latestHoverResult) {
          return currentValue;
        }

        return haveSameGridLayout(sourceLayout, latestHoverResult.nextLayout)
          ? currentValue
          : latestHoverResult.nextLayout;
      });
      hoverPreviewTimeoutRef.current = null;
    }, 0);
  };

  const handleContainerDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    clearHoverPreview();

    const sourceLayout =
      draggingId !== null && draftLayout !== null ? draftLayout : layout;
    const hoverResult = getLayoutForPointer(
      event.clientX,
      event.clientY,
      sourceLayout
    );
    const committedLayout = normalizeLayoutPositions(
      hoverResult?.nextLayout ?? sourceLayout,
      resolvedColumns
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
    (item: T) => (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      isResizingRef.current = true;
      setDraggingId(null);
      setDraftLayout(normalizedRenderedLayout);
      setResizeState({
        itemId: item.id,
        startClientX: event.clientX,
        startWidth: normalizeItemWidth({
          width: item.width,
          minWidth: item.minWidth,
          maxWidth: item.maxWidth,
          columns: resolvedColumns,
        }),
        layoutAtResizeStart: normalizedRenderedLayout,
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
      ref={containerRef}
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
        gridTemplateColumns: `repeat(${resolvedColumns}, minmax(0, 1fr))`,
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
          columns={columns}
          resolvedColumns={resolvedColumns}
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
          columns: resolvedColumns,
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
