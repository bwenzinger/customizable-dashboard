import { Box } from '@mui/material';
import type {
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';

type ResizeCornerHandleProps = {
  gripColor: string;
  activeGripColor: string;
  isDragging: boolean;
  animationMs: number;
  visibleResizeHandleWidth: number;
  onResizeMouseDown: (event: ReactMouseEvent<HTMLDivElement>) => void;
};

export function ResizeCornerHandle(
  props: ResizeCornerHandleProps
): React.JSX.Element {
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
      draggable={false}
      onDragStart={(event: ReactDragEvent<HTMLDivElement>) => {
        event.preventDefault();
      }}
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
