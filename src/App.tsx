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
  { id: 'a', title: 'Overview 3-7', width: 1, minWidth: 3, maxWidth: 7 },
  { id: 'b', title: 'Alerts 5-5', width: 1, minWidth: 5, maxWidth: 5 },
  { id: 'c', title: 'Usage 2-7', width: 1, minWidth: 2, maxWidth: 7 },
  { id: 'd', title: 'Cost 1-11', width: 1, minWidth: 1, maxWidth: 11 },
  { id: 'e', title: 'Forecast 1-2', width: 1, minWidth: 1, maxWidth: 2 },
  { id: 'f', title: 'Settings 1-1', width: 1, minWidth: 1, maxWidth: 1 },
];

function App() {
  const theme = useTheme();
  const [layout, setLayout] = useState<Tile[]>(initialLayout);
  const [layoutHistory, setLayoutHistory] = useState<Tile[][]>([]);

  const handleLayoutChanged = useCallback((nextLayout: Tile[]) => {
    // Live grid updates change the current committed layout on screen, but they
    // do not automatically create undo history.
    setLayout(nextLayout);
  }, []);

  const handleLayoutCommitted = useCallback<
    NonNullable<DraggableGridProps<Tile>['onLayoutCommitted']>
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

      <DraggableGridContextWrapper<Tile>
        layout={layout}
        onLayoutChanged={handleLayoutChanged}
        onLayoutCommitted={handleLayoutCommitted}
        columns={10}
        gap={16}
        // showGridlines={true}
        renderItem={(item: Tile, _index: number, isDragging: boolean) => (
          <Card
            sx={{
              ...theme.customStyles.floatingCard,
              ...theme.customStyles.interactiveCard,
              height: 120,
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
                {item.title} ({item.width})
              </Typography>
            </CardContent>
          </Card>
        )}
      />
    </Box>
  );
}

export default App;

function haveSameLayout(first: Tile[], second: Tile[]): boolean {
  return (
    first.length === second.length &&
    first.every((item, index) => {
      const candidate = second[index];

      return (
        item.id === candidate?.id &&
        item.width === candidate.width &&
        item.minWidth === candidate.minWidth &&
        item.maxWidth === candidate.maxWidth &&
        item.row === candidate.row &&
        item.column === candidate.column &&
        item.title === candidate.title
      );
    })
  );
}
