import { useCallback, useState } from 'react';
import { Box } from '@mui/material';
import { DashboardCard } from './ExampleDashboardCard';
import { DraggableGridContextWrapper } from './drag-and-droppable-grid/DraggableGridContextWrapper';
import type { DraggableGridItem } from './drag-and-droppable-grid/types';

const initialLayout: DraggableGridItem[] = [
  {
    id: 'a',
    title: 'Overview',
    width: 1,
    height: 1,
  },
  {
    id: 'b',
    title: 'Alerts',
    width: 1,
    height: 1,
  },
  {
    id: 'c',
    title: 'Usage',
    width: 1,
    height: 1,
  },
  {
    id: 'd',
    title: 'Cost',
    width: 3,
    height: 3,
  },
  {
    id: 'e',
    title: 'Forecast',
    width: 1,
    height: 1,
  },
  {
    id: 'f',
    title: 'Settings',
    width: 1,
    height: 1,
  },
  {
    id: 'g',
    title: 'Max Size',
    width: 1,
    minWidth: 1,
    maxWidth: 5,
    height: 1,
    minHeight: 1,
    maxHeight: 5,
  },
];

function App() {
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
          isDragging: boolean,
          isResizing: boolean
        ) => (
          <DashboardCard
            item={item}
            isDragging={isDragging}
            isResizing={isResizing}
          />
        )}
      />
    </Box>
  );
}

export default App;
