import { Box, Typography } from '@mui/material';
import type { DraggableGridBreakpoint } from './types';

type DebugGridOverlayProps = {
  numColumns: number;
  activeBreakpoint: DraggableGridBreakpoint;
  rowCount: number;
  rowHeight: number;
  gap: number;
};

const orderedBreakpoints: DraggableGridBreakpoint[] = [
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
];

export function DebugGridOverlay(
  props: DebugGridOverlayProps
): React.JSX.Element | null {
  const {
    numColumns,
    activeBreakpoint,
    rowCount,
    rowHeight,
    gap,
  } = props;

  if (numColumns < 1 || rowCount < 1 || rowHeight <= 0) {
    return null;
  }

  return (
    <Box
      aria-hidden
      sx={{
        alignSelf: 'stretch',
        display: 'grid',
        gap: `${gap}px`,
        gridColumn: '1 / -1',
        gridRow: `1 / span ${rowCount}`,
        gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rowCount}, ${rowHeight}px)`,
        justifySelf: 'stretch',
        minWidth: 0,
        pointerEvents: 'none',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {Array.from({ length: numColumns * rowCount }, (_, index) => (
        <Box
          key={`grid-cell-${index}`}
          sx={{
            minWidth: 0,
            minHeight: 0,
            border: '1px dashed rgba(32, 78, 54, 0.55)',
            backgroundColor: 'rgba(32, 78, 54, 0.06)',
            boxSizing: 'border-box',
          }}
        />
      ))}

      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          maxWidth: 'min(100%, 320px)',
          px: 1.25,
          py: 0.75,
          borderRadius: 1,
          bgcolor: 'rgba(245, 252, 247, 0.9)',
          border: '1px solid rgba(32, 78, 54, 0.35)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontFamily: 'monospace',
            color: 'rgba(20, 48, 33, 0.95)',
          }}
        >
          {activeBreakpoint}: {numColumns} cols x {rowCount} rows
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontFamily: 'monospace',
            color: 'rgba(20, 48, 33, 0.8)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {orderedBreakpoints
            .map((breakpoint) => {
              const prefix = breakpoint === activeBreakpoint ? '[' : ' ';
              const suffix = breakpoint === activeBreakpoint ? ']' : ' ';

              return `${prefix}${breakpoint}:${numColumns}${suffix}`;
            })
            .join('  ')}
        </Typography>
      </Box>
    </Box>
  );
}
