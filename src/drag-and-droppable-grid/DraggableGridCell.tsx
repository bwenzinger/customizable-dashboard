import { alpha } from '@mui/material/styles';
import { Box, useTheme } from '@mui/material';
import type {
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react';
import { ResizeCornerHandle } from './ResizeCornerHandle';

type DraggableGridCellProps = {
  itemId: string;
  rowStart: number;
  columnStart: number;
  clampedWidth: number;
  clampedHeight: number;
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
  const theme = useTheme();
  const {
    itemId,
    rowStart,
    columnStart,
    clampedWidth,
    clampedHeight,
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
  const visibleResizeHandleWidth = Math.max(resizeHandleWidth, 24);
  const gripColor = alpha(theme.palette.text.secondary, 0.42);
  const activeGripColor = alpha(theme.palette.primary.main, 0.72);

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
        zIndex: isDragging ? 4 : 1,
        minWidth: 0,
        height: '100%',
        alignSelf: 'stretch',
        gridColumn: `${columnStart} / span ${clampedWidth}`,
        gridRow: `${rowStart} / span ${clampedHeight}`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        opacity: isDragging ? 0.92 : 1,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        filter: isDragging
          ? `drop-shadow(0 10px 20px ${alpha(theme.palette.common.black, 0.18)})`
          : 'none',
        transition: `opacity ${Math.min(animationMs, 120)}ms ease, transform ${Math.min(animationMs, 120)}ms ease, filter ${Math.min(animationMs, 120)}ms ease`,
      }}
    >
      {children}

      <ResizeCornerHandle
        gripColor={gripColor}
        activeGripColor={activeGripColor}
        isDragging={isDragging}
        animationMs={animationMs}
        visibleResizeHandleWidth={visibleResizeHandleWidth}
        onResizeMouseDown={onResizeMouseDown}
      />
    </Box>
  );
}
