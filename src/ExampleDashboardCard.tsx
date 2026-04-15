import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  useTheme,
} from '@mui/material';
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
  const itemKind = item.kind ?? 'card';
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

  if (itemKind !== 'card') {
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
            gap: isTitleOnlyCard ? 1 : 1.25,
            p: `${isTitleOnlyCard ? 12 : 14}px !important`,
          }}
        >
          <DashboardWidgetHeader
            title={item.title}
            itemKind={itemKind}
            isTitleOnlyCard={isTitleOnlyCard}
          />

          {!isTitleOnlyCard ? (
            <DashboardWidgetBody item={item} isSingleRowCard={isSingleRowCard} />
          ) : null}
        </CardContent>
      </Card>
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

type DashboardWidgetHeaderProps = {
  title?: string;
  itemKind: NonNullable<DraggableGridItem['kind']>;
  isTitleOnlyCard: boolean;
};

function DashboardWidgetHeader({
  title,
  itemKind,
  isTitleOnlyCard,
}: DashboardWidgetHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isTitleOnlyCard ? 'column' : 'row',
        alignItems: isTitleOnlyCard ? 'center' : 'flex-start',
        gap: 1,
        minWidth: 0,
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 26,
          height: 26,
          borderRadius: 1.5,
          bgcolor: getWidgetAccentColor(itemKind).background,
          color: getWidgetAccentColor(itemKind).text,
          display: 'grid',
          flexShrink: 0,
          fontSize: '0.76rem',
          fontWeight: 800,
          lineHeight: 1,
          placeItems: 'center',
        }}
      >
        {getWidgetInitial(itemKind)}
      </Box>
      <Typography
        sx={{
          color: 'text.primary',
          fontSize: isTitleOnlyCard
            ? '0.92rem'
            : 'clamp(0.95rem, 0.2vw + 0.9rem, 1.08rem)',
          fontWeight: 700,
          lineHeight: 1.15,
          minWidth: 0,
          overflow: 'hidden',
          overflowWrap: 'anywhere',
          textAlign: isTitleOnlyCard ? 'center' : 'left',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: isTitleOnlyCard ? 4 : 2,
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}

type DashboardWidgetBodyProps = {
  item: DraggableGridItem;
  isSingleRowCard: boolean;
};

function DashboardWidgetBody({
  item,
  isSingleRowCard,
}: DashboardWidgetBodyProps) {
  if (item.kind === 'button') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: isSingleRowCard ? 'row' : 'column',
          gap: 1,
          minWidth: 0,
          alignItems: isSingleRowCard ? 'center' : 'stretch',
        }}
      >
        {item.description ? (
          <WidgetSupportingText clamp={isSingleRowCard ? 1 : 3}>
            {item.description}
          </WidgetSupportingText>
        ) : null}
        <Button
          variant="contained"
          size="small"
          tabIndex={-1}
          sx={{
            alignSelf: isSingleRowCard ? 'flex-end' : 'flex-start',
            borderRadius: 1.5,
            boxShadow: 'none',
            flexShrink: 0,
            fontSize: '0.72rem',
            fontWeight: 800,
            px: 1.25,
            textTransform: 'none',
          }}
        >
          {item.actionLabel ?? 'Open'}
        </Button>
      </Box>
    );
  }

  if (item.kind === 'richText') {
    return (
      <Box
        sx={{
          borderLeft: '3px solid rgba(37, 99, 235, 0.45)',
          pl: 1.25,
          minWidth: 0,
        }}
      >
        <WidgetSupportingText clamp={isSingleRowCard ? 1 : 5}>
          {item.body}
        </WidgetSupportingText>
      </Box>
    );
  }

  if (item.kind === 'metric') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
          minWidth: 0,
        }}
      >
        <Typography
          sx={{
            color: 'text.secondary',
            fontSize: '0.68rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          {item.metricLabel ?? 'Value'}
        </Typography>
        <Typography
          sx={{
            color: 'text.primary',
            fontSize: 'clamp(1.35rem, 0.5vw + 1.1rem, 1.85rem)',
            fontWeight: 800,
            lineHeight: 1,
            overflowWrap: 'anywhere',
          }}
        >
          {item.metricValue}
        </Typography>
        {item.metricTrend ? (
          <Typography
            sx={{
              color: 'success.main',
              fontSize: '0.76rem',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {item.metricTrend}
          </Typography>
        ) : null}
      </Box>
    );
  }

  return item.description ? (
    <WidgetSupportingText clamp={isSingleRowCard ? 1 : 3}>
      {item.description}
    </WidgetSupportingText>
  ) : null;
}

type WidgetSupportingTextProps = {
  children?: string;
  clamp: number;
};

function WidgetSupportingText({ children, clamp }: WidgetSupportingTextProps) {
  return (
    <Typography
      sx={{
        color: 'text.secondary',
        display: '-webkit-box',
        fontSize: '0.78rem',
        fontWeight: 600,
        lineHeight: 1.35,
        minWidth: 0,
        overflow: 'hidden',
        overflowWrap: 'anywhere',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: clamp,
      }}
    >
      {children}
    </Typography>
  );
}

function getWidgetInitial(kind: NonNullable<DraggableGridItem['kind']>) {
  const labels: Record<NonNullable<DraggableGridItem['kind']>, string> = {
    button: 'B',
    card: 'C',
    image: 'I',
    metric: 'M',
    richText: 'T',
  };

  return labels[kind];
}

function getWidgetAccentColor(kind: NonNullable<DraggableGridItem['kind']>) {
  const colors: Record<
    NonNullable<DraggableGridItem['kind']>,
    { background: string; text: string }
  > = {
    button: {
      background: 'rgba(37, 99, 235, 0.10)',
      text: '#1d4ed8',
    },
    card: {
      background: 'rgba(15, 23, 42, 0.08)',
      text: '#334155',
    },
    image: {
      background: 'rgba(244, 114, 182, 0.14)',
      text: '#be185d',
    },
    metric: {
      background: 'rgba(22, 163, 74, 0.12)',
      text: '#15803d',
    },
    richText: {
      background: 'rgba(99, 102, 241, 0.12)',
      text: '#4338ca',
    },
  };

  return colors[kind];
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
