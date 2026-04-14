import { useCallback, useState } from 'react';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import type { Theme } from '@mui/material/styles';

import { DraggableGridContextWrapper } from './drag-and-droppable-grid/DraggableGridContextWrapper';
import type { DraggableGridItem } from './drag-and-droppable-grid/types';

const initialLayout: DraggableGridItem[] = [
  {
    id: 'a',
    title: 'Overview',
    width: 1,
    minWidth: 3,
    maxWidth: 7,
    height: 1,
    minHeight: 1,
    maxHeight: 4,
  },
  {
    id: 'b',
    title: 'Alerts',
    width: 1,
    minWidth: 5,
    maxWidth: 5,
    height: 1,
    minHeight: 1,
    maxHeight: 3,
  },
  {
    id: 'c',
    title: 'Usage',
    width: 1,
    minWidth: 2,
    maxWidth: 7,
    height: 1,
    minHeight: 1,
    maxHeight: 4,
  },
  {
    id: 'd',
    title: 'Cost',
    width: 1,
    minWidth: 1,
    maxWidth: 11,
    height: 1,
    minHeight: 1,
    maxHeight: 5,
  },
  {
    id: 'e',
    title: 'Forecast',
    width: 1,
    minWidth: 1,
    maxWidth: 5,
    height: 1,
    minHeight: 1,
    maxHeight: 4,
  },
  {
    id: 'f',
    title: 'Settings',
    width: 1,
    minWidth: 1,
    maxWidth: 7,
    height: 1,
    minHeight: 1,
    maxHeight: 4,
  },
];

function App() {
  const theme = useTheme();
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
        ) => {
          const interactiveCardSx = getInteractiveCardSx(theme, isResizing);
          const itemHeight = item.height ?? 1;
          const maxHeight = item.maxHeight ?? itemHeight;
          const isCompactCard = item.width === 1 && itemHeight === 1;
          const isNarrowCard = item.width === 1;

          if (item.imageSrc) {
            return (
              <Card
                sx={{
                  ...theme.customStyles.floatingCard,
                  // ...interactiveCardSx,
                  height: '100%',
                  opacity: isDragging ? 0.7 : 1,
                  cursor: 'grab',
                  display: 'flex',
                  overflow: 'hidden',
                  position: 'relative',
                  // backgroundColor: '#111827',
                  width: '100%',
                  objectFit: 'cover',
                  userSelect: 'none',
                  alignItems: 'stretch',
                  justifyContent: 'stretch',
                }}
                component="img"
                src={item.imageSrc}
                alt={item.title ?? 'Dropped image'}
                draggable={false}
              ></Card>
            );
          }

          return (
            <Card
              className="draggable-grid-hover-sync"
              sx={{
                ...theme.customStyles.floatingCard,
                ...interactiveCardSx,
                height: '100%',
                opacity: isDragging ? 0.7 : 1,
                cursor: 'grab',
                display: 'flex',
              }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: isCompactCard ? 'center' : 'space-between',
                  flex: 1,
                  minWidth: 0,
                  gap: isCompactCard ? 1 : 1.5,
                  p: `${isCompactCard ? 12 : 14}px !important`,
                }}
              >
                <Typography
                  sx={{
                    color: 'text.primary',
                    fontSize: isCompactCard
                      ? '0.92rem'
                      : 'clamp(0.95rem, 0.2vw + 0.9rem, 1.08rem)',
                    fontWeight: 700,
                    lineHeight: 1.15,
                    letterSpacing: '-0.01em',
                    overflowWrap: 'anywhere',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: isCompactCard ? 2 : 3,
                    overflow: 'hidden',
                  }}
                >
                  {item.title}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.75,
                    alignItems: 'flex-start',
                    mt: isCompactCard ? 'auto' : 0,
                  }}
                >
                  <DashboardCardChip
                    label="Max"
                    value={`${item.maxWidth} x ${maxHeight}`}
                    compact={isCompactCard || isNarrowCard}
                  />
                  <DashboardCardChip
                    label="Current"
                    value={`${item.width} x ${itemHeight}`}
                    compact={isCompactCard || isNarrowCard}
                  />
                </Box>
              </CardContent>
            </Card>
          );
        }}
      />
    </Box>
  );
}

export default App;

type DashboardCardMetricProps = {
  label: string;
  value: string;
  compact?: boolean;
};

function DashboardCardChip({
  label,
  value,
  compact = false,
}: DashboardCardMetricProps) {
  return (
    <Box
      sx={{
        minWidth: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 0.5 : 0.65,
        maxWidth: '100%',
        borderRadius: 999,
        border: '1px solid rgba(15, 23, 42, 0.08)',
        bgcolor: 'rgba(15, 23, 42, 0.05)',
        px: compact ? 0.85 : 1,
        py: compact ? 0.55 : 0.65,
      }}
    >
      <Typography
        sx={{
          color: 'text.secondary',
          flexShrink: 0,
          fontSize: compact ? '0.58rem' : '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: 'text.primary',
          fontFamily:
            '"SFMono-Regular", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
          fontSize: compact ? '0.76rem' : '0.82rem',
          fontWeight: 700,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          overflowWrap: 'anywhere',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function getInteractiveCardSx(theme: Theme, isResizing: boolean) {
  if (!isResizing) {
    return theme.customStyles.interactiveCard;
  }

  const interactiveCardStyles = theme.customStyles.interactiveCard as Record<
    string,
    unknown
  >;
  const hoverStyles = interactiveCardStyles[':hover'];

  return {
    ...interactiveCardStyles,
    ':hover': {
      ...(typeof hoverStyles === 'object' && hoverStyles !== null
        ? hoverStyles
        : {}),
      transform: 'none',
    },
  };
}
