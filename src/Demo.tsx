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
  DraggableGridChartPoint,
  DraggableGridChartType,
  DraggableGridItem,
  DraggableGridItemKind,
} from './drag-and-droppable-grid/types';

type AddItemOption = {
  id: DraggableGridItemKind;
  label: string;
  description: string;
  buildItem?: (
    nextItemNumber: number,
    currentLayout: DraggableGridItem[]
  ) => Omit<
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
    id: 'chart',
    label: 'Chart',
    description: 'Add a simple trend chart card.',
    buildItem: (nextItemNumber, currentLayout) =>
      buildRandomChartDashboardItem(currentLayout, nextItemNumber),
  },
  {
    id: 'filter',
    label: 'Filter',
    description: 'Add a URL-driven dropdown filter.',
    buildItem: (nextItemNumber) => ({
      kind: 'filter',
      title: `Filter ${nextItemNumber}`,
      filterParamName: 'region',
      filterOptions: ['North America', 'Europe', 'APAC'],
      filterValue: 'North America',
      width: 3,
      height: 1,
      minWidth: 2,
      minHeight: 1,
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

  const handleDeleteDashboardItem = useCallback(
    (itemId: string) => {
      if (!canEdit) {
        return;
      }

      setLayout((currentLayout) =>
        currentLayout.filter((item) => item.id !== itemId)
      );
      setSaveStatus(null);
    },
    [canEdit]
  );

  const appendDashboardItem = useCallback(
    (
      buildItem: (
        nextItemNumber: number,
        currentLayout: DraggableGridItem[]
      ) => Omit<
        DraggableGridItem,
        'id' | 'row' | 'column'
      >
    ) => {
      setLayout((currentLayout) => {
        const nextItemNumber = currentLayout.length + 1;
        const nextRow =
          currentLayout.length === 0
            ? 1
            : getRequiredRowCount(currentLayout) + 1;

        return [
          ...currentLayout,
          {
            id: createDemoGridItemId(),
            row: nextRow,
            column: 1,
            ...buildItem(nextItemNumber, currentLayout),
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
    setCanEdit(true);
    setActiveDashboardId(null);
    setActiveDashboardName(getNextDashboardName(savedDashboards));
    setLayout(emptyDashboardLayout);
    setSaveStatus('Started a new dashboard draft');
    handleCloseAddMenu();
  }, [handleCloseAddMenu, savedDashboards]);

  const handleDeleteDashboard = useCallback(() => {
    if (!activeDashboardId) {
      return;
    }

    const dashboardToDelete = savedDashboards.find(
      (dashboard) => dashboard.id === activeDashboardId
    );

    if (!dashboardToDelete) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${dashboardToDelete.name}"? This cannot be undone.`
    );

    if (!shouldDelete) {
      return;
    }

    const remainingDashboards = savedDashboards.filter(
      (dashboard) => dashboard.id !== activeDashboardId
    );
    const nextActiveDashboard = remainingDashboards[0] ?? null;

    try {
      persistDashboardStore(
        remainingDashboards,
        nextActiveDashboard?.id ?? null
      );
      setSavedDashboards(remainingDashboards);

      if (nextActiveDashboard) {
        setActiveDashboardId(nextActiveDashboard.id);
        setActiveDashboardName(nextActiveDashboard.name);
        setLayout(nextActiveDashboard.layout);
        setSaveStatus(
          `Deleted "${dashboardToDelete.name}" and loaded "${nextActiveDashboard.name}"`
        );
      } else {
        setActiveDashboardId(null);
        setActiveDashboardName(getNextDashboardName([]));
        setLayout(emptyDashboardLayout);
        setSaveStatus(`Deleted "${dashboardToDelete.name}"`);
      }

      handleCloseAddMenu();
    } catch {
      setSaveStatus('Could not delete dashboard');
    }
  }, [
    activeDashboardId,
    handleCloseAddMenu,
    persistDashboardStore,
    savedDashboards,
  ]);

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
            <Button
              variant="text"
              color="error"
              onClick={handleDeleteDashboard}
              disabled={!activeDashboardId}
              sx={dashboardToolbarButtonSx}
            >
              Delete
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
                onDeleteItem={handleDeleteDashboardItem}
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

function buildRandomChartDashboardItem(
  currentLayout: DraggableGridItem[],
  nextItemNumber: number
): Omit<DraggableGridItem, 'id' | 'row' | 'column'> {
  const chartType = getNextChartTypeForLayout(currentLayout);

  switch (chartType) {
    case 'line':
      return buildRandomLineChartDashboardItem();
    case 'scatter':
      return buildRandomScatterChartDashboardItem();
    case 'pie':
      return buildRandomPieChartDashboardItem();
    case 'column':
    default:
      return buildRandomColumnChartDashboardItem(nextItemNumber);
  }
}

function getNextChartTypeForLayout(
  currentLayout: DraggableGridItem[]
): DraggableGridChartType {
  const allChartTypes: DraggableGridChartType[] = [
    'line',
    'scatter',
    'pie',
    'column',
  ];
  const chartTypeCounts = allChartTypes.reduce<Record<DraggableGridChartType, number>>(
    (result, chartType) => ({
      ...result,
      [chartType]: 0,
    }),
    {
      line: 0,
      scatter: 0,
      pie: 0,
      column: 0,
    }
  );

  currentLayout.forEach((item) => {
    if (item.kind === 'chart' && item.chartType) {
      chartTypeCounts[item.chartType] += 1;
    }
  });

  const minimumCount = Math.min(...allChartTypes.map((chartType) => chartTypeCounts[chartType]));
  const leastUsedChartTypes = allChartTypes.filter(
    (chartType) => chartTypeCounts[chartType] === minimumCount
  );

  return getRandomItem(leastUsedChartTypes);
}

function buildRandomLineChartDashboardItem(): Omit<
  DraggableGridItem,
  'id' | 'row' | 'column'
> {
  const scenarios = [
    {
      title: 'Revenue trend',
      description: 'Monthly recurring revenue',
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      baseValues: [18200, 19400, 20350, 21750, 22600, 23900, 25400],
      trendSuffix: 'vs last month',
    },
    {
      title: 'Active users',
      description: 'Daily active users this week',
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      baseValues: [840, 878, 905, 932, 961, 1008, 1056],
      trendSuffix: 'week over week',
    },
    {
      title: 'Avg. response time',
      description: 'Median support response in minutes',
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
      baseValues: [46, 44, 42, 39, 37, 34],
      trendSuffix: 'vs prior period',
    },
  ] as const;
  const scenario = getRandomItem(scenarios);
  const values = varySeries(scenario.baseValues, 0.08);

  return {
    kind: 'chart',
    chartType: 'line',
    title: scenario.title,
    description: scenario.description,
    chartLabels: [...scenario.labels],
    chartValues: values,
    chartTrend: `${formatSignedPercent(getPercentChange(values.at(-1) ?? 0, values.at(-2) ?? 0))} ${scenario.trendSuffix}`,
    width: 4,
    height: 3,
    minWidth: 3,
    minHeight: 2,
  };
}

function buildRandomColumnChartDashboardItem(
  nextItemNumber: number
): Omit<DraggableGridItem, 'id' | 'row' | 'column'> {
  const scenarios = [
    {
      title: 'Bookings by region',
      description: 'Quarter-to-date sales distribution',
      labels: ['NA', 'EMEA', 'APAC', 'LATAM'],
      baseValues: [126, 94, 71, 39],
      topLabelSuffix: 'leads current bookings',
    },
    {
      title: 'Tickets by queue',
      description: 'Open support work this morning',
      labels: ['Billing', 'Onboard', 'Reliability', 'Security'],
      baseValues: [34, 22, 17, 9],
      topLabelSuffix: 'is the busiest queue',
    },
    {
      title: 'Feature adoption',
      description: 'Usage by customer segment',
      labels: ['Starter', 'Growth', 'Pro', 'Enterprise'],
      baseValues: [41, 58, 74, 67],
      topLabelSuffix: 'customers lead adoption',
    },
  ] as const;
  const scenario = getRandomItem(scenarios);
  const values = varySeries(scenario.baseValues, 0.12);
  const topIndex = getIndexOfLargestValue(values);

  return {
    kind: 'chart',
    chartType: 'column',
    title: scenario.title || `Chart ${nextItemNumber}`,
    description: scenario.description,
    chartLabels: [...scenario.labels],
    chartValues: values,
    chartTrend: `${scenario.labels[topIndex]} ${scenario.topLabelSuffix}`,
    width: 4,
    height: 3,
    minWidth: 3,
    minHeight: 2,
  };
}

function buildRandomPieChartDashboardItem(): Omit<
  DraggableGridItem,
  'id' | 'row' | 'column'
> {
  const scenarios = [
    {
      title: 'Traffic sources',
      description: 'Share of sessions this week',
      labels: ['Organic', 'Paid', 'Direct', 'Referral'],
      baseValues: [42, 24, 19, 15],
    },
    {
      title: 'Users by plan',
      description: 'Active accounts by subscription',
      labels: ['Free', 'Team', 'Business', 'Enterprise'],
      baseValues: [49, 27, 16, 8],
    },
    {
      title: 'Incidents by severity',
      description: 'Closed incidents this month',
      labels: ['Low', 'Medium', 'High', 'Critical'],
      baseValues: [53, 26, 14, 7],
    },
  ] as const;
  const scenario = getRandomItem(scenarios);
  const values = rebalanceToHundred(varySeries(scenario.baseValues, 0.14));
  const topIndex = getIndexOfLargestValue(values);

  return {
    kind: 'chart',
    chartType: 'pie',
    title: scenario.title,
    description: scenario.description,
    chartLabels: [...scenario.labels],
    chartValues: values,
    chartTrend: `${scenario.labels[topIndex]} accounts for ${values[topIndex]}% of the mix`,
    width: 3,
    height: 4,
    minWidth: 2,
    minHeight: 4,
  };
}

function buildRandomScatterChartDashboardItem(): Omit<
  DraggableGridItem,
  'id' | 'row' | 'column'
> {
  const scenarios = [
    {
      title: 'Lead score vs deal size',
      description: 'Qualified opportunities this month',
      trend: 'Higher scoring leads are closing larger deals',
      points: buildCorrelatedScatterPoints({
        count: 14,
        xMin: 28,
        xMax: 96,
        yBase: 18,
        ySlope: 1.08,
        yNoise: 14,
      }),
    },
    {
      title: 'Spend vs signups',
      description: 'Campaign cohorts over the last 30 days',
      trend: 'Higher spend cohorts trend toward more signups',
      points: buildCorrelatedScatterPoints({
        count: 14,
        xMin: 4,
        xMax: 48,
        yBase: 26,
        ySlope: 5.2,
        yNoise: 18,
      }),
    },
    {
      title: 'Traffic vs latency',
      description: 'API edge load sampled hourly',
      trend: 'Heavier traffic clusters at higher latency',
      points: buildCorrelatedScatterPoints({
        count: 16,
        xMin: 120,
        xMax: 930,
        yBase: 82,
        ySlope: 0.11,
        yNoise: 16,
      }),
    },
  ] as const;
  const scenario = getRandomItem(scenarios);

  return {
    kind: 'chart',
    chartType: 'scatter',
    title: scenario.title,
    description: scenario.description,
    chartTrend: scenario.trend,
    chartPoints: scenario.points,
    width: 4,
    height: 3,
    minWidth: 3,
    minHeight: 3,
  };
}

function buildCorrelatedScatterPoints(args: {
  count: number;
  xMin: number;
  xMax: number;
  yBase: number;
  ySlope: number;
  yNoise: number;
}): DraggableGridChartPoint[] {
  const { count, xMin, xMax, yBase, ySlope, yNoise } = args;
  const step = (xMax - xMin) / Math.max(count - 1, 1);

  return Array.from({ length: count }, (_, index) => {
    const x = Math.round(xMin + step * index + randomBetween(-step * 0.18, step * 0.18));
    const y = Math.max(
      4,
      Math.round(yBase + index * ySlope * step + randomBetween(-yNoise, yNoise))
    );

    return { x, y };
  }).sort((left, right) => left.x - right.x);
}

function varySeries(values: readonly number[], variance: number): number[] {
  return values.map((value) =>
    Math.max(1, Math.round(value * (1 + randomBetween(-variance, variance))))
  );
}

function rebalanceToHundred(values: readonly number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);

  if (total <= 0) {
    return [25, 25, 25, 25];
  }

  const scaledValues = values.map((value) => Math.max(1, Math.round((value / total) * 100)));
  const adjustedValues = [...scaledValues];
  let difference = 100 - adjustedValues.reduce((sum, value) => sum + value, 0);

  while (difference !== 0) {
    const index = difference > 0 ? getIndexOfSmallestValue(adjustedValues) : getIndexOfLargestValue(adjustedValues);

    adjustedValues[index] += difference > 0 ? 1 : -1;
    difference += difference > 0 ? -1 : 1;
  }

  return adjustedValues;
}

function getPercentChange(currentValue: number, previousValue: number): number {
  if (previousValue === 0) {
    return 0;
  }

  return ((currentValue - previousValue) / previousValue) * 100;
}

function formatSignedPercent(value: number): string {
  const roundedValue = Math.round(value);
  const prefix = roundedValue > 0 ? '+' : '';

  return `${prefix}${roundedValue}%`;
}

function getIndexOfLargestValue(values: readonly number[]): number {
  return values.reduce((bestIndex, value, index, allValues) =>
    value > allValues[bestIndex] ? index : bestIndex,
  0);
}

function getIndexOfSmallestValue(values: readonly number[]): number {
  return values.reduce((bestIndex, value, index, allValues) =>
    value < allValues[bestIndex] ? index : bestIndex,
  0);
}

function randomBetween(minValue: number, maxValue: number): number {
  return minValue + Math.random() * (maxValue - minValue);
}

function getRandomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

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
