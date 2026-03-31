import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  useTheme,
} from '@mui/material';

import { DraggableGridContextWrapper } from './drag-and-droppable-grid/DraggableGridContextWrapper';
import type {
  DraggableGridItem,
  DraggableGridProps,
} from './drag-and-droppable-grid/types';

type Tile = DraggableGridItem & {
  title: string;
};

const initialLayout: Tile[] = [
  {
    id: 'a',
    title: 'Overview',
    width: 1,
    minWidth: 3,
    maxWidth: 7,
    height: 1,
    minHeight: 1,
    maxHeight: 4,
  },
  {
    id: 'b',
    title: 'Alerts',
    width: 1,
    minWidth: 5,
    maxWidth: 5,
    height: 1,
    minHeight: 1,
    maxHeight: 3,
  },
  {
    id: 'c',
    title: 'Usage',
    width: 1,
    minWidth: 2,
    maxWidth: 7,
    height: 1,
    minHeight: 1,
    maxHeight: 4,
  },
  {
    id: 'd',
    title: 'Cost',
    width: 1,
    minWidth: 1,
    maxWidth: 11,
    height: 1,
    minHeight: 1,
    maxHeight: 5,
  },
  {
    id: 'e',
    title: 'Forecast',
    width: 1,
    minWidth: 1,
    maxWidth: 5,
    height: 1,
    minHeight: 1,
    maxHeight: 4,
  },
  {
    id: 'f',
    title: 'Settings',
    width: 1,
    minWidth: 1,
    maxWidth: 7,
    height: 1,
    minHeight: 1,
    maxHeight: 4,
  },
];

function App() {
  const theme = useTheme();
  const [layout, setLayout] = useState<DraggableGridItem[]>(initialLayout);
  const [layoutHistory, setLayoutHistory] = useState<DraggableGridItem[][]>([]);

  const handleLayoutChanged = useCallback((nextLayout: DraggableGridItem[]) => {
    // Live grid updates change the current committed layout on screen, but they
    // do not automatically create undo history.
    setLayout(nextLayout);
  }, []);

  const handleLayoutCommitted = useCallback<
    NonNullable<DraggableGridProps['onLayoutCommitted']>
  >((nextLayout, previousLayout) => {
    if (haveSameLayout(previousLayout, nextLayout)) {
      return;
    }

    // Only finalized interactions push an undo checkpoint.
    setLayoutHistory((currentHistory) => [...currentHistory, previousLayout]);
  }, []);

  const handleUndo = useCallback(() => {
    setLayoutHistory((currentHistory) => {
      const previousLayout = currentHistory.at(-1);

      if (!previousLayout) {
        return currentHistory;
      }

      setLayout(previousLayout);

      return currentHistory.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      if (event.key.toLowerCase() !== 'z' || event.shiftKey) {
        return;
      }

      event.preventDefault();
      handleUndo();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo]);

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
        }}
      >
        <Button
          variant="contained"
          color="inherit"
          onClick={handleUndo}
          disabled={layoutHistory.length === 0}
          sx={{
            borderRadius: 999,
            px: 2,
            boxShadow: '0px 4px 14px rgba(16, 24, 40, 0.10)',
            backgroundColor: '#ffffff',
          }}
        >
          Undo
        </Button>
      </Box>

      <DraggableGridContextWrapper
        layout={layout}
        onLayoutChanged={handleLayoutChanged}
        onLayoutCommitted={handleLayoutCommitted}
        columns={10}
        gap={16}
        // showGridlines={true}
        renderItem={(
          item: DraggableGridItem,
          _index: number,
          isDragging: boolean
        ) => {
          const foundItem = initialLayout.find((x) => x.id === item.id);

          return (
            <Card
              sx={{
                ...theme.customStyles.floatingCard,
                ...theme.customStyles.interactiveCard,
                height: '100%',
                opacity: isDragging ? 0.7 : 1,
                cursor: 'grab',
                display: 'flex',
              }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  textAlign: 'center',
                }}
              >
                <Typography fontWeight={600}>
                  {foundItem?.title} {foundItem?.minWidth}w -{' '}
                  {foundItem?.maxWidth}w / {foundItem?.minHeight}h -{' '}
                  {foundItem?.maxHeight}h ({item.width} x {item.height ?? 1})
                </Typography>
              </CardContent>
            </Card>
          );
        }}
      />
    </Box>
  );
}

export default App;

function haveSameLayout(
  first: DraggableGridItem[],
  second: DraggableGridItem[]
): boolean {
  return (
    first.length === second.length &&
    first.every((item, index) => {
      const candidate = second[index];

      return (
        item.id === candidate?.id &&
        item.width === candidate.width &&
        item.minWidth === candidate.minWidth &&
        item.maxWidth === candidate.maxWidth &&
        (item.height ?? 1) === (candidate.height ?? 1) &&
        (item.minHeight ?? 1) === (candidate.minHeight ?? 1) &&
        (item.maxHeight ?? (item.height ?? 1)) ===
          (candidate.maxHeight ?? (candidate.height ?? 1)) &&
        item.row === candidate.row &&
        item.column === candidate.column
      );
    })
  );
}
