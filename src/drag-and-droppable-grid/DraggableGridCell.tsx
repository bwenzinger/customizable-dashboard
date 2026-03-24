import { Box } from '@mui/material';
import type {
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react';

type DraggableGridCellProps = {
  itemId: string;
  clampedWidth: number;
  isDragging: boolean;
  isResizeDisabled: boolean;
  itemClassName?: string;
  animationMs: number;
  resizeHandleWidth: number;
  children: ReactNode;
  setItemRef: (node: HTMLDivElement | null) => void;
  onDragStart: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragOver: (event: ReactDragEvent<HTMLDivElement>) => void;
  onResizeMouseDown: (event: ReactMouseEvent<HTMLDivElement>) => void;
};

export function DraggableGridCell(
  props: DraggableGridCellProps
): React.JSX.Element {
  const {
    itemId,
    clampedWidth,
    isDragging,
    isResizeDisabled,
    itemClassName,
    animationMs,
    resizeHandleWidth,
    children,
    setItemRef,
    onDragStart,
    onDragEnd,
    onDragOver,
    onResizeMouseDown,
  } = props;

  return (
    <Box
      key={itemId}
      ref={setItemRef}
      draggable={!isResizeDisabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      className={itemClassName}
      sx={{
        position: 'relative',
        zIndex: 1,
        minWidth: 0,
        gridColumn: `span ${clampedWidth}`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        opacity: isDragging ? 0.35 : 1,
        transition: `opacity ${Math.min(animationMs, 120)}ms ease`,
      }}
    >
      {children}

      <Box
        onMouseDown={onResizeMouseDown}
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
}
