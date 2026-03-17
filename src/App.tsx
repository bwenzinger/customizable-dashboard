import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  DragGrid,
  type DragGridLayoutItem,
} from './drag-and-droppable-grid/DragGrid';
import { useState } from 'react';

interface DemoGridItem extends DragGridLayoutItem {
  label: string;
}

const initialLayout: DemoGridItem[] = Array.from({ length: 6 }, (_, index) => ({
  id: String(index + 1),
  label: String(index + 1),
}));

function App() {
  const theme = useTheme();

  const [layout, setLayout] = useState<DemoGridItem[]>(initialLayout);

  return (
    <DragGrid
      layout={layout}
      onLayoutChanged={setLayout}
      renderItem={(item) => item.label}
    />
  );

  return (
    // Use a Box with padding to see the background color
    <Box sx={{ p: 6 }}>
      <Stack spacing={3}>
        <Card sx={{ ...theme.customStyles.floatingCard }} draggable={true}>
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Floating Card (Default)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This card has an elevation of 3, set as a default in our theme.
            </Typography>
          </CardContent>
        </Card>

        {/* For a card with a border instead, use variant="outlined" */}
        <Card
          sx={{
            backgroundColor: 'green',
            ...theme.customStyles.floatingCard,
            ...theme.customStyles.interactiveCard,
          }}
        >
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Outlined Card
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This card uses a border instead of a shadow for a flatter design.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

export default App;
