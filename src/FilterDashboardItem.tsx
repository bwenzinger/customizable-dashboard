import {
  type SyntheticEvent,
  useMemo,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
} from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import {
  getUrlParamValue,
  getUrlSearchSnapshot,
  subscribeToUrlParamChanges,
  writeRenamedUrlParamValue,
  writeUrlParamValue,
} from './dashboardUrlParams';
import type { DraggableGridItem } from './drag-and-droppable-grid/types';

type FilterDashboardItemProps = {
  item: DraggableGridItem;
  isSingleRowCard: boolean;
  isEditorOpen: boolean;
  onEditorClose: () => void;
  onItemChanged?: (
    itemId: string,
    updates: Partial<Omit<DraggableGridItem, 'id'>>
  ) => void;
};

export function FilterDashboardItem({
  item,
  isSingleRowCard,
  isEditorOpen,
  onEditorClose,
  onItemChanged,
}: FilterDashboardItemProps): React.JSX.Element {
  const filterParamName = item.filterParamName?.trim() ?? '';
  const filterOptions = useMemo(
    () => getNormalizedFilterOptions(item.filterOptions),
    [item.filterOptions]
  );
  const urlSearch = useSyncExternalStore(
    subscribeToUrlParamChanges,
    getUrlSearchSnapshot,
    () => ''
  );
  const selectedValue = getResolvedFilterValue(
    filterParamName,
    filterOptions,
    item.filterValue,
    urlSearch
  );
  const selectValue =
    selectedValue && filterOptions.includes(selectedValue)
      ? selectedValue
      : null;

  const handleFilterValueChanged = (
    _event: SyntheticEvent,
    nextValue: string | null
  ) => {
    const resolvedNextValue = nextValue ?? '';

    writeUrlParamValue(filterParamName, resolvedNextValue);
    onItemChanged?.(item.id, {
      filterValue: resolvedNextValue || undefined,
    });
  };

  return (
    <>
      <Stack
        sx={{
          flex: 1,
          justifyContent: 'center',
          gap: isSingleRowCard ? 0.75 : 0.85,
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <FilterNoDragBox sx={{ minWidth: 0 }}>
          <Stack
            sx={{
              minWidth: 0,
            }}
          >
            <Autocomplete
              fullWidth
              options={filterOptions}
              value={selectValue}
              onChange={handleFilterValueChanged}
              disabled={filterOptions.length === 0}
              clearOnEscape
              size="small"
              noOptionsText={
                filterOptions.length === 0 ? 'Configure options' : 'No matches'
              }
              slotProps={{
                popper: {
                  sx: {
                    zIndex: 1600,
                  },
                },
              }}
              sx={{
                minWidth: 0,
                '& .MuiAutocomplete-inputRoot': {
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Value"
                  variant="outlined"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  placeholder={
                    filterOptions.length === 0 ? 'Configure options' : undefined
                  }
                />
              )}
            />
          </Stack>
        </FilterNoDragBox>
      </Stack>

      {isEditorOpen ? (
        <FilterEditorDialog
          key={`${item.id}:${item.title ?? ''}:${item.filterParamName ?? ''}:${filterOptions.join('|')}`}
          item={item}
          filterOptions={filterOptions}
          currentFilterParamName={filterParamName}
          selectedValue={selectedValue || item.filterValue}
          onClose={onEditorClose}
          onItemChanged={onItemChanged}
        />
      ) : null}
    </>
  );
}

function FilterNoDragBox({
  children,
  sx,
}: {
  children: React.ReactNode;
  sx?: Record<string, unknown>;
}) {
  return (
    <Box data-draggable-grid-no-drag="true" sx={sx}>
      {children}
    </Box>
  );
}

type FilterEditorDialogProps = {
  item: DraggableGridItem;
  filterOptions: string[];
  currentFilterParamName: string;
  selectedValue?: string;
  onClose: () => void;
  onItemChanged?: (
    itemId: string,
    updates: Partial<Omit<DraggableGridItem, 'id'>>
  ) => void;
};

type FilterEditorDraft = {
  filterParamName: string;
  filterOptionsText: string;
};

function FilterEditorDialog({
  item,
  filterOptions,
  currentFilterParamName,
  selectedValue,
  onClose,
  onItemChanged,
}: FilterEditorDialogProps) {
  const [editorDraft, setEditorDraft] = useState<FilterEditorDraft>(() =>
    createFilterEditorDraft(item, filterOptions)
  );

  const handleEditorFieldChanged = (
    field: keyof FilterEditorDraft,
    value: string
  ) => {
    setEditorDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  };

  const handleSaveEditor = () => {
    const nextParamName = editorDraft.filterParamName.trim();
    const nextOptions = getNormalizedFilterOptions(
      editorDraft.filterOptionsText.split(/[\n,]/g)
    );
    const nextSelectedValue = getPreferredFilterValue(
      nextOptions,
      selectedValue
    );

    onItemChanged?.(item.id, {
      filterParamName: nextParamName,
      filterOptions: nextOptions,
      filterValue: nextSelectedValue,
    });

    writeRenamedUrlParamValue(
      currentFilterParamName,
      nextParamName,
      nextSelectedValue
    );
    onClose();
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 7,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>Edit Filter</DialogTitle>
      <DialogContent
        sx={{
          display: 'grid',
          gap: 2,
          pt: 0.5,
        }}
      >
        <DialogContentText sx={{ color: 'text.secondary' }}>
          Configure the URL search parameter this filter controls and the list
          of allowed values.
        </DialogContentText>

        <FilterNoDragBox>
          <TextField
            fullWidth
            autoFocus
            label="URL Parameter"
            placeholder="region"
            value={editorDraft.filterParamName}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              handleEditorFieldChanged(
                'filterParamName',
                event.currentTarget.value
              );
            }}
            helperText="This becomes the key in the browser URL, like ?region=South."
          />
        </FilterNoDragBox>

        <FilterNoDragBox>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Filter Options"
            placeholder="All regions, Northeast, Midwest, South, West"
            value={editorDraft.filterOptionsText}
            onChange={(
              event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) => {
              handleEditorFieldChanged(
                'filterOptionsText',
                event.currentTarget.value
              );
            }}
            helperText="Separate values with commas or new lines."
          />
        </FilterNoDragBox>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSaveEditor} variant="contained">
          Save Filter
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function createFilterEditorDraft(
  item: DraggableGridItem,
  filterOptions: string[]
): FilterEditorDraft {
  return {
    filterParamName: item.filterParamName ?? '',
    filterOptionsText: filterOptions.join(', '),
  };
}

function getNormalizedFilterOptions(values?: string[]): string[] {
  if (!values) {
    return [];
  }

  const seen = new Set<string>();

  return values.reduce<string[]>((result, value) => {
    const normalizedValue = value.trim();
    const normalizedKey = normalizedValue.toLowerCase();

    if (!normalizedValue || seen.has(normalizedKey)) {
      return result;
    }

    seen.add(normalizedKey);
    result.push(normalizedValue);

    return result;
  }, []);
}

function getResolvedFilterValue(
  paramName: string,
  options: string[],
  persistedValue?: string,
  search = getUrlSearchSnapshot()
): string {
  const urlValue = getUrlParamValue(paramName, search);

  if (urlValue && options.includes(urlValue)) {
    return urlValue;
  }

  return getPreferredFilterValue(options, persistedValue);
}

function getPreferredFilterValue(
  options: string[],
  preferredValue?: string
): string {
  if (preferredValue && options.includes(preferredValue)) {
    return preferredValue;
  }

  return '';
}
