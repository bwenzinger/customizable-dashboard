import { Box } from '@mui/material';
import type {
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';

type ResizeCornerHandleProps = {
  gripColor: string;
  activeGripColor: string;
  isResizing: boolean;
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
    isResizing,
    animationMs,
    visibleResizeHandleWidth,
    onResizeMouseDown,
  } = props;
  const gripInset = 7;
  const gripSize = 16;

  return (
    <Box
      className="draggable-grid-resize-handle"
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
        cursor: 'nwse-resize',
        zIndex: 2,
        borderBottomRightRadius: 'inherit',
        overflow: 'hidden',
        transform: 'translateY(0px)',
        transition: `opacity ${Math.min(animationMs, 120)}ms ease, transform ${Math.min(animationMs, 120)}ms cubic-bezier(0.2, 0, 0, 1)`,
        opacity: isResizing ? 1 : 0.9,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: isResizing
            ? 'linear-gradient(135deg, transparent 34%, rgba(255, 255, 255, 0.9) 34%, rgba(255, 255, 255, 0.98) 100%)'
            : 'linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.72) 40%, rgba(255, 255, 255, 0.92) 100%)',
          boxShadow: isResizing
            ? 'inset 1px 1px 0 rgba(67, 56, 202, 0.12)'
            : 'inset 1px 1px 0 rgba(255, 255, 255, 0.3)',
          pointerEvents: 'none',
        },
        '.draggable-grid-cell:has(.draggable-grid-hover-sync:hover) &': {
          transform: 'translateY(var(--draggable-grid-hover-lift-y, -2px))',
        },
        '.draggable-grid-cell:has(.draggable-grid-hover-sync):has(.draggable-grid-resize-handle:hover) &':
          {
            transform: 'translateY(var(--draggable-grid-hover-lift-y, -2px))',
          },
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
              stroke: isResizing ? activeGripColor : gripColor,
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
              stroke: isResizing ? activeGripColor : gripColor,
              strokeWidth: 1.5,
              strokeLinecap: 'round',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
