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
import {
  getActiveBreakpoint,
  expandRect,
  getResizedColumnSpan,
  isPointWithinRect,
  normalizeItemWidth,
  normalizeLayoutWidths,
  reorderItems,
  resolveColumns,
  shouldReorderOnOverlap,
} from './gridMath';
import { DebugGridOverlay } from './DebugGridOverlay';
import type {
  DraggableGridItem,
  DraggableGridProps,
  ReorderLock,
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
    renderItem,
    columns = 3,
    showGridlines = false,
    gap = 12,
    className,
    itemClassName,
    animationMs = 320,
    resizeHandleWidth = 12,
  } = props;
  const containerPadding = 6;

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
  const [debugGridMetrics, setDebugGridMetrics] = useState<{
    rowBoundaries: number[];
    rowCount: number;
    gridHeight: number;
  }>({
    rowBoundaries: [],
    rowCount: 0,
    gridHeight: 0,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const previousRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const reorderLockRef = useRef<ReorderLock>(null);
  const isResizingRef = useRef<boolean>(false);

  const isResizing = resizeState !== null;
  const renderedLayout =
    (draggingId !== null || isResizing) && draftLayout !== null
      ? draftLayout
      : layout;
  const normalizedRenderedLayout = normalizeLayoutWidths(
    renderedLayout,
    resolvedColumns
  );

  useEffect(() => {
    const normalizedLayout = normalizeLayoutWidths(layout, resolvedColumns);
    const hasInvalidWidth = normalizedLayout.some(
      (item, index) => item.width !== layout[index]?.width
    );

    if (hasInvalidWidth) {
      onLayoutChanged(normalizedLayout);
    }
  }, [layout, onLayoutChanged, resolvedColumns]);

  useLayoutEffect(() => {
    if (!showGridlines) {
      return;
    }

    const containerElement = containerRef.current;

    if (!containerElement) {
      return;
    }

    const measureGrid = () => {
      const rowBottomByTop = new Map<number, number>();

      normalizedRenderedLayout.forEach((item) => {
        const element = itemRefs.current.get(item.id);

        if (!element) {
          return;
        }

        const rowTop = element.offsetTop - containerPadding;
        const rowBottom = rowTop + element.offsetHeight;
        const previousBottom = rowBottomByTop.get(rowTop) ?? 0;

        rowBottomByTop.set(rowTop, Math.max(previousBottom, rowBottom));
      });

      const sortedRowTops = Array.from(rowBottomByTop.keys()).sort(
        (first, second) => first - second
      );
      const rowBoundaries = sortedRowTops.map((rowTop) => rowBottomByTop.get(rowTop)!);
      const gridHeight = rowBoundaries.at(-1) ?? 0;

      setDebugGridMetrics((previousMetrics) => {
        const nextMetrics = {
          rowBoundaries,
          rowCount: sortedRowTops.length,
          gridHeight,
        };

        if (areDebugGridMetricsEqual(previousMetrics, nextMetrics)) {
          return previousMetrics;
        }

        return nextMetrics;
      });
    };

    measureGrid();

    const resizeObserver = new ResizeObserver(() => {
      measureGrid();
    });

    resizeObserver.observe(containerElement);

    itemRefs.current.forEach((element) => {
      resizeObserver.observe(element);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [
    containerPadding,
    normalizedRenderedLayout,
    resolvedColumns,
    showGridlines,
  ]);

  useLayoutEffect(() => {
    // Capture item positions after each layout change so non-dragged items can
    // animate smoothly from their previous slot into the new one.
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

    if (isResizing) {
      // Resizing updates width continuously, so we skip FLIP transforms and let
      // the grid settle immediately to avoid fighting the resize interaction.
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

      // On the next frame, remove the offset so CSS animates the item into its
      // newly computed grid position.
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
  }, [animationMs, draggingId, isResizing, normalizedRenderedLayout]);

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

      // Rebuild the layout from the snapshot taken at resize start so width
      // changes stay stable even as the parent re-renders during dragging.
      const nextLayout = resizeState.layoutAtResizeStart.map((item) => {
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
      });

      setDraftLayout(nextLayout);
      onLayoutChanged(nextLayout);
    };

    const finishResize = () => {
      isResizingRef.current = false;
      setResizeState(null);
      reorderLockRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', finishResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', finishResize);
    };
  }, [gap, onLayoutChanged, resizeState, resolvedColumns]);

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
      if (resizeState || isResizingRef.current) {
        event.preventDefault();
        return;
      }

      setDraggingId(itemId);
      setDraftLayout(normalizeLayoutWidths(layout, resolvedColumns));
      reorderLockRef.current = null;

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', itemId);
    };

  const finishDrag = () => {
    setDraggingId(null);
    setDraftLayout(null);
    reorderLockRef.current = null;
  };

  const handleDragEnd = () => {
    finishDrag();
  };

  const handleContainerDragOver = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';

      const lock = reorderLockRef.current;

      if (!lock) {
        return;
      }

      // The lock creates a small dead zone around the last reorder target so a
      // single overlap doesn't repeatedly reshuffle items while hovering.
      if (
        isPointWithinRect({
          clientX: event.clientX,
          clientY: event.clientY,
          rect: lock,
        })
      ) {
        return;
      }

      reorderLockRef.current = null;
    },
    []
  );

  const handleContainerDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    finishDrag();
  };

  const handleItemDragOver =
    (targetItemId: string) => (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (resizeState || isResizingRef.current) {
        return;
      }

      const activeDraggingId = draggingId;
      const currentDraftLayout =
        draggingId !== null && draftLayout !== null ? draftLayout : layout;

      if (!activeDraggingId || activeDraggingId === targetItemId) {
        return;
      }

      const currentLock = reorderLockRef.current;

      if (
        currentLock &&
        isPointWithinRect({
          clientX: event.clientX,
          clientY: event.clientY,
          rect: currentLock,
        })
      ) {
        return;
      }

      const fromIndex = currentDraftLayout.findIndex(
        (item) => item.id === activeDraggingId
      );
      const toIndex = currentDraftLayout.findIndex(
        (item) => item.id === targetItemId
      );

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return;
      }

      const draggingElement = itemRefs.current.get(activeDraggingId);
      const targetRect = event.currentTarget.getBoundingClientRect();
      const draggingRect = draggingElement?.getBoundingClientRect();

      const shouldMove = shouldReorderOnOverlap({
        draggingRect,
        targetRect,
        clientX: event.clientX,
        clientY: event.clientY,
        overlapPx: 20,
      });

      if (!shouldMove) {
        return;
      }

      const nextLayout = reorderItems(currentDraftLayout, fromIndex, toIndex);

      // After swapping, require the pointer to leave this expanded target area
      // before another reorder can happen.
      reorderLockRef.current = expandRect({
        rect: targetRect,
        paddingPx: 8,
      });

      setDraftLayout(nextLayout);
      onLayoutChanged(nextLayout);
    };

  const handleResizeMouseDown =
    (item: T) => (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      isResizingRef.current = true;
      setDraggingId(null);
      reorderLockRef.current = null;
      setDraftLayout(normalizedRenderedLayout);
      // Store the current rendered layout as the resize baseline so mouse
      // movement is measured against the exact visual state the user grabbed.
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
        display: 'grid',
        gridTemplateColumns: `repeat(${resolvedColumns}, minmax(0, 1fr))`,
        gridAutoFlow: 'row dense',
        gap: `${gap}px`,
        alignItems: 'start',
        justifyItems: 'stretch',
        alignContent: 'start',
        justifyContent: 'start',
        overflowX: 'hidden',
        padding: containerPadding,
      }}
    >
      {showGridlines ? (
        <DebugGridOverlay
          columns={columns}
          resolvedColumns={resolvedColumns}
          activeBreakpoint={activeBreakpoint}
          rowCount={debugGridMetrics.rowCount}
          rowBoundaries={debugGridMetrics.rowBoundaries}
          gridHeight={debugGridMetrics.gridHeight}
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
            setItemRef={setItemRef(item.id)}
            isResizeDisabled={resizeState !== null}
            clampedWidth={clampedWidth}
            isDragging={isDragging}
            itemClassName={itemClassName}
            animationMs={animationMs}
            resizeHandleWidth={resizeHandleWidth}
            onDragStart={handleDragStart(item.id)}
            onDragEnd={handleDragEnd}
            onDragOver={handleItemDragOver(item.id)}
            onResizeMouseDown={handleResizeMouseDown(item)}
          >
            {renderItem(item, index, isDragging)}
          </DraggableGridCell>
        );
      })}
    </Box>
  );
}

function areDebugGridMetricsEqual(
  first: {
    rowBoundaries: number[];
    rowCount: number;
    gridHeight: number;
  },
  second: {
    rowBoundaries: number[];
    rowCount: number;
    gridHeight: number;
  }
): boolean {
  if (
    first.rowCount !== second.rowCount ||
    first.gridHeight !== second.gridHeight ||
    first.rowBoundaries.length !== second.rowBoundaries.length
  ) {
    return false;
  }

  return first.rowBoundaries.every(
    (boundary, index) => boundary === second.rowBoundaries[index]
  );
}
