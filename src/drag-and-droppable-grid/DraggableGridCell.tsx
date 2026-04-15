import { useCallback } from 'react';
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
  isResizing: boolean;
  isDragDisabled: boolean;
  isResizeHandleVisible: boolean;
  itemClassName?: string;
  animationMs: number;
  resizeHandleWidth: number;
  children: ReactNode;
  setItemRef: (itemId: string, node: HTMLDivElement | null) => void;
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
    isResizing,
    isDragDisabled,
    isResizeHandleVisible,
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
  const handleItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      setItemRef(itemId, node);
    },
    [itemId, setItemRef]
  );
  const visibleResizeHandleWidth = Math.max(resizeHandleWidth, 24);
  const gripColor = alpha(theme.palette.text.secondary, 0.42);
  const activeGripColor = alpha(theme.palette.primary.main, 0.72);
  const cellClassName = ['draggable-grid-cell', itemClassName]
    .filter(Boolean)
    .join(' ');

  return (
    <Box
      ref={handleItemRef}
      draggable={!isDragDisabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      className={cellClassName}
      sx={{
        '--draggable-grid-hover-lift-y': isResizing ? '0px' : '-2px',
        position: 'relative',
        zIndex: isDragging ? 2 : 1,
        minWidth: 0,
        height: '100%',
        alignSelf: 'stretch',
        gridColumn: `${columnStart} / span ${clampedWidth}`,
        gridRow: `${rowStart} / span ${clampedHeight}`,
        cursor: isDragDisabled ? 'default' : isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        opacity: isDragging ? 0.75 : 1,
        transform: 'scale(1)',
        filter: 'none',
        transition: `opacity ${Math.min(animationMs, 120)}ms ease, transform ${Math.min(animationMs, 120)}ms ease, filter ${Math.min(animationMs, 120)}ms ease`,
        ...(isDragDisabled
          ? {
              '& *': {
                cursor: 'default !important',
              },
            }
          : {}),
      }}
    >
      {children}

      {isResizeHandleVisible ? (
        <ResizeCornerHandle
          gripColor={gripColor}
          activeGripColor={activeGripColor}
          isResizing={isResizing}
          animationMs={animationMs}
          visibleResizeHandleWidth={visibleResizeHandleWidth}
          onResizeMouseDown={onResizeMouseDown}
        />
      ) : null}
    </Box>
  );
}
