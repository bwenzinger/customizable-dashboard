import { useCallback, useState } from 'react';
import { Box, Button } from '@mui/material';
import { DashboardCard } from './ExampleDashboardCard';
import { DraggableGridContextWrapper } from './drag-and-droppable-grid/DraggableGridContextWrapper';
import { getRequiredRowCount } from './drag-and-droppable-grid/gridMath';
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
  const handleAddItem = useCallback(() => {
    setLayout((currentLayout) => {
      const nextItemNumber =
        currentLayout.filter((item) => item.imageSrc === undefined).length + 1;

      return [
        ...currentLayout,
        {
          id: createDemoGridItemId(),
          title: `Card ${nextItemNumber}`,
          width: 1,
          height: 1,
          row: getRequiredRowCount(currentLayout) + 1,
          column: 1,
        },
      ];
    });
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
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddItem}
          sx={{
            borderRadius: 999,
            px: 2,
            boxShadow: '0px 4px 14px rgba(16, 24, 40, 0.10)',
          }}
        >
          Add Item
        </Button>
      </Box>

      <DraggableGridContextWrapper
        layout={layout}
        onLayoutChanged={handleLayoutChanged}
        enableUndo={true}
        enableCollapse={true}
        enableOptimize={true}
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

function createDemoGridItemId(): string {
  const randomId = globalThis.crypto?.randomUUID?.();

  if (randomId) {
    return `demo-item-${randomId}`;
  }

  return `demo-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
