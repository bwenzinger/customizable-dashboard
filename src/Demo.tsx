import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from 'react';
import {
  Box,
  Button,
  FormControlLabel,
  ListItemText,
  Menu,
  MenuItem,
  Switch,
} from '@mui/material';
import { ExampleDashboardCard } from './ExampleDashboardCard';
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
      body: '<p><strong>Use this space</strong> for announcements, handoff notes, or dashboard context.</p>',
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
  const [canEdit, setCanEdit] = useState(true);
  const [addMenuAnchor, setAddMenuAnchor] = useState<HTMLElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const isAddMenuOpen = Boolean(addMenuAnchor);

  const handleLayoutChanged = useCallback((nextLayout: DraggableGridItem[]) => {
    setLayout(nextLayout);
  }, []);

  const handleDashboardItemChanged = useCallback(
    (
      itemId: string,
      updates: Partial<Omit<DraggableGridItem, 'id'>>
    ) => {
      if (!canEdit) {
        return;
      }

      setLayout((currentLayout) =>
        currentLayout.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      );
    },
    [canEdit]
  );

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
    if (!canEdit) {
      return;
    }

    setAddMenuAnchor(event.currentTarget);
  }, [canEdit]);

  const handleCloseAddMenu = useCallback(() => {
    setAddMenuAnchor(null);
  }, []);

  const handleEditModeChanged = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextCanEdit = event.target.checked;

      setCanEdit(nextCanEdit);

      if (!nextCanEdit) {
        handleCloseAddMenu();
      }
    },
    [handleCloseAddMenu]
  );

  const handleAddItemOption = useCallback(
    (option: AddItemOption) => {
      if (!canEdit) {
        return;
      }

      handleCloseAddMenu();

      if (option.id === 'image') {
        imageInputRef.current?.click();
        return;
      }

      if (option.buildItem) {
        appendDashboardItem(option.buildItem);
      }
    },
    [appendDashboardItem, canEdit, handleCloseAddMenu]
  );

  const handleImageFileSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.currentTarget.files?.[0];

      event.currentTarget.value = '';

      if (!canEdit || !selectedFile) {
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
    [appendDashboardItem, canEdit]
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
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={canEdit}
              onChange={handleEditModeChanged}
              color="primary"
            />
          }
          label={canEdit ? 'Editing' : 'Viewing'}
          sx={{
            borderRadius: 999,
            bgcolor: '#ffffff',
            boxShadow: '0px 4px 14px rgba(16, 24, 40, 0.10)',
            m: 0,
            pl: 1.25,
            pr: 1.6,
            py: 0.25,
            '& .MuiFormControlLabel-label': {
              color: 'text.primary',
              fontSize: '0.84rem',
              fontWeight: 800,
            },
          }}
        />

        <Button
          id="add-dashboard-item-button"
          variant="contained"
          color="primary"
          onClick={handleOpenAddMenu}
          disabled={!canEdit}
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
          open={canEdit && isAddMenuOpen}
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
          disabled={!canEdit}
          onChange={handleImageFileSelected}
          sx={{
            display: 'none',
          }}
        />
      </Box>

      <DraggableGridContextWrapper
        layout={layout}
        onLayoutChanged={handleLayoutChanged}
        canEdit={canEdit}
        enableUndo={true}
        enableCollapse={true}
        enableOptimize={true}
        columns={10}
        gap={16}
        showGridlines={false}
        renderItem={(
          item: DraggableGridItem,
          _index: number,
          isDragging: boolean,
          isResizing: boolean
        ) => (
          <ExampleDashboardCard
            item={item}
            isDragging={isDragging}
            isResizing={isResizing}
            canEdit={canEdit}
            onItemChanged={handleDashboardItemChanged}
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
