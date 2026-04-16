import {
  useCallback,
  useEffect,
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
  Typography,
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

type DemoSavedDashboard = {
  id: string;
  name: string;
  layout: DraggableGridItem[];
  updatedAt: string;
};

type DemoDashboardStore = {
  dashboards: DemoSavedDashboard[];
  activeDashboardId: string | null;
};

type DemoDashboardBootstrapState = {
  dashboards: DemoSavedDashboard[];
  activeDashboardId: string | null;
  activeDashboardName: string;
  activeLayout: DraggableGridItem[];
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

const demoDashboardStoreStorageKey =
  'customizable-dashboard.demo.dashboards';
const dashboardToolbarFieldSx = {
  height: 40,
  border: '1px solid rgba(15, 23, 42, 0.12)',
  borderRadius: 2,
  bgcolor: '#ffffff',
  color: 'text.primary',
  fontSize: '0.82rem',
  fontWeight: 700,
  outline: 'none',
  px: 1.5,
};
const dashboardToolbarButtonSx = {
  borderRadius: 2,
  px: 1.75,
  boxShadow: 'none',
  minHeight: 40,
  textTransform: 'none',
};

const emptyDashboardLayout: DraggableGridItem[] = [];

function App() {
  const [initialDashboardState] = useState<DemoDashboardBootstrapState>(
    getSavedDemoDashboardState
  );
  const [savedDashboards, setSavedDashboards] = useState<DemoSavedDashboard[]>(
    initialDashboardState.dashboards
  );
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(
    initialDashboardState.activeDashboardId
  );
  const [activeDashboardName, setActiveDashboardName] = useState<string>(
    initialDashboardState.activeDashboardName
  );
  const [layout, setLayout] = useState<DraggableGridItem[]>(
    initialDashboardState.activeLayout
  );
  const [canEdit, setCanEdit] = useState(true);
  const [addMenuAnchor, setAddMenuAnchor] = useState<HTMLElement | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const isAddMenuOpen = Boolean(addMenuAnchor);

  const handleLayoutChanged = useCallback((nextLayout: DraggableGridItem[]) => {
    setLayout(nextLayout);
    setSaveStatus(null);
  }, []);

  useEffect(() => {
    if (!saveStatus) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveStatus(null);
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [saveStatus]);

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
      setSaveStatus(null);
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
      setSaveStatus(null);
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

  const persistDashboardStore = useCallback(
    (
      nextDashboards: DemoSavedDashboard[],
      nextActiveDashboardId: string | null
    ) => {
      localStorage.setItem(
        demoDashboardStoreStorageKey,
        JSON.stringify({
          dashboards: nextDashboards,
          activeDashboardId: nextActiveDashboardId,
        } satisfies DemoDashboardStore)
      );
    },
    []
  );

  const handleActiveDashboardNameChanged = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setActiveDashboardName(event.currentTarget.value);
      setSaveStatus(null);
    },
    []
  );

  const handleDashboardSelectionChanged = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextDashboardId = event.currentTarget.value || null;

      if (!nextDashboardId) {
        return;
      }

      const selectedDashboard = savedDashboards.find(
        (dashboard) => dashboard.id === nextDashboardId
      );

      if (!selectedDashboard) {
        return;
      }

      setActiveDashboardId(selectedDashboard.id);
      setActiveDashboardName(selectedDashboard.name);
      setLayout(selectedDashboard.layout);
      setSaveStatus(`Loaded "${selectedDashboard.name}"`);
      handleCloseAddMenu();
    },
    [handleCloseAddMenu, savedDashboards]
  );

  const handleNewDashboard = useCallback(() => {
    setActiveDashboardId(null);
    setActiveDashboardName(getNextDashboardName(savedDashboards));
    setLayout(emptyDashboardLayout);
    setSaveStatus('Started a new dashboard draft');
    handleCloseAddMenu();
  }, [handleCloseAddMenu, savedDashboards]);

  const handleSaveLayout = useCallback(() => {
    const resolvedDashboardName = getUniqueDashboardName(
      activeDashboardName,
      savedDashboards,
      activeDashboardId
    );
    const updatedAt = new Date().toISOString();

    try {
      if (!activeDashboardId) {
        const nextDashboard: DemoSavedDashboard = {
          id: createDemoDashboardId(),
          name: resolvedDashboardName,
          layout,
          updatedAt,
        };
        const nextDashboards = [...savedDashboards, nextDashboard];

        persistDashboardStore(nextDashboards, nextDashboard.id);
        setSavedDashboards(nextDashboards);
        setActiveDashboardId(nextDashboard.id);
        setActiveDashboardName(nextDashboard.name);
        setSaveStatus(`Saved "${nextDashboard.name}"`);
        return;
      }

      const nextDashboards = savedDashboards.map((dashboard) =>
        dashboard.id === activeDashboardId
          ? {
              ...dashboard,
              name: resolvedDashboardName,
              layout,
              updatedAt,
            }
          : dashboard
      );

      persistDashboardStore(nextDashboards, activeDashboardId);
      setSavedDashboards(nextDashboards);
      setActiveDashboardName(resolvedDashboardName);
      setSaveStatus(`Updated "${resolvedDashboardName}"`);
    } catch {
      setSaveStatus('Could not save dashboards');
    }
  }, [
    activeDashboardId,
    activeDashboardName,
    layout,
    persistDashboardStore,
    savedDashboards,
  ]);

  const handleSaveLayoutAsCopy = useCallback(() => {
    const copiedDashboardName = getUniqueDashboardName(
      activeDashboardName || 'Dashboard copy',
      savedDashboards
    );
    const nextDashboard: DemoSavedDashboard = {
      id: createDemoDashboardId(),
      name: copiedDashboardName,
      layout,
      updatedAt: new Date().toISOString(),
    };

    try {
      const nextDashboards = [...savedDashboards, nextDashboard];

      persistDashboardStore(nextDashboards, nextDashboard.id);
      setSavedDashboards(nextDashboards);
      setActiveDashboardId(nextDashboard.id);
      setActiveDashboardName(nextDashboard.name);
      setSaveStatus(`Created "${nextDashboard.name}"`);
    } catch {
      setSaveStatus('Could not save dashboard copy');
    }
  }, [activeDashboardName, layout, persistDashboardStore, savedDashboards]);

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
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          px: { xs: 2, md: 3 },
          py: 1.5,
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          bgcolor: '#ffffff',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
              minWidth: 0,
            }}
          >
            <Typography
              sx={{
                color: 'text.primary',
                fontSize: '1rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                mr: 0.5,
              }}
            >
              Dashboards
            </Typography>
            <Box
              component="select"
              aria-label="Saved dashboards"
              value={activeDashboardId ?? ''}
              onChange={handleDashboardSelectionChanged}
              sx={{
                ...dashboardToolbarFieldSx,
                minWidth: { xs: 160, md: 190 },
                cursor: 'pointer',
              }}
            >
              <option value="" disabled>
                Unsaved Draft
              </option>
              {savedDashboards.map((dashboard) => (
                <option key={dashboard.id} value={dashboard.id}>
                  {dashboard.name}
                </option>
              ))}
            </Box>
            <Box
              component="input"
              aria-label="Dashboard name"
              value={activeDashboardName}
              onChange={handleActiveDashboardNameChanged}
              placeholder="Dashboard name"
              sx={{
                ...dashboardToolbarFieldSx,
                minWidth: { xs: 180, md: 220 },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSaveLayout}
              sx={dashboardToolbarButtonSx}
            >
              Save
            </Button>
            <Button
              variant="text"
              color="inherit"
              onClick={handleSaveLayoutAsCopy}
              sx={dashboardToolbarButtonSx}
            >
              Save As
            </Button>
            <Button
              variant="text"
              color="inherit"
              onClick={handleNewDashboard}
              sx={dashboardToolbarButtonSx}
            >
              New
            </Button>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              gap: 1,
            }}
          >
            {saveStatus ? (
              <Typography
                aria-live="polite"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  px: 0.5,
                }}
              >
                {saveStatus}
              </Typography>
            ) : null}
            <Button
              id="add-dashboard-item-button"
              variant="outlined"
              color="inherit"
              onClick={handleOpenAddMenu}
              disabled={!canEdit}
              aria-controls={isAddMenuOpen ? 'add-dashboard-item-menu' : undefined}
              aria-expanded={isAddMenuOpen ? 'true' : undefined}
              aria-haspopup="menu"
              sx={dashboardToolbarButtonSx}
            >
              Add Item
            </Button>
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
                m: 0,
                '& .MuiFormControlLabel-label': {
                  color: 'text.secondary',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                },
              }}
            />
          </Box>
        </Box>
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
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          // px: { xs: 2, md: 3 },
          // py: { xs: 2, md: 3 },
        }}
      >
        <Box
          sx={{
            height: '100%',
            minHeight: 0,
            // borderRadius: 3,
            p: 0,
            // border: '1px solid rgba(15, 23, 42, 0.08)',
            // bgcolor: '#ffffff',
            // boxShadow: '0px 8px 24px rgba(15, 23, 42, 0.06)',
            // p: { xs: 1, sm: 1.5, md: 2 },
            overflow: 'hidden',
          }}
        >
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
      </Box>
    </Box>
  );
}

export default App;

function getSavedDemoDashboardState(): DemoDashboardBootstrapState {
  const defaultDashboardName = getNextDashboardName([]);
  const fallbackState = {
    dashboards: [],
    activeDashboardId: null,
    activeDashboardName: defaultDashboardName,
    activeLayout: emptyDashboardLayout,
  } satisfies DemoDashboardBootstrapState;

  try {
    const savedDashboardStore = localStorage.getItem(
      demoDashboardStoreStorageKey
    );

    if (savedDashboardStore) {
      const parsedStore = JSON.parse(savedDashboardStore);

      if (isValidSavedDemoDashboardStore(parsedStore)) {
        const activeDashboard =
          parsedStore.dashboards.find(
            (dashboard) => dashboard.id === parsedStore.activeDashboardId
          ) ?? parsedStore.dashboards[0];

        return {
          dashboards: parsedStore.dashboards,
          activeDashboardId: activeDashboard?.id ?? null,
          activeDashboardName:
            activeDashboard?.name ?? defaultDashboardName,
          activeLayout: activeDashboard?.layout ?? emptyDashboardLayout,
        };
      }
    }
  } catch {
    return fallbackState;
  }

  return fallbackState;
}

function isValidSavedDemoDashboard(
  value: unknown
): value is DemoSavedDashboard {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'layout' in value &&
    isValidDemoDashboardLayout(value.layout) &&
    'updatedAt' in value &&
    typeof value.updatedAt === 'string'
  );
}

function isValidDemoDashboardLayout(value: unknown): value is DraggableGridItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        typeof item.id === 'string'
    )
  );
}

function isValidSavedDemoDashboardStore(
  value: unknown
): value is DemoDashboardStore {
  return (
    typeof value === 'object' &&
    value !== null &&
    'dashboards' in value &&
    Array.isArray(value.dashboards) &&
    value.dashboards.every(isValidSavedDemoDashboard) &&
    'activeDashboardId' in value &&
    (typeof value.activeDashboardId === 'string' ||
      value.activeDashboardId === null)
  );
}

function getNextDashboardName(savedDashboards: DemoSavedDashboard[]): string {
  return getUniqueDashboardName(
    `Dashboard ${savedDashboards.length + 1}`,
    savedDashboards
  );
}

function getUniqueDashboardName(
  baseName: string,
  savedDashboards: DemoSavedDashboard[],
  excludedDashboardId?: string | null
): string {
  const normalizedBaseName = baseName.trim() || 'Untitled Dashboard';
  let resolvedName = normalizedBaseName;
  let suffix = 2;

  while (
    savedDashboards.some(
      (dashboard) =>
        dashboard.id !== excludedDashboardId &&
        dashboard.name.toLowerCase() === resolvedName.toLowerCase()
    )
  ) {
    resolvedName = `${normalizedBaseName} ${suffix}`;
    suffix += 1;
  }

  return resolvedName;
}

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

function createDemoDashboardId(): string {
  const randomId = globalThis.crypto?.randomUUID?.();

  if (randomId) {
    return `demo-dashboard-${randomId}`;
  }

  return `demo-dashboard-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
