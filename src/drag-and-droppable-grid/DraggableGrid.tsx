import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { Box, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { DraggableGridCell } from './DraggableGridCell';
import { DebugGridOverlay } from './DebugGridOverlay';
import {
  clampItemHeight,
  clampItemWidth,
  getGridSlotFromPointer,
  getItemHeight,
  getRequiredRowCount,
  getResizedColumnSpan,
  getResizedRowSpan,
  moveItemToGridSlot,
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
    rowHeight = 75,
    showGridlines = false,
    gap = 12,
    className,
    itemClassName,
    animationMs = 320,
    resizeHandleWidth = 12,
    enableUndo = false,
  } = props;
  const containerPadding = 6;
  const gridResizeHandleHeight = 18;
  const resizeStepThreshold = 0.5;
  const pointerDirectionEpsilonPx = 0.9;
  const dragPreviewDelayMs = 120;

  const { activeBreakpoint, numColumns } = useDraggableGridInfo({
    columns,
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const handlingResizingRef = useRef<{
    id: string;
    width: number;
    height: number;
  } | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState>(null);
  const [gridResizeState, setGridResizeState] = useState<GridResizeState>(null);
  const [dragPreviewLayout, setDragPreviewLayout] = useState<
    DraggableGridItem[] | null
  >(null);
  const [rowCount, setRowCount] = useState<number>(
    Math.max(initialRowCount, minRowCount)
  );
  const [canUndo, setCanUndo] = useState(false);

  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const previousRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const isResizingRef = useRef<boolean>(false);
  const wasResizingRef = useRef<boolean>(false);
  const dragPointerOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartLayoutRef = useRef<DraggableGridItem[] | null>(null);
  const dragPreviewIndicatorRef = useRef<HTMLDivElement | null>(null);
  const dragPreviewIndicatorKeyRef = useRef<string | null>(null);
  const dragPreviewTimeoutRef = useRef<number | null>(null);
  const pendingDragPreviewTargetKeyRef = useRef<string | null>(null);
  const activeDragPreviewTargetKeyRef = useRef<string | null>(null);
  const resizePointerStateRef = useRef<{
    clientX: number;
    clientY: number;
    widthDirection: 'increase' | 'decrease' | null;
    heightDirection: 'increase' | 'decrease' | null;
  } | null>(null);
  const layoutHistoryRef = useRef<DraggableGridItem[][]>([]);
  const previousLayoutRef = useRef<DraggableGridItem[]>(layout);
  const createdImageUrlsRef = useRef<Set<string>>(new Set());

  // Keep committed layout separate from the local drag preview so we can show
  // a draft landing state without mutating parent state until drop.
  const normalizedCommittedLayout = useMemo(
    () => normalizeLayoutPositions(layout, numColumns),
    [layout, numColumns]
  );
  const previewLayout = useMemo(
    () => dragPreviewLayout ?? normalizedCommittedLayout,
    [dragPreviewLayout, normalizedCommittedLayout]
  );
  const draggedCommittedItem = useMemo(() => {
    if (!draggingId) {
      return null;
    }

    return normalizedCommittedLayout.find((item) => item.id === draggingId) ?? null;
  }, [draggingId, normalizedCommittedLayout]);
  const renderedLayout = useMemo(() => {
    if (!draggingId || !draggedCommittedItem) {
      return previewLayout;
    }

    const previewItemsById = new Map(
      previewLayout.map((item) => [item.id, item] as const)
    );
    const shouldKeepDraggedPlaceholder = !previewLayout.some(
      (item) =>
        item.id !== draggedCommittedItem.id &&
        doGridItemsOverlap(item, draggedCommittedItem)
    );

    // Treat the actively dragged item as a special placeholder. Keep it visible
    // at its origin until the preview actually needs that space for another card.
    return normalizedCommittedLayout.flatMap((item) => {
      if (item.id === draggingId) {
        return shouldKeepDraggedPlaceholder ? [draggedCommittedItem] : [];
      }

      return [previewItemsById.get(item.id) ?? item];
    });
  }, [
    draggedCommittedItem,
    draggingId,
    normalizedCommittedLayout,
    previewLayout,
  ]);
  const renderedItems = useMemo(
    () =>
      renderedLayout.map((item, index) => ({
        item,
        index,
        clampedWidth: clampItemWidth({
          width: item.width,
          minWidth: item.minWidth,
          maxWidth: item.maxWidth,
          columns: numColumns,
        }),
        clampedHeight: clampItemHeight({
          height: getItemHeight(item),
          minHeight: item.minHeight ?? 1,
          maxHeight: item.maxHeight ?? getItemHeight(item),
        }),
      })),
    [numColumns, renderedLayout]
  );
  const requiredRowCount = useMemo(
    () => getRequiredRowCount(previewLayout),
    [previewLayout]
  );
  // The grid can be manually expanded, but it should never shrink below the
  // rows required to display the current item placements.
  const resolvedRowCount = Math.max(rowCount, minRowCount, requiredRowCount);
  const gridContentHeight =
    resolvedRowCount * rowHeight + Math.max(0, resolvedRowCount - 1) * gap;

  const requestLayoutChange = useCallback(
    (nextLayout: DraggableGridItem[]) => {
      onLayoutChanged(nextLayout);
    },
    [onLayoutChanged]
  );

  const clearPendingDragPreview = useCallback(() => {
    if (dragPreviewTimeoutRef.current !== null) {
      window.clearTimeout(dragPreviewTimeoutRef.current);
      dragPreviewTimeoutRef.current = null;
    }

    pendingDragPreviewTargetKeyRef.current = null;
  }, []);

  function updateDragPreviewIndicator(
    nextSlot: { row: number; column: number } | null,
    draggedItem: Pick<DraggableGridItem, 'width' | 'height'> | null
  ) {
    const indicatorElement = dragPreviewIndicatorRef.current;

    if (!indicatorElement) {
      return;
    }

    if (!nextSlot || !draggedItem) {
      indicatorElement.style.display = 'none';
      dragPreviewIndicatorKeyRef.current = null;
      return;
    }

    const nextKey = `${nextSlot.row}:${nextSlot.column}:${draggedItem.width}:${getItemHeight(draggedItem)}`;

    if (dragPreviewIndicatorKeyRef.current === nextKey) {
      return;
    }

    dragPreviewIndicatorKeyRef.current = nextKey;
    indicatorElement.style.display = 'block';
    indicatorElement.style.gridColumn = `${nextSlot.column} / span ${draggedItem.width}`;
    indicatorElement.style.gridRow = `${nextSlot.row} / span ${getItemHeight(draggedItem)}`;
  }

  const resetDragPreview = useCallback(() => {
    clearPendingDragPreview();
    activeDragPreviewTargetKeyRef.current = null;
    setDragPreviewLayout(null);
    updateDragPreviewIndicator(null, null);
  }, [clearPendingDragPreview]);

  const recordCommittedLayout = useCallback(
    (
      nextLayout: DraggableGridItem[],
      previousLayout: DraggableGridItem[],
      reason: 'drop' | 'itemResize'
    ) => {
      const normalizedNextLayout = normalizeLayoutPositions(
        nextLayout,
        numColumns
      );
      const normalizedPreviousLayout = normalizeLayoutPositions(
        previousLayout,
        numColumns
      );

      if (
        enableUndo &&
        !haveSameGridLayout(normalizedPreviousLayout, normalizedNextLayout)
      ) {
        layoutHistoryRef.current.push(normalizedPreviousLayout);
        setCanUndo(true);
      }

      onLayoutCommitted?.(
        normalizedNextLayout,
        normalizedPreviousLayout,
        reason
      );
    },
    [enableUndo, numColumns, onLayoutCommitted]
  );

  const handleUndo = useCallback(() => {
    const previousLayout = layoutHistoryRef.current.at(-1);

    if (!previousLayout) {
      return;
    }

    layoutHistoryRef.current.pop();
    setCanUndo(layoutHistoryRef.current.length > 0);
    requestLayoutChange(previousLayout);
  }, [requestLayoutChange]);

  useEffect(() => {
    // Normalize any externally supplied layout so widths and slot positions stay
    // valid even if the parent passes partial or out-of-date coordinates.
    const normalizedLayout = normalizeLayoutPositions(layout, numColumns);

    if (!haveSameGridLayout(layout, normalizedLayout)) {
      requestLayoutChange(normalizedLayout);
    }
  }, [layout, numColumns, requestLayoutChange]);

  useEffect(() => {
    const previousLayout = previousLayoutRef.current;

    cleanupRemovedImageObjectUrls({
      previousLayout,
      nextLayout: layout,
      createdImageUrls: createdImageUrlsRef.current,
    });

    previousLayoutRef.current = layout;
  }, [layout]);

  useEffect(() => {
    const createdImageUrls = createdImageUrlsRef.current;

    return () => {
      clearPendingDragPreview();
      createdImageUrls.forEach((imageUrl) => {
        URL.revokeObjectURL(imageUrl);
      });
      createdImageUrls.clear();
    };
  }, [clearPendingDragPreview]);

  useEffect(() => {
    if (!enableUndo) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      if (event.key.toLowerCase() !== 'z' || event.shiftKey) {
        return;
      }

      if (!canUndo) {
        return;
      }

      event.preventDefault();
      handleUndo();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canUndo, enableUndo, handleUndo]);

  useLayoutEffect(() => {
    // Measure item positions after every preview/commit so neighboring cards can
    // animate from their old slot into the new one.
    const frameIds: number[] = [];
    const resizeAnimationMs = Math.min(animationMs, 140);
    const measuredItems = renderedLayout.flatMap((item) => {
      if (item.id === draggingId) {
        return [];
      }

      const element = itemRefs.current.get(item.id);

      if (!element) {
        return [];
      }

      return [{ item, element }];
    });
    const elementsById = new Map(
      measuredItems.map(({ item, element }) => [item.id, element])
    );
    const wasResizing = wasResizingRef.current;
    wasResizingRef.current = resizeState !== null;

    if (wasResizing && resizeState === null) {
      const settledRects = new Map<string, DOMRect>();

      measuredItems.forEach(({ item, element }) => {
        element.style.transition = '';
        element.style.transform = '';
        element.style.transformOrigin = '';
        settledRects.set(item.id, element.getBoundingClientRect());
      });

      previousRectsRef.current = settledRects;
      return;
    }

    if (resizeState !== null) {
      // Measure from each card's current on-screen position so repeated resize
      // steps continue smoothly instead of restarting from stale rects.
      const currentVisualRects = new Map<string, DOMRect>();
      const targetRects = new Map<string, DOMRect>();

      measuredItems.forEach(({ item, element }) => {
        currentVisualRects.set(item.id, element.getBoundingClientRect());
      });

      measuredItems.forEach(({ item, element }) => {
        element.style.transition = 'none';
        element.style.transform = '';
        element.style.transformOrigin =
          item.id === resizeState.itemId ? 'top left' : '';
      });

      measuredItems.forEach(({ item, element }) => {
        targetRects.set(item.id, element.getBoundingClientRect());
      });

      measuredItems.forEach(({ item, element }) => {
        const previousRect = previousRectsRef.current.get(item.id);
        const currentVisualRect = currentVisualRects.get(item.id);
        const targetRect = targetRects.get(item.id);
        const isActiveItem = item.id === resizeState.itemId;

        if (!targetRect) {
          element.style.transition = '';
          element.style.transform = '';
          element.style.transformOrigin = isActiveItem ? 'top left' : '';
          return;
        }

        const shouldStartFromCurrentVisualRect =
          currentVisualRect !== undefined &&
          !areRectsApproximatelyEqual(currentVisualRect, targetRect);
        const startRect =
          shouldStartFromCurrentVisualRect || !previousRect
            ? currentVisualRect
            : previousRect;

        if (!startRect) {
          element.style.transition = '';
          element.style.transform = '';
          element.style.transformOrigin = isActiveItem ? 'top left' : '';
          return;
        }

        const deltaX = startRect.left - targetRect.left;
        const deltaY = startRect.top - targetRect.top;
        const scaleX = isActiveItem
          ? startRect.width / targetRect.width
          : 1;
        const scaleY = isActiveItem
          ? startRect.height / targetRect.height
          : 1;
        const hasSizeDelta = isActiveItem && (scaleX !== 1 || scaleY !== 1);

        if (deltaX === 0 && deltaY === 0 && !hasSizeDelta) {
          element.style.transition = '';
          element.style.transform = '';
          element.style.transformOrigin = isActiveItem ? 'top left' : '';
          return;
        }

        element.style.transformOrigin = isActiveItem ? 'top left' : '';
        element.style.transition = 'none';
        element.style.transform = isActiveItem
          ? `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`
          : `translate(${deltaX}px, ${deltaY}px)`;
      });

      if (measuredItems[0]) {
        void measuredItems[0].element.getBoundingClientRect();
      }

      const frameId = window.requestAnimationFrame(() => {
        measuredItems.forEach(({ item, element }) => {
          const isActiveItem = item.id === resizeState.itemId;

          element.style.transition = `transform ${resizeAnimationMs}ms cubic-bezier(0.2, 0, 0, 1)`;
          element.style.transform = isActiveItem
            ? 'translate(0px, 0px) scale(1, 1)'
            : 'translate(0px, 0px)';
        });
      });

      frameIds.push(frameId);
      previousRectsRef.current = targetRects;

      return () => {
        frameIds.forEach((frameId) => {
          window.cancelAnimationFrame(frameId);
        });
      };
    }

    if (gridResizeState !== null) {
      // During overall grid resizing we still want direct manipulation.
      const nextRects = new Map<string, DOMRect>();

      measuredItems.forEach(({ item, element }) => {
        element.style.transition = '';
        element.style.transform = '';
        element.style.transformOrigin = '';
        nextRects.set(item.id, element.getBoundingClientRect());
      });

      previousRectsRef.current = nextRects;
      return;
    }

    const nextRects = new Map<string, DOMRect>();

    measuredItems.forEach(({ item, element }) => {
      nextRects.set(item.id, element.getBoundingClientRect());
    });

    nextRects.forEach((nextRect, itemId) => {
      const previousRect = previousRectsRef.current.get(itemId);
      const element = elementsById.get(itemId);

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
      element.style.transformOrigin = '';

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
    renderedLayout,
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

      const activeItem = resizeState.layoutAtResizeStart.find(
        (item) => item.id === resizeState.itemId
      );
      const currentItem = normalizedCommittedLayout.find(
        (item) => item.id === resizeState.itemId
      );

      if (!activeItem || !currentItem) {
        return;
      }

      const nextResizePointerState = getNextResizePointerState({
        previousPointerState: resizePointerStateRef.current,
        clientX: event.clientX,
        clientY: event.clientY,
        pointerDirectionEpsilonPx,
      });

      resizePointerStateRef.current = nextResizePointerState;

      const newWidth = getResizedColumnSpan({
        containerWidth: ref.current.getBoundingClientRect().width,
        columns: numColumns,
        gap,
        padding: containerPadding,
        parentCoords: resizeState.parentCoords,
        clientX: event.clientX,
        currentWidth: currentItem.width,
        resizeDirection: nextResizePointerState.widthDirection,
        stepThreshold: resizeStepThreshold,
      });
      const newHeight = getResizedRowSpan({
        parentCoords: resizeState.parentCoords,
        clientY: event.clientY,
        rowHeight,
        gap,
        currentHeight: getItemHeight(currentItem),
        resizeDirection: nextResizePointerState.heightDirection,
        stepThreshold: resizeStepThreshold,
      });

      const clampedWidth = clampItemWidth({
        width: newWidth,
        minWidth: activeItem.minWidth,
        maxWidth: activeItem.maxWidth,
        columns: numColumns,
      });
      const clampedHeight = clampItemHeight({
        height: newHeight,
        minHeight: activeItem.minHeight ?? 1,
        maxHeight: activeItem.maxHeight ?? getItemHeight(activeItem),
      });

      if (
        (clampedWidth === currentItem.width &&
          clampedHeight === getItemHeight(currentItem)) ||
        (handlingResizingRef.current?.id === resizeState.itemId &&
          handlingResizingRef.current?.width === clampedWidth &&
          handlingResizingRef.current?.height === clampedHeight)
      ) {
        return;
      }

      handlingResizingRef.current = {
        id: resizeState.itemId,
        width: clampedWidth,
        height: clampedHeight,
      };

      // Rebuild from the snapshot captured at resize start so the item keeps a
      // stable base position while its width changes.
      const nextLayout = resizeItemInLayout({
        layout: resizeState.layoutAtResizeStart,
        itemId: resizeState.itemId,
        width: clampedWidth,
        height: clampedHeight,
        columns: numColumns,
      });

      if (haveSameGridLayout(normalizedCommittedLayout, nextLayout)) {
        return;
      }

      requestLayoutChange(nextLayout);
    };

    const finishResize = () => {
      const finalLayout = normalizeLayoutPositions(layout, numColumns);

      // History should only record the finished resize gesture, not the live
      // mousemove updates that happen while dragging the handle.
      if (!haveSameGridLayout(resizeState.layoutAtResizeStart, finalLayout)) {
        recordCommittedLayout(
          finalLayout,
          resizeState.layoutAtResizeStart,
          'itemResize'
        );
      }

      handlingResizingRef.current = null;
      isResizingRef.current = false;
      resizePointerStateRef.current = null;
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
    normalizedCommittedLayout,
    recordCommittedLayout,
    requestLayoutChange,
    resizeState,
    numColumns,
    rowHeight,
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
    (itemId: string, node: HTMLDivElement | null) => {
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
      dragStartLayoutRef.current = normalizedCommittedLayout;
      resetDragPreview();
      setDraggingId(itemId);

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', itemId);
    };

  const finishDrag = () => {
    dragPointerOffsetRef.current = null;
    dragStartLayoutRef.current = null;
    resetDragPreview();
    setDraggingId(null);
  };

  const handleDragEnd = () => {
    finishDrag();
  };

  const getDragPlacementForPointer = useCallback(
    (
      clientX: number,
      clientY: number,
      sourceLayout: DraggableGridItem[]
    ): {
      layout: DraggableGridItem[];
      slot: { row: number; column: number };
    } | null => {
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
        itemHeight: getItemHeight(draggingItem),
      });

      return {
        slot,
        layout: moveItemToGridSlot({
          layout: sourceLayout,
          itemId: activeDraggingId,
          row: slot.row,
          column: slot.column,
          columns: numColumns,
        }),
      };
    },
    [draggingId, gap, numColumns, ref, resolvedRowCount, rowHeight]
  );

  const getDropSlotForPointer = useCallback(
    (clientX: number, clientY: number) => {
      const containerElement = ref.current;

      if (!containerElement) {
        return null;
      }

      return getGridSlotFromPointer({
        clientX,
        clientY,
        containerRect: containerElement.getBoundingClientRect(),
        columns: numColumns,
        rowCount: resolvedRowCount,
        rowHeight,
        gap,
        padding: containerPadding,
        itemWidth: 1,
        itemHeight: 1,
      });
    },
    [gap, numColumns, ref, resolvedRowCount, rowHeight]
  );

  const handleContainerDragOver = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = hasImageFiles(event.dataTransfer)
      ? 'copy'
      : 'move';

    if (resizeState || gridResizeState || isResizingRef.current) {
      updateDragPreviewIndicator(null, null);
      return;
    }

    if (hasImageFiles(event.dataTransfer)) {
      updateDragPreviewIndicator(null, null);
      return;
    }

    const dragSourceLayout =
      dragStartLayoutRef.current ?? normalizedCommittedLayout;
    const previewResult = getDragPlacementForPointer(
      event.clientX,
      event.clientY,
      dragSourceLayout
    );
    updateDragPreviewIndicator(previewResult?.slot ?? null, draggedCommittedItem);

    if (
      !previewResult ||
      haveSameGridLayout(dragSourceLayout, previewResult.layout)
    ) {
      resetDragPreview();
      return;
    }

    const previewTargetKey = `${previewResult.slot.row}:${previewResult.slot.column}`;

    if (
      activeDragPreviewTargetKeyRef.current === previewTargetKey ||
      pendingDragPreviewTargetKeyRef.current === previewTargetKey
    ) {
      return;
    }

    // Always derive previews from the drag-start snapshot so crossing over
    // cards never leaves behind incremental layout drift. Keep the current
    // preview visible until the next one is ready so cards don't animate
    // back to the committed layout between nearby drag targets.
    clearPendingDragPreview();
    pendingDragPreviewTargetKeyRef.current = previewTargetKey;

    const nextPreviewLayout = previewResult.layout;
    dragPreviewTimeoutRef.current = window.setTimeout(() => {
      if (pendingDragPreviewTargetKeyRef.current !== previewTargetKey) {
        return;
      }

      pendingDragPreviewTargetKeyRef.current = null;
      dragPreviewTimeoutRef.current = null;
      activeDragPreviewTargetKeyRef.current = previewTargetKey;
      setDragPreviewLayout(nextPreviewLayout);
    }, dragPreviewDelayMs);
  };

  const handleContainerDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedImageFiles = getImageFiles(event.dataTransfer);

    if (droppedImageFiles.length > 0) {
      const slot = getDropSlotForPointer(event.clientX, event.clientY);

      if (!slot) {
        finishDrag();
        return;
      }

      void addDroppedImageItemsToLayout({
        files: droppedImageFiles,
        layout: normalizedCommittedLayout,
        row: slot.row,
        column: slot.column,
        columns: numColumns,
        createdImageUrls: createdImageUrlsRef.current,
        onLayoutChanged: requestLayoutChange,
        onLayoutCommitted: recordCommittedLayout,
      });
      finishDrag();
      return;
    }

    const dragSourceLayout =
      dragStartLayoutRef.current ?? normalizedCommittedLayout;
    const dropResult = getDragPlacementForPointer(
      event.clientX,
      event.clientY,
      dragSourceLayout
    );
    const committedLayout = normalizeLayoutPositions(
      dropResult?.layout ?? dragSourceLayout,
      numColumns
    );

    // Persist the final layout only when the drag actually drops.
    if (!haveSameGridLayout(normalizedCommittedLayout, committedLayout)) {
      requestLayoutChange(committedLayout);
      recordCommittedLayout(committedLayout, normalizedCommittedLayout, 'drop');
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
      dragStartLayoutRef.current = null;
      resetDragPreview();
      setDraggingId(null);
      const parentCoords =
        event.currentTarget.parentElement?.getBoundingClientRect();

      if (!parentCoords) return;

      // Store every piece of information the resize gesture needs in one place
      // so mousemove can derive width without coordinating a separate ref.
      handlingResizingRef.current = null;
      resizePointerStateRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        widthDirection: null,
        heightDirection: null,
      };
      setResizeState({
        itemId: item.id,
        layoutAtResizeStart: normalizedCommittedLayout,
        parentCoords,
      });
    };

  const handleGridResizeMouseDown = (
    event: ReactMouseEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    resetDragPreview();
    setGridResizeState({
      startClientY: event.clientY,
      startRowCount: resolvedRowCount,
    });
  };

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        width: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      {enableUndo ? (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
          }}
        >
          <Button
            variant="contained"
            color="inherit"
            onClick={handleUndo}
            disabled={!canUndo}
            sx={{
              borderRadius: 999,
              px: 2,
              boxShadow: '0px 4px 14px rgba(16, 24, 40, 0.10)',
              backgroundColor: '#ffffff',
            }}
          >
            Undo
          </Button>
        </Box>
      ) : null}

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
            gridContentHeight +
            containerPadding * 2 +
            gridResizeHandleHeight +
            8,
          display: 'grid',
          gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${resolvedRowCount}, ${rowHeight}px)`,
          gap: `${gap}px`,
          alignItems: 'stretch',
          justifyItems: 'stretch',
          alignContent: 'start',
          justifyContent: 'start',
          overflow: 'hidden',
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

        {renderedItems.map(({ item, index, clampedWidth, clampedHeight }) => {
          const isDragging = item.id === draggingId;
          const isResizing = item.id === resizeState?.itemId;

          return (
            <DraggableGridCell
              key={item.id}
              itemId={item.id}
              rowStart={item.row ?? 1}
              columnStart={item.column ?? 1}
              setItemRef={setItemRef}
              isResizeDisabled={resizeState !== null}
              clampedWidth={clampedWidth}
              clampedHeight={clampedHeight}
              isDragging={isDragging}
              isResizing={isResizing}
              itemClassName={itemClassName}
              animationMs={animationMs}
              resizeHandleWidth={resizeHandleWidth}
              onDragStart={handleDragStart(item.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleItemDragOver}
              onResizeMouseDown={handleResizeMouseDown(item)}
            >
              {renderItem(item, index, isDragging, isResizing)}
            </DraggableGridCell>
          );
        })}

        <Box
          ref={dragPreviewIndicatorRef}
          aria-hidden
          sx={(currentTheme) => ({
            display: 'none',
            gridColumn: '1 / span 1',
            gridRow: '1 / span 1',
            minWidth: 0,
            width: '100%',
            height: '100%',
            alignSelf: 'stretch',
            justifySelf: 'stretch',
            pointerEvents: 'none',
            boxSizing: 'border-box',
            borderRadius: '14px',
            border: `2px dashed ${alpha(currentTheme.palette.primary.main, 0.5)}`,
            backgroundColor: alpha(currentTheme.palette.primary.main, 0.05),
            zIndex: 0,
          })}
        />

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
    </Box>
  );
}

function haveSameGridLayout<T extends DraggableGridItem>(
  first: T[],
  second: T[]
): boolean {
  const toReturn =
    first.length === second.length &&
    first.every((item, index) => {
      const candidate = second[index];

      return (
        item.id === candidate?.id &&
        item.width === candidate.width &&
        getItemHeight(item) === getItemHeight(candidate) &&
        item.row === candidate.row &&
        item.column === candidate.column
      );
    });

  return toReturn;
}

function areRectsApproximatelyEqual(
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

function doGridItemsOverlap(
  first: Pick<DraggableGridItem, 'row' | 'column' | 'width' | 'height'>,
  second: Pick<DraggableGridItem, 'row' | 'column' | 'width' | 'height'>
): boolean {
  const firstRowStart = first.row ?? 1;
  const firstColumnStart = first.column ?? 1;
  const firstRowEnd = firstRowStart + getItemHeight(first) - 1;
  const firstColumnEnd = firstColumnStart + first.width - 1;
  const secondRowStart = second.row ?? 1;
  const secondColumnStart = second.column ?? 1;
  const secondRowEnd = secondRowStart + getItemHeight(second) - 1;
  const secondColumnEnd = secondColumnStart + second.width - 1;

  return !(
    firstRowEnd < secondRowStart ||
    secondRowEnd < firstRowStart ||
    firstColumnEnd < secondColumnStart ||
    secondColumnEnd < firstColumnStart
  );
}

async function addDroppedImageItemsToLayout(args: {
  files: File[];
  layout: DraggableGridItem[];
  row: number;
  column: number;
  columns: number;
  createdImageUrls: Set<string>;
  onLayoutChanged: (nextLayout: DraggableGridItem[]) => void;
  onLayoutCommitted: (
    nextLayout: DraggableGridItem[],
    previousLayout: DraggableGridItem[],
    reason: 'drop'
  ) => void;
}): Promise<void> {
  const {
    files,
    layout,
    row,
    column,
    columns,
    createdImageUrls,
    onLayoutChanged,
    onLayoutCommitted,
  } = args;
  const imageItems = await Promise.all(
    files.map(async (file, index) => {
      const imageSrc = URL.createObjectURL(file);

      createdImageUrls.add(imageSrc);

      try {
        const dimensions = await readImageDimensions(imageSrc);
        const size = calculateSmartImageItemSize({
          imageWidth: dimensions.width,
          imageHeight: dimensions.height,
          totalColumns: columns,
          startColumn: column,
        });

        return {
          id: createImageGridItemId(),
          title: file.name,
          imageSrc,
          row: row + index,
          column,
          ...size,
        };
      } catch {
        return {
          id: createImageGridItemId(),
          title: file.name,
          imageSrc,
          width: 2,
          minWidth: 1,
          maxWidth: Math.max(2, Math.min(6, columns)),
          height: 2,
          minHeight: 1,
          maxHeight: 6,
          row: row + index,
          column,
        };
      }
    })
  );
  const nextLayout = normalizeLayoutPositions(
    [...layout, ...imageItems],
    columns
  );

  onLayoutChanged(nextLayout);
  onLayoutCommitted(nextLayout, layout, 'drop');
}

function cleanupRemovedImageObjectUrls(args: {
  previousLayout: DraggableGridItem[];
  nextLayout: DraggableGridItem[];
  createdImageUrls: Set<string>;
}): void {
  const { previousLayout, nextLayout, createdImageUrls } = args;
  const currentImageUrls = new Set(
    nextLayout.flatMap((item) => (item.imageSrc ? [item.imageSrc] : []))
  );

  previousLayout.forEach((item) => {
    if (
      item.imageSrc &&
      createdImageUrls.has(item.imageSrc) &&
      !currentImageUrls.has(item.imageSrc)
    ) {
      URL.revokeObjectURL(item.imageSrc);
      createdImageUrls.delete(item.imageSrc);
    }
  });
}

function hasImageFiles(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) {
    return false;
  }

  if (
    Array.from(dataTransfer.items).some(
      (item) =>
        item.kind === 'file' &&
        (item.type === '' || item.type.startsWith('image/'))
    )
  ) {
    return true;
  }

  return Array.from(dataTransfer.types).includes('Files');
}

function getImageFiles(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer) {
    return [];
  }

  return Array.from(dataTransfer.files).filter((file) => isImageFile(file));
}

function isImageFile(file: File): boolean {
  return (
    file.type.startsWith('image/') ||
    /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)$/i.test(file.name)
  );
}

async function readImageDimensions(
  imageSrc: string
): Promise<{ width: number; height: number }> {
  return await new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      reject(new Error('Failed to load image dimensions.'));
    };
    image.src = imageSrc;
  });
}

function calculateSmartImageItemSize(args: {
  imageWidth: number;
  imageHeight: number;
  totalColumns: number;
  startColumn: number;
}): Pick<
  DraggableGridItem,
  'width' | 'minWidth' | 'maxWidth' | 'height' | 'minHeight' | 'maxHeight'
> {
  const { imageWidth, imageHeight, totalColumns, startColumn } = args;
  const imageAspectRatio = imageWidth / Math.max(1, imageHeight);
  const maxWidthAtDropSlot = Math.max(1, totalColumns - startColumn + 1);
  const maxWidth = Math.max(1, Math.min(maxWidthAtDropSlot, totalColumns, 6));
  const maxHeight = 6;
  const targetArea = imageAspectRatio > 1.45 || imageAspectRatio < 0.7 ? 6 : 4;
  let bestCandidate = {
    width: 2,
    height: 2,
    score: Number.POSITIVE_INFINITY,
  };

  for (let width = 1; width <= maxWidth; width += 1) {
    for (let height = 1; height <= maxHeight; height += 1) {
      const candidateAspectRatio = width / height;
      const aspectPenalty = Math.abs(
        Math.log(candidateAspectRatio / imageAspectRatio)
      );
      const areaPenalty = Math.abs(width * height - targetArea) * 0.35;
      const extremeShapePenalty = width === 1 || height === 1 ? 0.2 : 0;
      const score = aspectPenalty * 5 + areaPenalty + extremeShapePenalty;

      if (score < bestCandidate.score) {
        bestCandidate = {
          width,
          height,
          score,
        };
      }
    }
  }

  return {
    width: bestCandidate.width,
    minWidth: 1,
    maxWidth,
    height: bestCandidate.height,
    minHeight: 1,
    maxHeight,
  };
}

function createImageGridItemId(): string {
  const randomId = globalThis.crypto?.randomUUID?.();

  if (randomId) {
    return `image-${randomId}`;
  }

  return `image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getNextResizePointerState(args: {
  previousPointerState: {
    clientX: number;
    clientY: number;
    widthDirection: 'increase' | 'decrease' | null;
    heightDirection: 'increase' | 'decrease' | null;
  } | null;
  clientX: number;
  clientY: number;
  pointerDirectionEpsilonPx: number;
}): {
  clientX: number;
  clientY: number;
  widthDirection: 'increase' | 'decrease' | null;
  heightDirection: 'increase' | 'decrease' | null;
} {
  const { previousPointerState, clientX, clientY, pointerDirectionEpsilonPx } =
    args;

  if (!previousPointerState) {
    return {
      clientX,
      clientY,
      widthDirection: null,
      heightDirection: null,
    };
  }

  return {
    clientX,
    clientY,
    widthDirection: getResizeDirection({
      delta: clientX - previousPointerState.clientX,
      previousDirection: previousPointerState.widthDirection,
      pointerDirectionEpsilonPx,
    }),
    heightDirection: getResizeDirection({
      delta: clientY - previousPointerState.clientY,
      previousDirection: previousPointerState.heightDirection,
      pointerDirectionEpsilonPx,
    }),
  };
}

function getResizeDirection(args: {
  delta: number;
  previousDirection: 'increase' | 'decrease' | null;
  pointerDirectionEpsilonPx: number;
}): 'increase' | 'decrease' | null {
  const { delta, previousDirection, pointerDirectionEpsilonPx } = args;

  if (delta > pointerDirectionEpsilonPx) {
    return 'increase';
  }

  if (delta < -pointerDirectionEpsilonPx) {
    return 'decrease';
  }

  return previousDirection;
}
