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
                  objectFit: 'contain',
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
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  textAlign: 'center',
                }}
              >
                <Typography fontWeight={600}>
                  {item.title} {item.minWidth}w - {item.maxWidth}w /{' '}
                  {item.minHeight}h - {item.maxHeight}h ({item.width} x{' '}
                  {item.height ?? 1})
                </Typography>
              </CardContent>
            </Card>
          );
        }}
      />
    </Box>
  );
}

export default App;

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
