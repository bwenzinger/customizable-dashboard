import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { Box } from '@mui/material';

export type DraggableGridItem = {
  id: string;
  width: number;
  minWidth: number;
  maxWidth: number;
};

export type DraggableGridProps<T extends DraggableGridItem> = {
  layout: T[];
  onLayoutChanged: (nextLayout: T[]) => void;
  renderItem: (item: T, index: number, isDragging: boolean) => ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
  itemClassName?: string;
  animationMs?: number;
  resizeHandleWidth?: number;
};

type ReorderLock = {
  left: number;
  right: number;
  top: number;
  bottom: number;
} | null;

type ResizeState<T extends DraggableGridItem> = {
  itemId: string;
  startClientX: number;
  startWidth: number;
  layoutAtResizeStart: T[];
} | null;

export function DraggableGrid<T extends DraggableGridItem>(
  props: DraggableGridProps<T>
): React.JSX.Element {
  const {
    layout,
    onLayoutChanged,
    renderItem,
    columns = 3,
    gap = 12,
    className,
    itemClassName,
    animationMs = 320,
    resizeHandleWidth = 12,
  } = props;

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draftLayout, setDraftLayout] = useState<T[] | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState<T>>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const previousRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const reorderLockRef = useRef<ReorderLock>(null);
  const isResizingRef = useRef<boolean>(false);

  const renderedLayout =
    (draggingId !== null || resizeState !== null) && draftLayout !== null
      ? draftLayout
      : layout;

  useLayoutEffect(() => {
    const nextRects = new Map<string, DOMRect>();
    const frameIds: number[] = [];

    renderedLayout.forEach((item) => {
      if (item.id === draggingId) {
        return;
      }

      const element = itemRefs.current.get(item.id);

      if (!element) {
        return;
      }

      nextRects.set(item.id, element.getBoundingClientRect());
    });

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
  }, [animationMs, draggingId, renderedLayout]);

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
        columns,
        gap,
        startWidth: resizeState.startWidth,
        deltaX: event.clientX - resizeState.startClientX,
      });

      const nextLayout = resizeState.layoutAtResizeStart.map((item) => {
        if (item.id !== resizeState.itemId) {
          return item;
        }

        const maxAllowedWidth = Math.min(item.maxWidth, columns);
        const minAllowedWidth = Math.max(1, item.minWidth);
        const clampedWidth = clamp(nextWidth, minAllowedWidth, maxAllowedWidth);

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
  }, [columns, gap, onLayoutChanged, resizeState]);

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

  const handleDragStart = useCallback(
    (itemId: string) => (event: ReactDragEvent<HTMLDivElement>) => {
      if (resizeState || isResizingRef.current) {
        event.preventDefault();
        return;
      }

      setDraggingId(itemId);
      setDraftLayout(layout);
      reorderLockRef.current = null;

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', itemId);
    },
    [layout, resizeState]
  );

  const finishDrag = useCallback(() => {
    setDraggingId(null);
    setDraftLayout(null);
    reorderLockRef.current = null;
  }, []);

  const handleDragEnd = useCallback(() => {
    finishDrag();
  }, [finishDrag]);

  const handleContainerDragOver = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';

      const lock = reorderLockRef.current;

      if (!lock) {
        return;
      }

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

  const handleContainerDrop = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      finishDrag();
    },
    [finishDrag]
  );

  const handleItemDragOver = useCallback(
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

      reorderLockRef.current = expandRect({
        rect: targetRect,
        paddingPx: 8,
      });

      setDraftLayout(nextLayout);
      onLayoutChanged(nextLayout);
    },
    [draftLayout, draggingId, layout, onLayoutChanged, resizeState]
  );

  const handleResizeMouseDown = useCallback(
    (item: T) => (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      isResizingRef.current = true;
      setDraggingId(null);
      reorderLockRef.current = null;
      setDraftLayout(renderedLayout);
      setResizeState({
        itemId: item.id,
        startClientX: event.clientX,
        startWidth: item.width,
        layoutAtResizeStart: renderedLayout,
      });
    },
    [renderedLayout]
  );

  return (
    <Box
      ref={containerRef}
      className={className}
      onDragOver={handleContainerDragOver}
      onDrop={handleContainerDrop}
      sx={{
        height: '100%',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridAutoFlow: 'row dense',
        gap: `${gap}px`,
        alignItems: 'start',
        justifyItems: 'stretch',
        alignContent: 'start',
        justifyContent: 'start',
        overflowX: 'hidden',
        padding: 6,
      }}
    >
      {renderedLayout.map((item, index) => {
        const isDragging = item.id === draggingId;
        const clampedWidth = clamp(
          item.width,
          item.minWidth,
          Math.min(item.maxWidth, columns)
        );

        return (
          <Box
            key={item.id}
            ref={setItemRef(item.id)}
            draggable={resizeState === null}
            onDragStart={handleDragStart(item.id)}
            onDragEnd={handleDragEnd}
            onDragOver={handleItemDragOver(item.id)}
            className={itemClassName}
            sx={{
              position: 'relative',
              minWidth: 0,
              gridColumn: `span ${clampedWidth}`,
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              opacity: isDragging ? 0.35 : 1,
              transition: `opacity ${Math.min(animationMs, 120)}ms ease`,
            }}
          >
            {renderItem(item, index, isDragging)}

            <Box
              onMouseDown={handleResizeMouseDown(item)}
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: `${resizeHandleWidth}px`,
                cursor: 'col-resize',
                zIndex: 2,
                backgroundColor: 'transparent',
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
}

function reorderItems<T>(items: T[], fromIndex: number, toIndex: number): T[] {
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

function shouldReorderOnOverlap(args: {
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

function isPointWithinRect(args: {
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

function expandRect(args: { rect: DOMRect; paddingPx: number }): {
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

function getResizedColumnSpan(args: {
  containerWidth: number;
  columns: number;
  gap: number;
  startWidth: number;
  deltaX: number;
}): number {
  const { containerWidth, columns, gap, startWidth, deltaX } = args;

  const singleColumnWidth = (containerWidth - gap * (columns - 1)) / columns;
  const strideWidth = singleColumnWidth + gap;
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

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.min(Math.max(value, minValue), maxValue);
}
