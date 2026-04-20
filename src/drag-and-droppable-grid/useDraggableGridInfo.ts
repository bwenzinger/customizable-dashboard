import { useMediaQuery, useTheme } from '@mui/material';
import { getActiveBreakpoint, getNumColumns } from './gridMath';
import type { DraggableGridProps } from './types';

export function useDraggableGridInfo({
  columns,
}: {
  columns: NonNullable<DraggableGridProps['columns']>;
}) {
  const theme = useTheme();
  const matchesXs = useMediaQuery(theme.breakpoints.up('xs'));
  const matchesSm = useMediaQuery(theme.breakpoints.up('sm'));
  const matchesMd = useMediaQuery(theme.breakpoints.up('md'));
  const matchesLg = useMediaQuery(theme.breakpoints.up('lg'));
  const matchesXl = useMediaQuery(theme.breakpoints.up('xl'));
  const breakpointMatches = {
    xs: matchesXs,
    sm: matchesSm,
    md: matchesMd,
    lg: matchesLg,
    xl: matchesXl,
  };

  const activeBreakpoint = getActiveBreakpoint(breakpointMatches);
  const numColumns = getNumColumns({
    columns,
    activeBreakpoint,
  });

  return { activeBreakpoint, numColumns };
}
