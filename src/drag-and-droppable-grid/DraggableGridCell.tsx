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
  const visibleResizeHandleWidth = Math.max(resizeHandleWidth, 18);

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
          top: 8,
          right: 0,
          bottom: 8,
          width: `${visibleResizeHandleWidth}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'col-resize',
          zIndex: 2,
          borderTopLeftRadius: 10,
          borderBottomLeftRadius: 10,
          background:
            'linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.14))',
          borderLeft: '1px solid rgba(15, 23, 42, 0.12)',
          transition: `background-color ${Math.min(animationMs, 120)}ms ease`,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: '3px',
          }}
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Box
              key={`resize-grip-${index}`}
              sx={{
                width: 10,
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
