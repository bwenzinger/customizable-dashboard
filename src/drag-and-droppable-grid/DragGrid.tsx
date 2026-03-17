import { type DragEvent, type ReactNode, useState } from 'react';
import { Grid, type SxProps, type Theme } from '@mui/material';
import { GridItem } from './GridItem';

export interface DragGridLayoutItem {
  id: string;
}

type DragGridSize = {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
};

type DragGridColumns = {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
};

type DragGridSpacing =
  | number
  | {
      xs?: number;
      sm?: number;
      md?: number;
      lg?: number;
      xl?: number;
    };

interface DragState<T extends DragGridLayoutItem> {
  draggingId: string;
  previewLayout: T[];
}

export interface DragGridProps<T extends DragGridLayoutItem> {
  layout: T[];
  onLayoutChanged: (nextLayout: T[]) => void;
  renderItem: (item: T, index: number, isDragging: boolean) => ReactNode;
  getItemSize?: (item: T, index: number) => DragGridSize;
  columns?: DragGridColumns;
  spacing?: DragGridSpacing;
  sx?: SxProps<Theme>;
}

export function DragGrid<T extends DragGridLayoutItem>({
  layout,
  onLayoutChanged,
  renderItem,
  getItemSize,
  columns = { xs: 4, sm: 8, md: 12 },
  spacing = { xs: 2, md: 3 },
  sx,
}: DragGridProps<T>) {
  const [dragState, setDragState] = useState<DragState<T> | null>(null);

  const renderedLayout = dragState?.previewLayout ?? layout;
  const draggingId = dragState?.draggingId ?? null;

  const handleDragStart =
    (itemId: string) => (event: DragEvent<HTMLDivElement>) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', itemId);
      event.dataTransfer.setDragImage(event.currentTarget, 20, 20);

      setDragState({
        draggingId: itemId,
        previewLayout: layout,
      });
    };

  const handleDragEnter = (targetItemId: string) => () => {
    setDragState((currentDragState) => {
      if (!currentDragState) {
        return currentDragState;
      }

      if (currentDragState.draggingId === targetItemId) {
        return currentDragState;
      }

      const fromIndex = currentDragState.previewLayout.findIndex(
        (item) => item.id === currentDragState.draggingId
      );
      const toIndex = currentDragState.previewLayout.findIndex(
        (item) => item.id === targetItemId
      );

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return currentDragState;
      }

      return {
        ...currentDragState,
        previewLayout: reorderLayout(
          currentDragState.previewLayout,
          fromIndex,
          toIndex
        ),
      };
    });
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (dragState) {
      onLayoutChanged(dragState.previewLayout);
    }

    setDragState(null);
  };

  const handleDragEnd = () => {
    setDragState(null);
  };

  return (
    <Grid
      container
      spacing={spacing}
      columns={columns}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{
        p: 4,
        userSelect: 'none',
        ...sx,
      }}
    >
      {renderedLayout.map((item, index) => {
        const isDragging = item.id === draggingId;
        const size = getItemSize?.(item, index) ?? { xs: 2, sm: 4, md: 4 };

        return (
          <Grid size={size}>
            <div
              draggable
              onDragStart={handleDragStart(item.id)}
              onDragEnter={handleDragEnter(item.id)}
              onDragEnd={handleDragEnd}
              style={{
                height: '100%',
                opacity: isDragging ? 0.45 : 1,
                transform: isDragging ? 'scale(0.98)' : 'scale(1)',
                transition:
                  'transform 180ms cubic-bezier(0.2, 0, 0, 1), opacity 180ms cubic-bezier(0.2, 0, 0, 1)',
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
            >
              <GridItem>{renderItem(item, index, isDragging)}</GridItem>
            </div>
          </Grid>
        );
      })}
    </Grid>
  );
}

function reorderLayout<T>(
  layout: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const nextLayout = [...layout];
  const movedItem = nextLayout[fromIndex];

  if (!movedItem) {
    return layout;
  }

  nextLayout.splice(fromIndex, 1);
  nextLayout.splice(toIndex, 0, movedItem);

  return nextLayout;
}
