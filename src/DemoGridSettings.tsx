import {
  Box,
  Button,
  FormControlLabel,
  Slider,
  Switch,
  Typography,
} from '@mui/material';
import {
  getDemoGridColumns,
  type DemoGridSettingsValues,
} from './demoGridSettingsConfig';

type DemoGridSettingsProps = {
  canEdit: boolean;
  values: DemoGridSettingsValues;
  onChange: (values: DemoGridSettingsValues) => void;
  onReset: () => void;
};

const numericControls = [
  { key: 'columns', label: 'Columns', min: 1, max: 12, step: 1, unit: '' },
  {
    key: 'rowHeight',
    label: 'Row height',
    min: 50,
    max: 150,
    step: 5,
    unit: 'px',
  },
  { key: 'gap', label: 'Card spacing', min: 0, max: 32, step: 2, unit: 'px' },
  {
    key: 'animationMs',
    label: 'Animation duration',
    min: 0,
    max: 800,
    step: 20,
    unit: 'ms',
  },
  {
    key: 'resizeHandleWidth',
    label: 'Resize handle size',
    min: 12,
    max: 40,
    step: 2,
    unit: 'px',
  },
  {
    key: 'minRowCount',
    label: 'Minimum rows',
    min: 1,
    max: 12,
    step: 1,
    unit: '',
  },
] as const;

const toggleControls = [
  { key: 'responsiveColumns', label: 'Responsive columns' },
  { key: 'showGridlines', label: 'Show gridlines' },
  { key: 'enableUndo', label: 'Undo' },
  { key: 'enableCollapse', label: 'Collapse' },
  { key: 'enableOptimize', label: 'Optimize' },
] as const;

export function DemoGridSettings({
  canEdit,
  values,
  onChange,
  onReset,
}: DemoGridSettingsProps) {
  const { columns, responsiveColumns, ...publicProps } = values;
  const propsPreview = {
    canEdit,
    columns: getDemoGridColumns({ columns, responsiveColumns }),
    ...publicProps,
  };

  return (
    <Box sx={{ p: 4, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
          mb: 4,
        }}
      >
        <Box>
          <Typography component="h3" sx={{ fontSize: 15, fontWeight: 700 }}>
            Customize the grid
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 12, mt: 1 }}>
            Changes apply live. Fewer columns may rearrange or shrink cards.
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={onReset}
          sx={{ textTransform: 'none', flexShrink: 0 }}
        >
          Reset settings
        </Button>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
          },
          columnGap: 8,
          rowGap: 3,
        }}
      >
        {numericControls.map(({ key, label, min, max, step, unit }) => (
          <Box key={key} sx={{ minWidth: 0, px: 1 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
            >
              <Typography
                id={`grid-setting-${key}-label`}
                sx={{ fontSize: 13 }}
              >
                {label}
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {values[key]}
                {unit ? ` ${unit}` : ''}
              </Typography>
            </Box>
            <Slider
              name={key}
              aria-labelledby={`grid-setting-${key}-label`}
              getAriaValueText={(value) => `${value}${unit ? ` ${unit}` : ''}`}
              value={values[key]}
              min={min}
              max={max}
              step={step}
              size="small"
              onChange={(_event, value) => {
                if (typeof value === 'number')
                  onChange({ ...values, [key]: value });
              }}
            />
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          columnGap: 4,
          rowGap: 1,
          mt: 1,
        }}
      >
        {toggleControls.map(({ key, label }) => (
          <FormControlLabel
            key={key}
            sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: 13 } }}
            label={label}
            control={
              <Switch
                size="small"
                checked={values[key]}
                onChange={(_event, checked) =>
                  onChange({ ...values, [key]: checked })
                }
              />
            }
          />
        ))}
      </Box>
      {values.responsiveColumns ? (
        <Typography color="text.secondary" sx={{ fontSize: 12, mt: 2 }}>
          Up to 2 columns on phones, 4 on small screens, 8 on medium screens,
          and {values.columns} on large screens. Try resizing your browser.
        </Typography>
      ) : null}
      <Typography color="text.secondary" sx={{ fontSize: 12, mt: 2 }}>
        Reset restores settings, not card positions. Resize handles have a
        minimum 24 px hit area. Layout tools are available in Editing mode.
      </Typography>
      <Box component="details" sx={{ mt: 3 }}>
        <Box
          component="summary"
          sx={{ cursor: 'pointer', color: 'primary.main', fontSize: 12 }}
        >
          View current props
        </Box>
        <Box
          component="pre"
          sx={{
            m: 0,
            mt: 2,
            p: 3,
            bgcolor: 'action.hover',
            borderRadius: 2,
            fontSize: 12,
            overflowX: 'auto',
          }}
        >
          <code>{`<DraggableGrid\n${Object.entries(propsPreview)
            .map(([key, value]) => `  ${key}={${JSON.stringify(value)}}`)
            .join(
              '\n'
            )}\n  ref={gridRef}\n  layout={layout}\n  onLayoutChanged={setLayout}\n  renderItem={renderItem}\n/>`}</code>
        </Box>
      </Box>
    </Box>
  );
}
