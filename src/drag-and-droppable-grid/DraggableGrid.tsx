import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type ReactNode,
} from 'react';

export type DraggableGridItem = {
  id: string;
};

export type DraggableGridProps<T extends DraggableGridItem> = {
  layout: T[];
  onLayoutChanged: (nextLayout: T[]) => void;
  renderItem: (item: T, index: number, isDragging: boolean) => ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
  style?: CSSProperties;
  itemClassName?: string;
  itemStyle?: CSSProperties;
  animationMs?: number;
};

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
    style,
    itemClassName,
    itemStyle,
    animationMs = 180,
  } = props;

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draftLayout, setDraftLayout] = useState<T[] | null>(null);

  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const previousRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const lastSwapSignatureRef = useRef<string>('');

  const renderedLayout =
    draggingId !== null && draftLayout !== null ? draftLayout : layout;

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
      setDraggingId(itemId);
      setDraftLayout(layout);
      lastSwapSignatureRef.current = '';

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', itemId);
    },
    [layout]
  );

  const finishDrag = useCallback(() => {
    setDraggingId(null);
    setDraftLayout(null);
    lastSwapSignatureRef.current = '';
  }, []);

  const handleDragEnd = useCallback(() => {
    finishDrag();
  }, [finishDrag]);

  const handleContainerDragOver = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
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

      const activeDraggingId = draggingId;
      const currentDraftLayout =
        draggingId !== null && draftLayout !== null ? draftLayout : layout;

      if (!activeDraggingId || activeDraggingId === targetItemId) {
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

      const shouldMove = shouldReorderOnOverlap({
        fromIndex,
        toIndex,
        columns,
        targetRect: event.currentTarget.getBoundingClientRect(),
        clientX: event.clientX,
        clientY: event.clientY,
      });

      if (!shouldMove) {
        return;
      }

      const swapSignature = `${activeDraggingId}:${fromIndex}->${toIndex}`;

      if (lastSwapSignatureRef.current === swapSignature) {
        return;
      }

      lastSwapSignatureRef.current = swapSignature;

      const nextLayout = reorderItems(currentDraftLayout, fromIndex, toIndex);

      setDraftLayout(nextLayout);
      onLayoutChanged(nextLayout);
    },
    [columns, draftLayout, draggingId, layout, onLayoutChanged]
  );

  return (
    <div
      className={className}
      onDragOver={handleContainerDragOver}
      onDrop={handleContainerDrop}
      style={getContainerStyle({
        columns,
        gap,
        style,
      })}
    >
      {renderedLayout.map((item, index) => {
        const isDragging = item.id === draggingId;

        return (
          <div
            key={item.id}
            ref={setItemRef(item.id)}
            draggable
            onDragStart={handleDragStart(item.id)}
            onDragEnd={handleDragEnd}
            onDragOver={handleItemDragOver(item.id)}
            className={itemClassName}
            style={getItemStyle({
              animationMs,
              isDragging,
              itemStyle,
            })}
          >
            {renderItem(item, index, isDragging)}
          </div>
        );
      })}
    </div>
  );
}

function getContainerStyle(args: {
  columns: number;
  gap: number;
  style: CSSProperties | undefined;
}): CSSProperties {
  const { columns, gap, style } = args;

  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap,
    alignItems: 'stretch',
    ...style,
  };
}

function getItemStyle(args: {
  animationMs: number;
  isDragging: boolean;
  itemStyle: CSSProperties | undefined;
}): CSSProperties {
  const { animationMs, isDragging, itemStyle } = args;

  return {
    minWidth: 0,
    cursor: 'grab',
    userSelect: 'none',
    opacity: isDragging ? 0.35 : 1,
    transition: `opacity ${Math.min(animationMs, 120)}ms ease`,
    ...itemStyle,
  };
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
  fromIndex: number;
  toIndex: number;
  columns: number;
  targetRect: DOMRect;
  clientX: number;
  clientY: number;
}): boolean {
  const { fromIndex, toIndex, columns, targetRect, clientX, clientY } = args;

  const fromRow = Math.floor(fromIndex / columns);
  const toRow = Math.floor(toIndex / columns);
  const isSameRow = fromRow === toRow;

  if (isSameRow) {
    const targetMidX = targetRect.left + targetRect.width / 2;

    if (fromIndex < toIndex) {
      return clientX >= targetMidX;
    }

    return clientX <= targetMidX;
  }

  const targetMidY = targetRect.top + targetRect.height / 2;

  if (fromIndex < toIndex) {
    return clientY >= targetMidY;
  }

  return clientY <= targetMidY;
}
