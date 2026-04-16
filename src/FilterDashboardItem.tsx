import {
  useMemo,
  useSyncExternalStore,
  type ChangeEvent,
} from 'react';
import { Box, Typography } from '@mui/material';
import type { DraggableGridItem } from './drag-and-droppable-grid/types';

const urlParamsChangedEventName = 'demo-dashboard-url-params-changed';

type FilterDashboardItemProps = {
  item: DraggableGridItem;
  canEdit: boolean;
  isSingleRowCard: boolean;
  onItemChanged?: (
    itemId: string,
    updates: Partial<Omit<DraggableGridItem, 'id'>>
  ) => void;
};

export function FilterDashboardItem({
  item,
  canEdit,
  isSingleRowCard,
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
  const optionsText = filterOptions.join(', ');
  const selectedValue = getResolvedFilterValue(
    filterParamName,
    filterOptions,
    item.filterValue,
    urlSearch
  );

  const handleNameChanged = (event: ChangeEvent<HTMLInputElement>) => {
    onItemChanged?.(item.id, {
      title: event.currentTarget.value,
    });
  };

  const handleParamNameChanged = (event: ChangeEvent<HTMLInputElement>) => {
    onItemChanged?.(item.id, {
      filterParamName: event.currentTarget.value,
    });
  };

  const handleOptionsChanged = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const nextOptionsText = event.currentTarget.value;
    const nextOptions = getNormalizedFilterOptions(
      nextOptionsText.split(/[\n,]/g)
    );
    const nextSelectedValue = getResolvedFilterValue(
      filterParamName,
      nextOptions,
      selectedValue || item.filterValue,
      urlSearch
    );
    const currentUrlValue = getUrlParamValue(filterParamName, urlSearch);

    onItemChanged?.(item.id, {
      filterOptions: nextOptions,
      filterValue: nextSelectedValue,
    });

    if (
      filterParamName &&
      currentUrlValue !== null &&
      currentUrlValue !== nextSelectedValue
    ) {
      writeUrlParamValue(filterParamName, nextSelectedValue);
    }
  };

  const handleFilterValueChanged = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const nextValue = event.currentTarget.value;

    writeUrlParamValue(filterParamName, nextValue);
    onItemChanged?.(item.id, {
      filterValue: nextValue,
    });
  };

  const selectValue =
    selectedValue && filterOptions.includes(selectedValue)
      ? selectedValue
      : filterOptions[0] ?? '';

  return (
    <Box
      sx={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: isSingleRowCard ? 0.85 : 1,
        minHeight: 0,
        minWidth: 0,
      }}
    >
      {canEdit ? (
        <Box
          sx={{
            display: 'grid',
            gap: 0.85,
            gridTemplateColumns: isSingleRowCard
              ? '1fr'
              : 'repeat(2, minmax(0, 1fr))',
            minWidth: 0,
          }}
        >
          <FilterField label="Name">
            <FilterTextInput
              aria-label="Filter name"
              value={item.title ?? ''}
              onChange={handleNameChanged}
              placeholder="Region filter"
            />
          </FilterField>
          <FilterField label="URL Param">
            <FilterTextInput
              aria-label="Filter URL parameter"
              value={item.filterParamName ?? ''}
              onChange={handleParamNameChanged}
              placeholder="region"
            />
          </FilterField>
          <Box sx={{ gridColumn: '1 / -1', minWidth: 0 }}>
            <FilterField label="Options">
              <FilterTextArea
                aria-label="Filter options"
                value={optionsText}
                onChange={handleOptionsChanged}
                placeholder="North America, Europe, APAC"
                rows={isSingleRowCard ? 1 : 2}
              />
            </FilterField>
          </Box>
        </Box>
      ) : (
        <Typography
          sx={{
            color: 'text.secondary',
            fontSize: '0.74rem',
            fontWeight: 700,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {filterParamName
            ? ``
            : 'No URL parameter configured'}
        </Typography>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.45,
          minWidth: 0,
        }}
      >
        <Typography
          sx={{
            color: 'text.secondary',
            fontSize: '0.64rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          Filter Value
        </Typography>
        <FilterSelectInput
          aria-label="Filter value"
          value={selectValue}
          onChange={handleFilterValueChanged}
          disabled={filterOptions.length === 0}
        >
          {filterOptions.length === 0 ? (
            <option value="">Add options first</option>
          ) : (
            filterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))
          )}
        </FilterSelectInput>
      </Box>
    </Box>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.35,
        minWidth: 0,
      }}
    >
      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: '0.62rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function FilterTextInput(
  props: React.ComponentProps<'input'>
): React.JSX.Element {
  return (
    <Box
      component="input"
      data-draggable-grid-no-drag="true"
      spellCheck={false}
      {...props}
      sx={filterInputSx}
    />
  );
}

function FilterTextArea(
  props: React.ComponentProps<'textarea'>
): React.JSX.Element {
  return (
    <Box
      component="textarea"
      data-draggable-grid-no-drag="true"
      spellCheck={false}
      {...props}
      sx={{
        ...filterInputSx,
        resize: 'vertical',
        minHeight: 54,
        py: 0.9,
        whiteSpace: 'pre-wrap',
      }}
    />
  );
}

function FilterSelectInput(
  props: React.ComponentProps<'select'>
): React.JSX.Element {
  return (
    <Box
      component="select"
      data-draggable-grid-no-drag="true"
      {...props}
      sx={{
        ...filterInputSx,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        pr: 4,
      }}
    />
  );
}

const filterInputSx = {
  width: '100%',
  minWidth: 0,
  border: '1px solid rgba(15, 23, 42, 0.12)',
  borderRadius: 1.5,
  backgroundColor: '#ffffff',
  color: 'text.primary',
  fontSize: '0.78rem',
  fontWeight: 600,
  lineHeight: 1.4,
  outline: 'none',
  boxSizing: 'border-box',
  px: 1.1,
  py: 0.75,
  fontFamily: 'inherit',
  '&:focus': {
    borderColor: 'rgba(37, 99, 235, 0.34)',
    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.10)',
  },
  '&:disabled': {
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    color: 'text.secondary',
  },
} as const;

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

  if (persistedValue && options.includes(persistedValue)) {
    return persistedValue;
  }

  return options[0] ?? '';
}

function getUrlParamValue(paramName: string, search = getUrlSearchSnapshot()): string | null {
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
