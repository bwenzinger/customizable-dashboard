import { useCallback, useState } from 'react';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';

import { DraggableGridContextWrapper } from './drag-and-droppable-grid/DraggableGridContextWrapper';
import type { DraggableGridItem } from './drag-and-droppable-grid/types';

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

  const handleLayoutChanged = useCallback((nextLayout: DraggableGridItem[]) => {
    setLayout(nextLayout);
  }, []);

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <DraggableGridContextWrapper
        layout={layout}
        onLayoutChanged={handleLayoutChanged}
        enableUndo={true}
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
