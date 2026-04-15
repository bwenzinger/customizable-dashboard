import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import type { DraggableGridItem } from './drag-and-droppable-grid/types';

type DashboardCardProps = {
  item: DraggableGridItem;
  isDragging: boolean;
  isResizing: boolean;
};

export function DashboardCard(
  props: DashboardCardProps
): React.JSX.Element {
  const { item, isDragging, isResizing } = props;
  const theme = useTheme();
  const interactiveCardSx = getInteractiveCardSx(theme, isResizing);
  const itemWidth = item.width ?? 1;
  const itemHeight = item.height ?? 1;
  const isSingleRowCard = itemHeight === 1;
  const isTitleOnlyCard = isSingleRowCard && itemWidth <= 2;
  const shouldShowCurrentChip = !isTitleOnlyCard;
  const shouldShowMaxChip = !isSingleRowCard;
  const useCompactChipLayout = isSingleRowCard || itemWidth === 1;

  if (item.imageSrc) {
    return (
      <Card
        sx={{
          ...theme.customStyles.floatingCard,
          height: '100%',
          opacity: isDragging ? 0.7 : 1,
          cursor: 'grab',
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
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
          justifyContent: isTitleOnlyCard ? 'center' : 'space-between',
          flex: 1,
          minWidth: 0,
          gap: isTitleOnlyCard ? 1 : 1.5,
          p: `${isTitleOnlyCard ? 12 : 14}px !important`,
        }}
      >
        <Typography
          sx={{
            color: 'text.primary',
            fontSize: isTitleOnlyCard
              ? '0.92rem'
              : 'clamp(0.95rem, 0.2vw + 0.9rem, 1.08rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
            overflowWrap: 'anywhere',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: isTitleOnlyCard ? 4 : isSingleRowCard ? 2 : 3,
            overflow: 'hidden',
            textAlign: isTitleOnlyCard ? 'center' : 'left',
          }}
        >
          {item.title}
        </Typography>

        {shouldShowCurrentChip || shouldShowMaxChip ? (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.75,
              alignItems: 'flex-start',
            }}
          >
            {shouldShowMaxChip ? (
              <DashboardCardChip
                label="Max"
                value={`${formatCardSizeLimit(item.maxWidth)} x ${formatCardSizeLimit(item.maxHeight)}`}
                compact={useCompactChipLayout}
              />
            ) : null}
            {shouldShowCurrentChip ? (
              <DashboardCardChip
                label="Current"
                value={`${itemWidth} x ${itemHeight}`}
                compact={useCompactChipLayout}
              />
            ) : null}
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}

type DashboardCardChipProps = {
  label: string;
  value: string;
  compact?: boolean;
};

function DashboardCardChip({
  label,
  value,
  compact = false,
}: DashboardCardChipProps) {
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

function formatCardSizeLimit(limit?: number) {
  return limit === undefined ? '∞' : `${Math.max(1, limit)}`;
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
