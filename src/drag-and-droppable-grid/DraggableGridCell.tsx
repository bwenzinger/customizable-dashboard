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
  canEdit: boolean;
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
    canEdit,
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
  const editBorderColor = alpha(
    theme.palette.primary.main,
    isResizing ? 0.48 : isDragging ? 0.42 : 0.22
  );
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
      data-draggable-grid-editable={canEdit ? 'true' : undefined}
      data-draggable-grid-dragging={isDragging ? 'true' : undefined}
      data-draggable-grid-resizing={isResizing ? 'true' : undefined}
      sx={{
        '--draggable-grid-hover-lift-y': isResizing ? '0px' : '-2px',
        '--draggable-grid-edit-border-color': editBorderColor,
        position: 'relative',
        zIndex: isDragging ? 2 : 1,
        minWidth: 0,
        height: '100%',
        alignSelf: 'stretch',
        borderRadius: '16px',
        gridColumn: `${columnStart} / span ${clampedWidth}`,
        gridRow: `${rowStart} / span ${clampedHeight}`,
        cursor: isDragDisabled ? 'default' : isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        opacity: isDragging ? 0.75 : 1,
        transform: 'scale(1)',
        filter: 'none',
        transition: `opacity ${Math.min(animationMs, 120)}ms ease, transform ${Math.min(animationMs, 120)}ms ease, filter ${Math.min(animationMs, 120)}ms ease`,
        // The cell-level edit ring makes the "editable" affordance reusable even
        // when consumers render custom card content instead of the demo widgets.
        '&::after': canEdit
          ? {
              content: '""',
              position: 'absolute',
              inset: 2,
              zIndex: 1,
              pointerEvents: 'none',
              borderRadius: '14px',
              border: '1px dashed var(--draggable-grid-edit-border-color)',
              boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.5)',
              transform: 'translateY(0px)',
              transition: `border-color ${Math.min(animationMs, 140)}ms ease, opacity ${Math.min(animationMs, 140)}ms ease, transform ${Math.min(animationMs, 120)}ms cubic-bezier(0.2, 0, 0, 1)`,
            }
          : undefined,
        '&:hover::after':
          canEdit && !isDragDisabled
            ? {
                borderColor: alpha(theme.palette.primary.main, 0.34),
              }
            : undefined,
        '&:has(.draggable-grid-hover-sync:hover)::after':
          canEdit && !isDragDisabled
            ? {
                transform:
                  'translateY(var(--draggable-grid-hover-lift-y, -2px))',
              }
            : undefined,
        '&:has(.draggable-grid-hover-sync):has(.draggable-grid-resize-handle:hover)::after':
          canEdit && !isDragDisabled
            ? {
                transform:
                  'translateY(var(--draggable-grid-hover-lift-y, -2px))',
              }
            : undefined,
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
