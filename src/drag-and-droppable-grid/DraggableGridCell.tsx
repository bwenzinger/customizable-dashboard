import { alpha } from '@mui/material/styles';
import { Box, useTheme } from '@mui/material';
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

type ResizeCornerHandleProps = {
  gripColor: string;
  activeGripColor: string;
  isDragging: boolean;
  animationMs: number;
  visibleResizeHandleWidth: number;
  onResizeMouseDown: (event: ReactMouseEvent<HTMLDivElement>) => void;
};

export function DraggableGridCell(
  props: DraggableGridCellProps
): React.JSX.Element {
  const theme = useTheme();
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

function ResizeCornerHandle(props: ResizeCornerHandleProps): React.JSX.Element {
  const {
    gripColor,
    activeGripColor,
    isDragging,
    animationMs,
    visibleResizeHandleWidth,
    onResizeMouseDown,
  } = props;
  const gripInset = 7;
  const gripSize = 16;

  return (
    <Box
      onMouseDown={onResizeMouseDown}
      sx={{
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: `${visibleResizeHandleWidth}px`,
        height: `${visibleResizeHandleWidth}px`,
        cursor: 'col-resize',
        zIndex: 2,
        borderBottomRightRadius: 'inherit',
        overflow: 'hidden',
        transition: `opacity ${Math.min(animationMs, 120)}ms ease`,
        opacity: isDragging ? 1 : 0.9,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          right: gripInset,
          bottom: gripInset,
          width: gripSize,
          height: gripSize,
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 16 16"
          aria-hidden
          sx={{
            display: 'block',
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          <Box
            component="line"
            x1="2"
            y1="14"
            x2="14"
            y2="2"
            sx={{
              stroke: isDragging ? activeGripColor : gripColor,
              strokeWidth: 1.5,
              strokeLinecap: 'round',
            }}
          />
          <Box
            component="line"
            x1="8"
            y1="14"
            x2="14"
            y2="8"
            sx={{
              stroke: isDragging ? activeGripColor : gripColor,
              strokeWidth: 1.5,
              strokeLinecap: 'round',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
