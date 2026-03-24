import { useState } from 'react';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';

import {
  DraggableGrid,
  type DraggableGridItem,
} from './drag-and-droppable-grid/DraggableGrid';

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

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        boxSizing: 'border-box',
      }}
    >
      <DraggableGrid<Tile>
        layout={layout}
        onLayoutChanged={setLayout}
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
