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
  { id: 'a', title: 'Overview', width: 1, minWidth: 3, maxWidth: 7 },
  { id: 'b', title: 'Alerts', width: 1, minWidth: 3, maxWidth: 7 },
  { id: 'c', title: 'Usage', width: 1, minWidth: 3, maxWidth: 7 },
  { id: 'd', title: 'Cost', width: 1, minWidth: 3, maxWidth: 7 },
  { id: 'e', title: 'Forecast', width: 1, minWidth: 3, maxWidth: 7 },
  { id: 'f', title: 'Settings', width: 1, minWidth: 3, maxWidth: 7 },
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
