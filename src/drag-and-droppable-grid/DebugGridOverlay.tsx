import { Box, Typography } from '@mui/material';
import type { DraggableGridBreakpoint } from './types';

type DebugGridOverlayProps = {
  numColumns: number;
  activeBreakpoint: DraggableGridBreakpoint;
  rowCount: number;
  rowHeight: number;
  gap: number;
  containerPadding: number;
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
    containerPadding,
  } = props;
  const gridHeight = rowCount * rowHeight + Math.max(0, rowCount - 1) * gap;

  if (numColumns < 1 || rowCount < 1 || gridHeight <= 0) {
    return null;
  }

  return (
    <Box
      aria-hidden
      sx={{
        pointerEvents: 'none',
        position: 'absolute',
        top: `${containerPadding}px`,
        right: `${containerPadding}px`,
        left: `${containerPadding}px`,
        height: `${gridHeight}px`,
        zIndex: 2,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          border: '1px dashed rgba(32, 78, 54, 0.7)',
          background:
            'linear-gradient(to right, rgba(32, 78, 54, 0.08), rgba(32, 78, 54, 0.08))',
          backgroundSize: `${100 / numColumns}% 100%`,
          backgroundRepeat: 'repeat',
        }}
      />

      {Array.from({ length: numColumns - 1 }, (_, index) => (
        <Box
          key={`column-${index + 1}`}
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${((index + 1) / numColumns) * 100}%`,
            width: '1px',
            bgcolor: 'rgba(32, 78, 54, 0.45)',
          }}
        />
      ))}

      {Array.from({ length: Math.max(0, rowCount - 1) }, (_, index) => (
        <Box
          key={`row-${index + 1}`}
          sx={{
            position: 'absolute',
            right: 0,
            left: 0,
            top: `${(index + 1) * rowHeight + index * gap}px`,
            height: '1px',
            bgcolor: 'rgba(32, 78, 54, 0.45)',
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
