import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from 'react';
import { Box, Button, ListItemText, Menu, MenuItem } from '@mui/material';
import { DashboardCard } from './ExampleDashboardCard';
import { DraggableGridContextWrapper } from './drag-and-droppable-grid/DraggableGridContextWrapper';
import { getRequiredRowCount } from './drag-and-droppable-grid/gridMath';
import type {
  DraggableGridItem,
  DraggableGridItemKind,
} from './drag-and-droppable-grid/types';

type AddItemOption = {
  id: DraggableGridItemKind;
  label: string;
  description: string;
  buildItem?: (nextItemNumber: number) => Omit<
    DraggableGridItem,
    'id' | 'row' | 'column'
  >;
};

const addItemOptions: AddItemOption[] = [
  {
    id: 'card',
    label: 'Basic Card',
    description: 'Add a compact blank dashboard card.',
    buildItem: (nextItemNumber) => ({
      kind: 'card',
      title: `Card ${nextItemNumber}`,
      width: 1,
      height: 1,
    }),
  },
  {
    id: 'button',
    label: 'Button',
    description: 'Add a quick action tile.',
    buildItem: (nextItemNumber) => ({
      kind: 'button',
      title: `Quick Action ${nextItemNumber}`,
      description: 'Trigger a workflow or open an important destination.',
      actionLabel: 'Run Action',
      width: 3,
      height: 1,
    }),
  },
  {
    id: 'richText',
    label: 'Rich Text',
    description: 'Add notes, context, or instructions.',
    buildItem: (nextItemNumber) => ({
      kind: 'richText',
      title: `Notes ${nextItemNumber}`,
      body: 'Use this space for announcements, handoff notes, or dashboard context.',
      width: 3,
      height: 2,
    }),
  },
  {
    id: 'image',
    label: 'Image Upload',
    description: 'Add an image from your computer.',
  },
  {
    id: 'metric',
    label: 'Metric',
    description: 'Add a focused KPI card.',
    buildItem: (nextItemNumber) => ({
      kind: 'metric',
      title: `Metric ${nextItemNumber}`,
      metricLabel: 'Current value',
      metricValue: '42%',
      metricTrend: '+8% this week',
      width: 2,
      height: 2,
    }),
  },
];

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
  const [addMenuAnchor, setAddMenuAnchor] = useState<HTMLElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const isAddMenuOpen = Boolean(addMenuAnchor);

  const handleLayoutChanged = useCallback((nextLayout: DraggableGridItem[]) => {
    setLayout(nextLayout);
  }, []);

  const appendDashboardItem = useCallback(
    (
      buildItem: (nextItemNumber: number) => Omit<
        DraggableGridItem,
        'id' | 'row' | 'column'
      >
    ) => {
      setLayout((currentLayout) => {
        const nextItemNumber = currentLayout.length + 1;

        return [
          ...currentLayout,
          {
            id: createDemoGridItemId(),
            row: getRequiredRowCount(currentLayout) + 1,
            column: 1,
            ...buildItem(nextItemNumber),
          },
        ];
      });
    },
    []
  );

  const handleOpenAddMenu = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setAddMenuAnchor(event.currentTarget);
  }, []);

  const handleCloseAddMenu = useCallback(() => {
    setAddMenuAnchor(null);
  }, []);

  const handleAddItemOption = useCallback(
    (option: AddItemOption) => {
      handleCloseAddMenu();

      if (option.id === 'image') {
        imageInputRef.current?.click();
        return;
      }

      if (option.buildItem) {
        appendDashboardItem(option.buildItem);
      }
    },
    [appendDashboardItem, handleCloseAddMenu]
  );

  const handleImageFileSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.currentTarget.files?.[0];

      event.currentTarget.value = '';

      if (!selectedFile) {
        return;
      }

      const fileReader = new FileReader();

      fileReader.addEventListener('load', () => {
        if (typeof fileReader.result !== 'string') {
          return;
        }

        appendDashboardItem((nextItemNumber) => ({
          kind: 'image',
          title: selectedFile.name || `Image ${nextItemNumber}`,
          imageSrc: fileReader.result as string,
          width: 3,
          height: 2,
        }));
      });

      fileReader.readAsDataURL(selectedFile);
    },
    [appendDashboardItem]
  );

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
          id="add-dashboard-item-button"
          variant="contained"
          color="primary"
          onClick={handleOpenAddMenu}
          aria-controls={isAddMenuOpen ? 'add-dashboard-item-menu' : undefined}
          aria-expanded={isAddMenuOpen ? 'true' : undefined}
          aria-haspopup="menu"
          sx={{
            borderRadius: 999,
            px: 2,
            boxShadow: '0px 4px 14px rgba(16, 24, 40, 0.10)',
          }}
        >
          Add Item
        </Button>
        <Menu
          id="add-dashboard-item-menu"
          anchorEl={addMenuAnchor}
          open={isAddMenuOpen}
          onClose={handleCloseAddMenu}
          MenuListProps={{
            'aria-labelledby': 'add-dashboard-item-button',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              width: 280,
              borderRadius: 2,
              boxShadow:
                '0px 8px 24px rgba(16, 24, 40, 0.14),0px 2px 6px rgba(16, 24, 40, 0.08)',
            },
          }}
        >
          {addItemOptions.map((option) => (
            <MenuItem
              key={option.id}
              onClick={() => {
                handleAddItemOption(option);
              }}
              sx={{
                alignItems: 'flex-start',
                gap: 1.5,
                py: 1.35,
              }}
            >
              <TemplateOptionIcon label={option.label} />
              <ListItemText
                primary={option.label}
                secondary={option.description}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                }}
                secondaryTypographyProps={{
                  fontSize: '0.76rem',
                  lineHeight: 1.25,
                }}
              />
            </MenuItem>
          ))}
        </Menu>
        <Box
          component="input"
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFileSelected}
          sx={{
            display: 'none',
          }}
        />
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

function TemplateOptionIcon({ label }: { label: string }) {
  return (
    <Box
      aria-hidden
      sx={{
        mt: 0.25,
        width: 30,
        height: 30,
        borderRadius: 1.5,
        bgcolor: 'rgba(37, 99, 235, 0.10)',
        color: '#1d4ed8',
        display: 'grid',
        flexShrink: 0,
        fontSize: '0.78rem',
        fontWeight: 800,
        lineHeight: 1,
        placeItems: 'center',
      }}
    >
      {label.slice(0, 1)}
    </Box>
  );
}

function createDemoGridItemId(): string {
  const randomId = globalThis.crypto?.randomUUID?.();

  if (randomId) {
    return `demo-item-${randomId}`;
  }

  return `demo-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
