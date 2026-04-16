import { useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  Box,
  ButtonBase,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import { useResolvedDemoElectricityChart } from './demoElectricityData';
import type {
  DraggableGridChartPoint,
  DraggableGridChartType,
  DraggableGridItem,
} from './drag-and-droppable-grid/types';
import { FilterDashboardItem } from './FilterDashboardItem';
import { RichTextDashboardItem } from './RichTextDashboardItem';

type DashboardCardProps = {
  item: DraggableGridItem;
  isDragging: boolean;
  isResizing: boolean;
  canEdit: boolean;
  onDeleteItem?: (itemId: string) => void;
  onItemChanged?: (
    itemId: string,
    updates: Partial<Omit<DraggableGridItem, 'id'>>
  ) => void;
};

export function ExampleDashboardCard(
  props: DashboardCardProps
): React.JSX.Element {
  const { item, isDragging, isResizing, canEdit, onDeleteItem, onItemChanged } =
    props;
  const [isFilterEditorOpen, setIsFilterEditorOpen] = useState(false);
  const theme = useTheme();
  const itemKind = item.kind ?? 'card';
  const interactiveCardSx = getInteractiveCardSx(theme, isResizing);
  const editableCardChromeSx = canEdit
    ? getEditableCardChromeSx(theme)
    : {};
  const editableImageCardSx = canEdit
    ? {
        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
        boxShadow: `0px 1px 2px rgba(16, 24, 40, 0.04), 0px 4px 12px rgba(16, 24, 40, 0.06), inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.06)}`,
      }
    : {};
  const itemWidth = item.width ?? 1;
  const itemHeight = item.height ?? 1;
  const isSingleRowCard = itemHeight === 1;
  const shouldKeepCompactWidgetBodyVisible =
    itemKind === 'filter' && itemWidth > 1;
  const isTitleOnlyCard =
    isSingleRowCard && itemWidth <= 2 && !shouldKeepCompactWidgetBodyVisible;
  const shouldShowCurrentChip = !isTitleOnlyCard;
  const shouldShowMaxChip = !isSingleRowCard;
  const useCompactChipLayout = isSingleRowCard || itemWidth === 1;

  if (item.imageSrc) {
    return (
      <Card
        sx={{
          ...theme.customStyles.floatingCard,
          ...editableImageCardSx,
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
          padding: 0,
        }}
      >
        {canEdit ? (
          <DeleteDashboardCardButton
            itemId={item.id}
            onDeleteItem={onDeleteItem}
          />
        ) : null}
        <Box
          component="img"
          src={item.imageSrc}
          alt={item.title ?? 'Dropped image'}
          draggable={false}
          sx={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'cover',
          }}
        />
      </Card>
    );
  }

  if (itemKind === 'filter') {
    return (
      <Card
        className="draggable-grid-hover-sync"
        sx={{
          ...theme.customStyles.floatingCard,
          ...interactiveCardSx,
          ...editableCardChromeSx,
          position: 'relative',
          height: '100%',
          opacity: isDragging ? 0.7 : 1,
          cursor: 'grab',
          display: 'flex',
        }}
      >
        {canEdit ? (
          <DeleteDashboardCardButton
            itemId={item.id}
            onDeleteItem={onDeleteItem}
          />
        ) : null}
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: isTitleOnlyCard ? 'center' : 'space-between',
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            gap: isTitleOnlyCard ? 1 : 1.25,
            overflow: 'hidden',
            p: `${isTitleOnlyCard ? 12 : 14}px !important`,
          }}
        >
          <DashboardWidgetHeader
            itemId={item.id}
            title={item.title}
            itemKind={itemKind}
            isTitleOnlyCard={isTitleOnlyCard}
            canEdit={canEdit}
            onItemChanged={onItemChanged}
            titleAction={
              canEdit ? (
                <Button
                  size="small"
                  variant="text"
                  color="primary"
                  data-draggable-grid-no-drag="true"
                  onMouseDown={handleNoDragMouseDown}
                  onClick={() => {
                    setIsFilterEditorOpen(true);
                  }}
                  sx={{
                    minWidth: 0,
                    borderRadius: 999,
                    px: 1,
                    flexShrink: 0,
                    textTransform: 'none',
                  }}
                >
                  Edit
                </Button>
              ) : null
            }
          />

          {!isTitleOnlyCard ? (
            <FilterDashboardItem
              item={item}
              isSingleRowCard={isSingleRowCard}
              isEditorOpen={isFilterEditorOpen}
              onEditorClose={() => {
                setIsFilterEditorOpen(false);
              }}
              onItemChanged={onItemChanged}
            />
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (itemKind !== 'card') {
    return (
      <Card
        className="draggable-grid-hover-sync"
        sx={{
          ...theme.customStyles.floatingCard,
          ...interactiveCardSx,
          ...editableCardChromeSx,
          position: 'relative',
          height: '100%',
          opacity: isDragging ? 0.7 : 1,
          cursor: 'grab',
          display: 'flex',
        }}
      >
        {canEdit ? (
          <DeleteDashboardCardButton
            itemId={item.id}
            onDeleteItem={onDeleteItem}
          />
        ) : null}
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: isTitleOnlyCard ? 'center' : 'space-between',
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            gap: isTitleOnlyCard ? 1 : 1.25,
            overflow: 'hidden',
            p: `${isTitleOnlyCard ? 12 : 14}px !important`,
          }}
        >
          <DashboardWidgetHeader
            itemId={item.id}
            title={item.title}
            itemKind={itemKind}
            isTitleOnlyCard={isTitleOnlyCard}
            canEdit={canEdit}
            onItemChanged={onItemChanged}
          />

          {!isTitleOnlyCard ? (
            <DashboardWidgetBody
              item={item}
              canEdit={canEdit}
              isSingleRowCard={isSingleRowCard}
              onItemChanged={onItemChanged}
            />
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
        ...editableCardChromeSx,
        position: 'relative',
        height: '100%',
        opacity: isDragging ? 0.7 : 1,
        cursor: 'grab',
        display: 'flex',
      }}
    >
      {canEdit ? (
        <DeleteDashboardCardButton
          itemId={item.id}
          onDeleteItem={onDeleteItem}
        />
      ) : null}
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
        <EditableDashboardTitle
          key={`${item.id}:${item.title ?? ''}`}
          itemId={item.id}
          title={item.title}
          canEdit={canEdit}
          onItemChanged={onItemChanged}
          clamp={isTitleOnlyCard ? 4 : isSingleRowCard ? 2 : 3}
          textAlign={isTitleOnlyCard ? 'center' : 'left'}
          fontSize={
            isTitleOnlyCard
              ? '0.92rem'
              : 'clamp(0.95rem, 0.2vw + 0.9rem, 1.08rem)'
          }
        />

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
                canEdit={canEdit}
              />
            ) : null}
            {shouldShowCurrentChip ? (
              <DashboardCardChip
                label="Current"
                value={`${itemWidth} x ${itemHeight}`}
                compact={useCompactChipLayout}
                canEdit={canEdit}
              />
            ) : null}
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}

type DashboardWidgetHeaderProps = {
  itemId: string;
  title?: string;
  itemKind: NonNullable<DraggableGridItem['kind']>;
  isTitleOnlyCard: boolean;
  canEdit: boolean;
  onItemChanged?: (
    itemId: string,
    updates: Partial<Omit<DraggableGridItem, 'id'>>
  ) => void;
  titleAction?: React.ReactNode;
};

function DashboardWidgetHeader({
  itemId,
  title,
  itemKind,
  isTitleOnlyCard,
  canEdit,
  onItemChanged,
  titleAction,
}: DashboardWidgetHeaderProps) {
  const accentColor = getWidgetAccentColor(itemKind);
  const shouldCenterHeaderRow =
    !titleAction && !isTitleOnlyCard && itemKind === 'chart';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isTitleOnlyCard ? 'column' : 'row',
        alignItems: shouldCenterHeaderRow ? 'center' : 'flex-start',
        justifyContent:
          !isTitleOnlyCard && titleAction ? 'space-between' : 'flex-start',
        gap: 1,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isTitleOnlyCard ? 'column' : 'row',
          alignItems: shouldCenterHeaderRow ? 'center' : 'flex-start',
          gap: 1,
          minWidth: 0,
          flex: 1,
        }}
      >
        <Box
          aria-hidden
          sx={{
            width: 26,
            height: 26,
            borderRadius: 1.5,
            bgcolor: accentColor.background,
            color: accentColor.text,
            border: canEdit
              ? `1px dashed ${alpha(accentColor.text, 0.24)}`
              : '1px solid transparent',
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
        <EditableDashboardTitle
          key={`${itemId}:${title ?? ''}`}
          itemId={itemId}
          title={title}
          canEdit={canEdit}
          onItemChanged={onItemChanged}
          clamp={isTitleOnlyCard ? 4 : 2}
          textAlign={isTitleOnlyCard ? 'center' : 'left'}
          fontSize={
            isTitleOnlyCard
              ? '0.92rem'
              : 'clamp(0.95rem, 0.2vw + 0.9rem, 1.08rem)'
          }
        />
      </Box>
      {titleAction}
    </Box>
  );
}

type DashboardWidgetBodyProps = {
  item: DraggableGridItem;
  canEdit: boolean;
  isSingleRowCard: boolean;
  onItemChanged?: (
    itemId: string,
    updates: Partial<Omit<DraggableGridItem, 'id'>>
  ) => void;
};

function DashboardWidgetBody({
  item,
  canEdit,
  isSingleRowCard,
  onItemChanged,
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

  if (item.kind === 'chart') {
    return (
      <DemoElectricityChartWidgetBody
        item={item}
        cardWidth={item.width ?? 1}
        cardHeight={item.height ?? 1}
        isSingleRowCard={isSingleRowCard}
      />
    );
  }

  if (item.kind === 'richText') {
    return (
      <Box
        sx={{
          borderLeft: canEdit
            ? '2px dashed rgba(37, 99, 235, 0.38)'
            : '3px solid rgba(37, 99, 235, 0.45)',
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          minHeight: 0,
          pl: 1.25,
          minWidth: 0,
        }}
      >
        <RichTextDashboardItem
          item={item}
          canEdit={canEdit}
          isSingleRowCard={isSingleRowCard}
          onItemChanged={onItemChanged}
        />
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

type EditableDashboardTitleProps = {
  itemId: string;
  title?: string;
  canEdit: boolean;
  onItemChanged?: (
    itemId: string,
    updates: Partial<Omit<DraggableGridItem, 'id'>>
  ) => void;
  clamp: number;
  textAlign: 'left' | 'center';
  fontSize: string;
};

function EditableDashboardTitle({
  itemId,
  title,
  canEdit,
  onItemChanged,
  clamp,
  textAlign,
  fontSize,
}: EditableDashboardTitleProps) {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title ?? '');
  const canInlineEdit = canEdit && onItemChanged !== undefined;
  const resolvedTitle = title?.trim() || 'Untitled';

  const finishEditing = (nextTitle: string, shouldSave: boolean) => {
    const trimmedTitle = nextTitle.trim();
    const resolvedNextTitle = trimmedTitle || 'Untitled';

    if (shouldSave && resolvedNextTitle !== resolvedTitle) {
      onItemChanged?.(itemId, {
        title: resolvedNextTitle,
      });
    }

    setIsEditing(false);
  };

  if (canInlineEdit && isEditing) {
    return (
      <Box
        data-draggable-grid-no-drag="true"
        sx={{
          flex: 1,
          minWidth: 0,
        }}
        onMouseDown={handleNoDragMouseDown}
      >
        <TextField
          autoFocus
          fullWidth
          hiddenLabel
          placeholder="Untitled"
          size="small"
          value={draftTitle}
          onBlur={() => {
            finishEditing(draftTitle, true);
          }}
          onChange={(event) => {
            setDraftTitle(event.currentTarget.value);
          }}
          onFocus={(event) => {
            event.currentTarget.select();
          }}
          onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              finishEditing(draftTitle, true);
              return;
            }

            if (event.key === 'Escape') {
              event.preventDefault();
              finishEditing(title ?? '', false);
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            },
            '& .MuiOutlinedInput-input': {
              px: 1.1,
              py: 0.7,
              color: theme.palette.text.primary,
              fontSize,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              textAlign,
            },
          }}
        />
      </Box>
    );
  }

  if (canInlineEdit) {
    return (
      <ButtonBase
        disableRipple
        data-draggable-grid-no-drag="true"
        onMouseDown={handleNoDragMouseDown}
        onClick={() => {
          setDraftTitle(title ?? '');
          setIsEditing(true);
        }}
        sx={{
          width: '100%',
          minWidth: 0,
          justifyContent: textAlign === 'center' ? 'center' : 'flex-start',
          alignItems: 'flex-start',
          borderRadius: 2,
          mx: textAlign === 'center' ? 0 : -0.5,
          px: 0.5,
          py: 0.35,
          textAlign,
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.05),
          },
        }}
      >
        <Typography
          sx={{
            color: 'text.primary',
            fontSize,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
            minWidth: 0,
            overflow: 'hidden',
            overflowWrap: 'anywhere',
            textAlign,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: clamp,
          }}
        >
          {resolvedTitle}
        </Typography>
      </ButtonBase>
    );
  }

  return (
    <Typography
      sx={{
        color: 'text.primary',
        fontSize,
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: '-0.01em',
        minWidth: 0,
        overflow: 'hidden',
        overflowWrap: 'anywhere',
        textAlign,
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: clamp,
      }}
    >
      {resolvedTitle}
    </Typography>
  );
}

function DemoElectricityChartWidgetBody({
  item,
  cardWidth,
  cardHeight,
  isSingleRowCard,
}: {
  item: DraggableGridItem;
  cardWidth: number;
  cardHeight: number;
  isSingleRowCard: boolean;
}) {
  const resolvedChart = useResolvedDemoElectricityChart(item);

  return (
    <ChartWidgetBody
      chartType={resolvedChart.chartType}
      description={resolvedChart.description}
      chartTrend={resolvedChart.trend}
      labels={resolvedChart.labels}
      points={resolvedChart.points}
      values={resolvedChart.values}
      cardWidth={cardWidth}
      cardHeight={cardHeight}
      isSingleRowCard={isSingleRowCard}
    />
  );
}

function ChartWidgetBody({
  chartType,
  description,
  chartTrend,
  labels,
  points,
  values,
  cardWidth,
  cardHeight,
  isSingleRowCard,
}: {
  chartType?: DraggableGridChartType;
  description?: string;
  chartTrend?: string;
  labels?: string[];
  points?: DraggableGridChartPoint[];
  values?: number[];
  cardWidth: number;
  cardHeight: number;
  isSingleRowCard: boolean;
}) {
  const resolvedChartType = chartType ?? 'column';

  return (
    <Box
      sx={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: 1,
        minHeight: 0,
        minWidth: 0,
      }}
    >
      {description ? (
        <WidgetSupportingText clamp={1}>{description}</WidgetSupportingText>
      ) : null}
      <ChartCanvas
        chartType={resolvedChartType}
        isSingleRowCard={isSingleRowCard}
        labels={labels}
        points={points}
        values={values}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
      />
      {chartTrend ? (
        <Typography
          sx={{
            color: 'info.dark',
            fontSize: '0.76rem',
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {chartTrend}
        </Typography>
      ) : null}
    </Box>
  );
}

function ChartCanvas({
  chartType,
  isSingleRowCard,
  labels,
  points,
  values,
  cardWidth,
  cardHeight,
}: {
  chartType: DraggableGridChartType;
  isSingleRowCard: boolean;
  labels?: string[];
  points?: DraggableGridChartPoint[];
  values?: number[];
  cardWidth: number;
  cardHeight: number;
}) {
  switch (chartType) {
    case 'line':
      return (
        <LineChartPreview
          isSingleRowCard={isSingleRowCard}
          labels={labels}
          values={values}
        />
      );
    case 'scatter':
      return (
        <ScatterChartPreview
          isSingleRowCard={isSingleRowCard}
          points={points}
        />
      );
    case 'pie':
      return (
        <PieChartPreview
          isSingleRowCard={isSingleRowCard}
          labels={labels}
          values={values}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
        />
      );
    case 'column':
    default:
      return (
        <ColumnChartPreview
          isSingleRowCard={isSingleRowCard}
          labels={labels}
          values={values}
        />
      );
  }
}

function LineChartPreview({
  isSingleRowCard,
  labels,
  values,
}: {
  isSingleRowCard: boolean;
  labels?: string[];
  values?: number[];
}) {
  const chartValues =
    values && values.length > 1 ? values : [24, 31, 28, 37, 35, 43, 48];
  const chartLabels = labels && labels.length === chartValues.length
    ? labels
    : chartValues.map((_, index) => `${index + 1}`);
  const chartHeight = isSingleRowCard ? 54 : 82;
  const svgWidth = 180;
  const svgHeight = 64;
  const svgPaddingX = 8;
  const svgPaddingY = 8;
  const minValue = Math.min(...chartValues);
  const maxValue = Math.max(...chartValues);
  const valueRange = Math.max(maxValue - minValue, 1);
  const pointsString = chartValues
    .map((value, index) => {
      const x =
        svgPaddingX +
        (index / Math.max(chartValues.length - 1, 1)) *
          (svgWidth - svgPaddingX * 2);
      const y =
        svgHeight -
        svgPaddingY -
        ((value - minValue) / valueRange) * (svgHeight - svgPaddingY * 2);

      return `${x},${y}`;
    })
    .join(' ');
  const linePoints = pointsString.split(' ');
  const areaStart = `${svgPaddingX},${svgHeight - svgPaddingY}`;
  const areaEnd = `${
    svgWidth - svgPaddingX
  },${svgHeight - svgPaddingY}`;
  const lastPoint = linePoints.at(-1)?.split(',') ?? ['0', '0'];

  return (
    <Box sx={getChartSurfaceSx(isSingleRowCard)}>
      <Box
        component="svg"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        aria-hidden
        sx={{
          width: '100%',
          height: `${chartHeight}px`,
          display: 'block',
          flexShrink: 0,
        }}
      >
        {[0.25, 0.5, 0.75].map((step) => {
          const y = svgPaddingY + (svgHeight - svgPaddingY * 2) * step;

          return (
            <Box
              key={`line-grid-${step}`}
              component="line"
              x1={svgPaddingX}
              y1={y}
              x2={svgWidth - svgPaddingX}
              y2={y}
              sx={{
                stroke: 'rgba(14, 116, 144, 0.12)',
                strokeWidth: 1,
              }}
            />
          );
        })}
        <Box
          component="polygon"
          points={`${areaStart} ${pointsString} ${areaEnd}`}
          sx={{ fill: 'rgba(14, 116, 144, 0.10)' }}
        />
        <Box
          component="polyline"
          points={pointsString}
          sx={{
            fill: 'none',
            stroke: '#0f766e',
            strokeWidth: 2.5,
            strokeLinejoin: 'round',
            strokeLinecap: 'round',
          }}
        />
        <Box
          component="circle"
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          r="4"
          sx={{ fill: '#0f766e', stroke: '#ffffff', strokeWidth: 2 }}
        />
      </Box>
      {!isSingleRowCard ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${chartLabels.length}, minmax(0, 1fr))`,
            gap: 0.5,
          }}
        >
          {chartLabels.map((label) => (
            <Typography
              key={`line-label-${label}`}
              sx={{
                color: 'text.secondary',
                fontSize: '0.58rem',
                fontWeight: 700,
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </Typography>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

function ColumnChartPreview({
  isSingleRowCard,
  labels,
  values,
}: {
  isSingleRowCard: boolean;
  labels?: string[];
  values?: number[];
}) {
  const chartValues = values && values.length > 0 ? values : [24, 31, 28, 37];
  const chartLabels = labels && labels.length === chartValues.length
    ? labels
    : chartValues.map((_, index) => `${index + 1}`);
  const maxValue = Math.max(...chartValues, 1);
  const chartHeight = isSingleRowCard ? 54 : 112;
  const svgWidth = 180;
  const svgHeight = 112;
  const svgPaddingX = 8;
  const svgPaddingTop = 8;
  const svgPaddingBottom = 18;
  const availableWidth = svgWidth - svgPaddingX * 2;
  const slotWidth = availableWidth / chartValues.length;
  const barWidth = Math.min(28, slotWidth * 0.72);
  const baselineY = svgHeight - svgPaddingBottom;

  return (
    <Box sx={getChartSurfaceSx(isSingleRowCard)}>
      <Box
        component="svg"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        aria-hidden
        sx={{
          width: '100%',
          height: isSingleRowCard ? `${chartHeight}px` : '100%',
          minHeight: isSingleRowCard ? undefined : `${chartHeight}px`,
          display: 'block',
          flex: isSingleRowCard ? '0 0 auto' : 1,
        }}
      >
        {[0.25, 0.5, 0.75].map((step) => {
          const y = svgPaddingTop + (baselineY - svgPaddingTop) * step;

          return (
            <Box
              key={`column-grid-${step}`}
              component="line"
              x1={svgPaddingX}
              y1={y}
              x2={svgWidth - svgPaddingX}
              y2={y}
              sx={{
                stroke: 'rgba(51, 65, 85, 0.10)',
                strokeWidth: 1,
              }}
            />
          );
        })}
        <Box
          component="line"
          x1={svgPaddingX}
          y1={baselineY}
          x2={svgWidth - svgPaddingX}
          y2={baselineY}
          sx={{
            stroke: 'rgba(51, 65, 85, 0.22)',
            strokeWidth: 1.4,
          }}
        />
        {chartValues.map((value, index) => {
          const barHeight = Math.max(
            10,
            ((value / maxValue) * (baselineY - svgPaddingTop - 2))
          );
          const barX = svgPaddingX + slotWidth * index + (slotWidth - barWidth) / 2;
          const barY = baselineY - barHeight;
          const isLastBar = index === chartValues.length - 1;

          return (
            <Box
              key={`column-bar-${index}`}
              component="rect"
              x={barX}
              y={barY}
              width={barWidth}
              height={barHeight}
              rx={2}
              ry={2}
              sx={{
                fill: isLastBar ? '#0f766e' : 'rgba(15, 118, 110, 0.34)',
                filter: isLastBar
                  ? 'drop-shadow(0px 6px 12px rgba(15, 118, 110, 0.16))'
                  : 'none',
              }}
            />
          );
        })}
      </Box>
      {!isSingleRowCard ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${chartLabels.length}, minmax(0, 1fr))`,
            gap: 0.5,
          }}
        >
          {chartLabels.map((label) => (
            <Typography
              key={`column-label-${label}`}
              sx={{
                color: 'text.secondary',
                fontSize: '0.58rem',
                fontWeight: 700,
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </Typography>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

function PieChartPreview({
  isSingleRowCard,
  labels,
  values,
  cardWidth,
  cardHeight,
}: {
  isSingleRowCard: boolean;
  labels?: string[];
  values?: number[];
  cardWidth: number;
  cardHeight: number;
}) {
  const chartValues = values && values.length > 0 ? values : [42, 24, 19, 15];
  const chartLabels = labels && labels.length === chartValues.length
    ? labels
    : ['A', 'B', 'C', 'D'];
  const isCompactPieCard =
    !isSingleRowCard && (cardHeight <= 2 || cardWidth <= 2);
  const showLegend = !isSingleRowCard && !isCompactPieCard && chartLabels.length > 0;
  const donutSize = isSingleRowCard
    ? 56
    : isCompactPieCard
      ? 'min(100%, 84px)'
      : 'min(100%, 112px)';
  const totalValue = chartValues.reduce((sum, value) => sum + value, 0);
  const pieColors = ['#0f766e', '#0891b2', '#6366f1', '#f59e0b', '#ef4444'];
  const conicSegments = chartValues
    .reduce(
      (result, value, index) => {
        const share = (value / Math.max(totalValue, 1)) * 100;
        const endPercent = result.currentPercent + share;

        return {
          currentPercent: endPercent,
          segments: [
            ...result.segments,
            `${pieColors[index % pieColors.length]} ${result.currentPercent}% ${endPercent}%`,
          ],
        };
      },
      { currentPercent: 0, segments: [] as string[] }
    )
    .segments.join(', ');

  return (
    <Box
      sx={{
        ...getChartSurfaceSx(isSingleRowCard),
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isSingleRowCard ? 0.75 : isCompactPieCard ? 0.65 : 1.1,
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: donutSize,
          maxWidth: '100%',
          aspectRatio: '1 / 1',
          alignSelf: 'center',
          borderRadius: '50%',
          background: `conic-gradient(${conicSegments})`,
          flexShrink: 0,
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: isSingleRowCard ? '13px' : isCompactPieCard ? '26%' : '24%',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
          },
        }}
      />
      {showLegend ? (
        <Box
          sx={{
            display: 'grid',
            gap: 0.45,
            width: '100%',
            maxWidth: 180,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {chartLabels.map((label, index) => (
            <Box
              key={`pie-legend-${label}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 0.75,
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.55,
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    bgcolor: pieColors[index % pieColors.length],
                    flexShrink: 0,
                  }}
                />
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </Typography>
              </Box>
              <Typography
                sx={{
                  color: 'text.primary',
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {formatPieShare(chartValues[index], totalValue)}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

function ScatterChartPreview({
  isSingleRowCard,
  points,
}: {
  isSingleRowCard: boolean;
  points?: DraggableGridChartPoint[];
}) {
  const chartPoints =
    points && points.length > 1
      ? points
      : [
          { x: 18, y: 24 },
          { x: 26, y: 31 },
          { x: 42, y: 36 },
          { x: 58, y: 47 },
          { x: 73, y: 54 },
          { x: 91, y: 63 },
        ];
  const xMin = Math.min(...chartPoints.map((point) => point.x));
  const xMax = Math.max(...chartPoints.map((point) => point.x));
  const yMin = Math.min(...chartPoints.map((point) => point.y));
  const yMax = Math.max(...chartPoints.map((point) => point.y));
  const svgWidth = 180;
  const svgHeight = isSingleRowCard ? 64 : 108;
  const svgPaddingX = 12;
  const svgPaddingY = 10;

  return (
    <Box sx={getChartSurfaceSx(isSingleRowCard)}>
      <Box
        component="svg"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        aria-hidden
        sx={{
          width: '100%',
          height: isSingleRowCard ? `${svgHeight}px` : '100%',
          minHeight: isSingleRowCard ? undefined : '108px',
          display: 'block',
          flex: isSingleRowCard ? '0 0 auto' : 1,
        }}
      >
        {[0.25, 0.5, 0.75].map((step) => {
          const y = svgPaddingY + (svgHeight - svgPaddingY * 2) * step;
          const x = svgPaddingX + (svgWidth - svgPaddingX * 2) * step;

          return (
            <Box key={`scatter-grid-y-${step}`} component="g">
              <Box
                component="line"
                x1={svgPaddingX}
                y1={y}
                x2={svgWidth - svgPaddingX}
                y2={y}
                sx={{
                  stroke: 'rgba(51, 65, 85, 0.10)',
                  strokeWidth: 1,
                }}
              />
              <Box
                component="line"
                x1={x}
                y1={svgPaddingY}
                x2={x}
                y2={svgHeight - svgPaddingY}
                sx={{
                  stroke: 'rgba(51, 65, 85, 0.10)',
                  strokeWidth: 1,
                }}
              />
            </Box>
          );
        })}
        {chartPoints.map((point, index) => {
          const x =
            svgPaddingX +
            ((point.x - xMin) / Math.max(xMax - xMin, 1)) *
              (svgWidth - svgPaddingX * 2);
          const y =
            svgHeight -
            svgPaddingY -
            ((point.y - yMin) / Math.max(yMax - yMin, 1)) *
              (svgHeight - svgPaddingY * 2);
          const isHighlighted = index === chartPoints.length - 1;

          return (
            <Box
              key={`scatter-point-${index}`}
              component="circle"
              cx={x}
              cy={y}
              r={isHighlighted ? 4.5 : 3.5}
              sx={{
                fill: isHighlighted ? '#0f766e' : 'rgba(8, 145, 178, 0.48)',
                stroke: '#ffffff',
                strokeWidth: 1.5,
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}

function getChartSurfaceSx(isSingleRowCard: boolean) {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 0.65,
    flex: 1,
    minHeight: isSingleRowCard ? 0 : 96,
    px: 1,
    py: 0.9,
    borderRadius: 1.5,
    border: '1px solid rgba(14, 116, 144, 0.14)',
    bgcolor: 'rgba(14, 116, 144, 0.05)',
    minWidth: 0,
    ...(isSingleRowCard
      ? {
          justifyContent: 'center',
        }
      : {
          justifyContent: 'space-between',
        }),
  };
}

function formatPieShare(value: number, totalValue: number) {
  return `${(((value / Math.max(totalValue, 1)) * 100) || 0).toFixed(1)}%`;
}

function getWidgetInitial(kind: NonNullable<DraggableGridItem['kind']>) {
  const labels: Record<NonNullable<DraggableGridItem['kind']>, string> = {
    button: 'B',
    card: 'C',
    chart: 'G',
    filter: 'F',
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
    chart: {
      background: 'rgba(13, 148, 136, 0.12)',
      text: '#0f766e',
    },
    filter: {
      background: 'rgba(234, 88, 12, 0.12)',
      text: '#c2410c',
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

function handleNoDragMouseDown(event: React.MouseEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

function DeleteDashboardCardButton({
  itemId,
  onDeleteItem,
}: {
  itemId: string;
  onDeleteItem?: (itemId: string) => void;
}) {
  if (!onDeleteItem) {
    return null;
  }

  return (
    <Box
      component="button"
      type="button"
      aria-label="Delete card"
      data-draggable-grid-no-drag="true"
      onMouseDown={(event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        onDeleteItem(itemId);
      }}
      sx={(theme) => ({
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 3,
        width: 24,
        height: 24,
        border: `1px solid ${alpha(theme.palette.error.main, 0.16)}`,
        borderRadius: 999,
        backgroundColor: theme.palette.common.white,
        color: alpha(theme.palette.error.dark, 0.92),
        display: 'grid',
        placeItems: 'center',
        fontSize: '0.92rem',
        fontWeight: 700,
        lineHeight: 1,
        cursor: 'pointer',
        boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.10)',
        transition:
          'background-color 140ms ease, border-color 140ms ease, color 140ms ease',
        '&:hover': {
          backgroundColor: theme.palette.common.white,
          borderColor: alpha(theme.palette.error.main, 0.28),
          color: theme.palette.error.main,
        },
      })}
    >
      ×
    </Box>
  );
}

type DashboardCardChipProps = {
  label: string;
  value: string;
  compact?: boolean;
  canEdit: boolean;
};

function DashboardCardChip({
  label,
  value,
  compact = false,
  canEdit,
}: DashboardCardChipProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minWidth: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 0.5 : 0.65,
        maxWidth: '100%',
        borderRadius: 999,
        border: canEdit
          ? `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`
          : '1px solid rgba(15, 23, 42, 0.08)',
        bgcolor: canEdit
          ? alpha(theme.palette.primary.main, 0.06)
          : 'rgba(15, 23, 42, 0.05)',
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

function getEditableCardChromeSx(theme: Theme) {
  return {
    borderColor: alpha(theme.palette.primary.main, 0.14),
    boxShadow: `0 2px 4px #0000000f, inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.06)}`,
  };
}
