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
  { id: 'a', title: 'Overview' },
  { id: 'b', title: 'Alerts' },
  { id: 'c', title: 'Usage' },
  { id: 'd', title: 'Cost' },
  { id: 'e', title: 'Forecast' },
  { id: 'f', title: 'Settings' },
];

function App() {
  const theme = useTheme();
  const [layout, setLayout] = useState<Tile[]>(initialLayout);

  return (
    <Box sx={{ p: 6 }}>
      <DraggableGrid<Tile>
        layout={layout}
        onLayoutChanged={setLayout}
        columns={3}
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
              <Typography fontWeight={600}>{item.title}</Typography>
            </CardContent>
          </Card>
        )}
      />
    </Box>
  );
}

export default App;
