import { Box, Typography } from '@mui/material';
import type {
  DraggableGridBreakpoint,
  DraggableGridResponsiveColumns,
} from './types';

type DebugGridOverlayProps = {
  columns: number | DraggableGridResponsiveColumns;
  resolvedColumns: number;
  activeBreakpoint: DraggableGridBreakpoint;
  rowCount: number;
  rowBoundaries: number[];
  gridHeight: number;
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
    columns,
    resolvedColumns,
    activeBreakpoint,
    rowCount,
    rowBoundaries,
    gridHeight,
    containerPadding,
  } = props;

  if (resolvedColumns < 1 || rowCount < 1 || gridHeight <= 0) {
    return null;
  }

  const breakpointColumns = getBreakpointColumns(columns);

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
          backgroundSize: `${100 / resolvedColumns}% 100%`,
          backgroundRepeat: 'repeat',
        }}
      />

      {Array.from({ length: resolvedColumns - 1 }, (_, index) => (
        <Box
          key={`column-${index + 1}`}
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${((index + 1) / resolvedColumns) * 100}%`,
            width: '1px',
            bgcolor: 'rgba(32, 78, 54, 0.45)',
          }}
        />
      ))}

      {rowBoundaries.slice(0, -1).map((boundary, index) => (
        <Box
          key={`row-${index + 1}`}
          sx={{
            position: 'absolute',
            right: 0,
            left: 0,
            top: `${boundary}px`,
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
          {activeBreakpoint}: {resolvedColumns} cols x {rowCount} rows
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

              return `${prefix}${breakpoint}:${breakpointColumns[breakpoint]}${suffix}`;
            })
            .join('  ')}
        </Typography>
      </Box>
    </Box>
  );
}

function getBreakpointColumns(
  columns: number | DraggableGridResponsiveColumns
): Record<DraggableGridBreakpoint, number> {
  if (typeof columns === 'number') {
    return {
      xs: columns,
      sm: columns,
      md: columns,
      lg: columns,
      xl: columns,
    };
  }

  return {
    xs: columns.xs ?? 1,
    sm: columns.sm ?? columns.xs ?? 1,
    md: columns.md ?? columns.sm ?? columns.xs ?? 1,
    lg: columns.lg ?? columns.md ?? columns.sm ?? columns.xs ?? 1,
    xl: columns.xl ?? columns.lg ?? columns.md ?? columns.sm ?? columns.xs ?? 1,
  };
}
