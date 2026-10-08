import type { DraggableGridProps } from './drag-and-droppable-grid/types';

// Expose live props only. initialRowCount applies on mount; replaying it by
// remounting would discard the visitor's Undo history and grid row adjustments.
export type DemoGridSettingsValues = Required<
  Pick<
    DraggableGridProps,
    | 'rowHeight'
    | 'gap'
    | 'animationMs'
    | 'resizeHandleWidth'
    | 'minRowCount'
    | 'showGridlines'
    | 'enableUndo'
    | 'enableCollapse'
    | 'enableOptimize'
  >
> & { columns: number; responsiveColumns: boolean };

// Match the existing demo so opening the panel doesn't change its behavior.
export const defaultDemoGridSettings: DemoGridSettingsValues = {
  columns: 10,
  responsiveColumns: false,
  rowHeight: 75,
  gap: 16,
  animationMs: 320,
  resizeHandleWidth: 12,
  minRowCount: 4,
  showGridlines: false,
  enableUndo: true,
  enableCollapse: true,
  enableOptimize: true,
};

export function getDemoGridColumns({
  columns,
  responsiveColumns,
}: Pick<DemoGridSettingsValues, 'columns' | 'responsiveColumns'>): NonNullable<
  DraggableGridProps['columns']
> {
  return responsiveColumns
    ? {
        xs: Math.min(columns, 2),
        sm: Math.min(columns, 4),
        md: Math.min(columns, 8),
        lg: columns,
        xl: columns,
      }
    : columns;
}
