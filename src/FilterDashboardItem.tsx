import {
  useMemo,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
} from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import type { DraggableGridItem } from './drag-and-droppable-grid/types';

const urlParamsChangedEventName = 'demo-dashboard-url-params-changed';

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
      : filterOptions[0] ?? '';

  const handleFilterValueChanged = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const nextValue = event.target.value;

    writeUrlParamValue(filterParamName, nextValue);
    onItemChanged?.(item.id, {
      filterValue: nextValue,
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
          <TextField
            select
            fullWidth
            size="small"
            label="Value"
            value={selectValue}
            onChange={handleFilterValueChanged}
            disabled={filterOptions.length === 0}
            variant="outlined"
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            sx={{
              '& .MuiInputBase-root': {
                borderRadius: 3,
                bgcolor: 'background.paper',
              },
            }}
          >
            {filterOptions.length === 0 ? (
              <MenuItem value="">Configure options</MenuItem>
            ) : (
              filterOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))
            )}
          </TextField>
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
            helperText="This becomes the key in the browser URL, like ?region=APAC."
          />
        </FilterNoDragBox>

        <FilterNoDragBox>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Filter Options"
            placeholder="North America, Europe, APAC"
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

  return options[0] ?? '';
}

function getUrlParamValue(
  paramName: string,
  search = getUrlSearchSnapshot()
): string | null {
  if (!paramName) {
    return null;
  }

  return new URLSearchParams(search).get(paramName);
}

function writeUrlParamValue(paramName: string, value: string) {
  if (!paramName) {
    return;
  }

  const nextUrl = new URL(window.location.href);

  if (value) {
    nextUrl.searchParams.set(paramName, value);
  } else {
    nextUrl.searchParams.delete(paramName);
  }

  commitUrlChange(nextUrl);
}

function writeRenamedUrlParamValue(
  previousParamName: string,
  nextParamName: string,
  nextValue: string
) {
  if (!previousParamName && !nextParamName) {
    return;
  }

  const nextUrl = new URL(window.location.href);

  if (previousParamName && previousParamName !== nextParamName) {
    nextUrl.searchParams.delete(previousParamName);
  }

  if (nextParamName) {
    if (nextValue) {
      nextUrl.searchParams.set(nextParamName, nextValue);
    } else {
      nextUrl.searchParams.delete(nextParamName);
    }
  } else if (previousParamName) {
    nextUrl.searchParams.delete(previousParamName);
  }

  commitUrlChange(nextUrl);
}

function commitUrlChange(nextUrl: URL) {
  window.history.replaceState(
    window.history.state,
    '',
    `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
  );
  // `replaceState` does not emit `popstate`, so filter cards notify each other
  // explicitly when one of them changes the shared URL params.
  window.dispatchEvent(new Event(urlParamsChangedEventName));
}

function subscribeToUrlParamChanges(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange);
  window.addEventListener(urlParamsChangedEventName, onStoreChange);

  return () => {
    window.removeEventListener('popstate', onStoreChange);
    window.removeEventListener(urlParamsChangedEventName, onStoreChange);
  };
}

function getUrlSearchSnapshot() {
  return window.location.search;
}
