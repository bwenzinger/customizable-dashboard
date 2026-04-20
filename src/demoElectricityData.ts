import { useSyncExternalStore } from 'react';
import rawElectricityData from './data/usElectricityRegionalData.json';
import {
  getUrlParamValue,
  getUrlSearchSnapshot,
  subscribeToUrlParamChanges,
} from './dashboardUrlParams';
import type {
  DraggableGridChartPoint,
  DraggableGridChartType,
  DraggableGridItem,
} from './drag-and-droppable-grid/types';

export const demoElectricityRegionFilterOptions = [
  'All regions',
  'Northeast',
  'Midwest',
  'South',
  'West',
] as const;

export type DemoElectricityRegionFilterValue =
  (typeof demoElectricityRegionFilterOptions)[number];

type DemoElectricityRegionKey =
  | 'northeast'
  | 'midwest'
  | 'south'
  | 'west';

type DemoElectricityChartPresetId =
  | 'residential-monthly-bill'
  | 'residential-price'
  | 'all-sector-sales'
  | 'all-sector-revenue'
  | 'sales-share'
  | 'revenue-share'
  | 'bill-vs-usage'
  | 'price-vs-usage';

type DemoElectricityRegionRecord = {
  key: DemoElectricityRegionKey;
  label: string;
  shortLabel: string;
  divisionKeys: string[];
};

type DemoElectricityAreaMetrics = {
  key: string;
  label: string;
  shortLabel: string;
  residentialCustomers: number;
  residentialAverageMonthlyConsumptionKwh: number;
  residentialAveragePriceCentsPerKwh: number;
  residentialAverageMonthlyBillUsd: number;
  allSectorSalesThousandMWh: number;
  allSectorRevenueMillionUsd: number;
  allSectorAveragePriceCentsPerKwh: number;
};

type DemoElectricityDivisionRecord = DemoElectricityAreaMetrics & {
  regionKey: DemoElectricityRegionKey;
};

type DemoElectricityDataset = {
  metadata: {
    title: string;
    year: number;
    sources: Array<{
      id: string;
      title: string;
      url: string;
    }>;
  };
  regions: DemoElectricityRegionRecord[];
  divisions: DemoElectricityDivisionRecord[];
  usTotal: Omit<DemoElectricityAreaMetrics, 'key' | 'label' | 'shortLabel'>;
};

type DemoElectricityChartSize = {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
};

type DemoElectricityChartPreset = {
  id: DemoElectricityChartPresetId;
  chartType: DraggableGridChartType;
  title: string;
  size: DemoElectricityChartSize;
  buildChart: (
    areas: DemoElectricityAreaMetrics[],
    scope: DemoElectricityScope
  ) => DemoElectricityChartResolution;
};

type DemoElectricityScope = {
  breakdownLabel: string;
  regionLabel: string;
  isAllRegions: boolean;
};

type DemoElectricityChartResolution = {
  chartType: DraggableGridChartType;
  description: string;
  labels?: string[];
  tooltipLabels?: string[];
  points?: DraggableGridChartPoint[];
  trend: string;
  values?: number[];
};

type DemoElectricityResolvedChart = DemoElectricityChartResolution & {
  title: string;
};

const electricityDataset = rawElectricityData as DemoElectricityDataset;
const electricityDivisionMap = new Map(
  electricityDataset.divisions.map((division) => [division.key, division])
);
const electricityRegionMap = new Map(
  electricityDataset.regions.map((region) => [region.key, region])
);

const defaultChartPresetIdByType: Record<
  DraggableGridChartType,
  DemoElectricityChartPresetId
> = {
  line: 'residential-monthly-bill',
  scatter: 'price-vs-usage',
  pie: 'sales-share',
  column: 'all-sector-sales',
};

const electricityChartPresets: Record<
  DemoElectricityChartPresetId,
  DemoElectricityChartPreset
> = {
  'residential-monthly-bill': {
    id: 'residential-monthly-bill',
    chartType: 'line',
    title: 'Residential monthly bill',
    size: {
      width: 4,
      height: 3,
      minWidth: 3,
      minHeight: 2,
    },
    buildChart: (areas, scope) => {
      const highestArea = getAreaWithLargestValue(
        areas,
        'residentialAverageMonthlyBillUsd'
      );

      return {
        chartType: 'line',
        description: `2024 average residential monthly electric bill by ${scope.breakdownLabel}.`,
        labels: areas.map((area) => area.shortLabel),
        tooltipLabels: areas.map((area) => area.label),
        trend: `Highest in view: ${highestArea.label} at ${formatUsd(highestArea.residentialAverageMonthlyBillUsd)}/month`,
        values: areas.map((area) => area.residentialAverageMonthlyBillUsd),
      };
    },
  },
  'residential-price': {
    id: 'residential-price',
    chartType: 'line',
    title: 'Residential electricity price',
    size: {
      width: 4,
      height: 3,
      minWidth: 3,
      minHeight: 2,
    },
    buildChart: (areas, scope) => {
      const highestArea = getAreaWithLargestValue(
        areas,
        'residentialAveragePriceCentsPerKwh'
      );

      return {
        chartType: 'line',
        description: `2024 average residential price by ${scope.breakdownLabel}.`,
        labels: areas.map((area) => area.shortLabel),
        tooltipLabels: areas.map((area) => area.label),
        trend: `Highest in view: ${highestArea.label} at ${formatCents(highestArea.residentialAveragePriceCentsPerKwh)}`,
        values: areas.map(
          (area) => area.residentialAveragePriceCentsPerKwh
        ),
      };
    },
  },
  'all-sector-sales': {
    id: 'all-sector-sales',
    chartType: 'column',
    title: 'Total electricity sales',
    size: {
      width: 4,
      height: 3,
      minWidth: 3,
      minHeight: 2,
    },
    buildChart: (areas, scope) => {
      const highestArea = getAreaWithLargestValue(
        areas,
        'allSectorSalesThousandMWh'
      );

      return {
        chartType: 'column',
        description: `2024 all-sector electricity sales by ${scope.breakdownLabel}.`,
        labels: areas.map((area) => area.shortLabel),
        tooltipLabels: areas.map((area) => area.label),
        trend: `${highestArea.label} leads with ${formatTwh(highestArea.allSectorSalesThousandMWh)} sold`,
        values: areas.map((area) => area.allSectorSalesThousandMWh),
      };
    },
  },
  'all-sector-revenue': {
    id: 'all-sector-revenue',
    chartType: 'column',
    title: 'Total electricity revenue',
    size: {
      width: 4,
      height: 3,
      minWidth: 3,
      minHeight: 2,
    },
    buildChart: (areas, scope) => {
      const highestArea = getAreaWithLargestValue(
        areas,
        'allSectorRevenueMillionUsd'
      );

      return {
        chartType: 'column',
        description: `2024 all-sector electricity revenue by ${scope.breakdownLabel}.`,
        labels: areas.map((area) => area.shortLabel),
        tooltipLabels: areas.map((area) => area.label),
        trend: `${highestArea.label} leads with ${formatRevenue(highestArea.allSectorRevenueMillionUsd)}`,
        values: areas.map((area) => area.allSectorRevenueMillionUsd),
      };
    },
  },
  'sales-share': {
    id: 'sales-share',
    chartType: 'pie',
    title: 'Sales share',
    size: {
      width: 3,
      height: 4,
      minWidth: 2,
      minHeight: 4,
    },
    buildChart: (areas, scope) => {
      const totalSales = areas.reduce(
        (sum, area) => sum + area.allSectorSalesThousandMWh,
        0
      );
      const highestArea = getAreaWithLargestValue(
        areas,
        'allSectorSalesThousandMWh'
      );

      return {
        chartType: 'pie',
        description: `2024 share of all-sector electricity sales within ${scope.regionLabel}.`,
        labels: areas.map((area) => area.shortLabel),
        tooltipLabels: areas.map((area) => area.label),
        trend: `${highestArea.label} accounts for ${formatPercentShare(
          highestArea.allSectorSalesThousandMWh,
          totalSales
        )} of sales in view`,
        values: areas.map((area) => area.allSectorSalesThousandMWh),
      };
    },
  },
  'revenue-share': {
    id: 'revenue-share',
    chartType: 'pie',
    title: 'Revenue share',
    size: {
      width: 3,
      height: 4,
      minWidth: 2,
      minHeight: 4,
    },
    buildChart: (areas, scope) => {
      const totalRevenue = areas.reduce(
        (sum, area) => sum + area.allSectorRevenueMillionUsd,
        0
      );
      const highestArea = getAreaWithLargestValue(
        areas,
        'allSectorRevenueMillionUsd'
      );

      return {
        chartType: 'pie',
        description: `2024 share of all-sector electricity revenue within ${scope.regionLabel}.`,
        labels: areas.map((area) => area.shortLabel),
        tooltipLabels: areas.map((area) => area.label),
        trend: `${highestArea.label} accounts for ${formatPercentShare(
          highestArea.allSectorRevenueMillionUsd,
          totalRevenue
        )} of revenue in view`,
        values: areas.map((area) => area.allSectorRevenueMillionUsd),
      };
    },
  },
  'bill-vs-usage': {
    id: 'bill-vs-usage',
    chartType: 'scatter',
    title: 'Bill vs usage',
    size: {
      width: 4,
      height: 3,
      minWidth: 3,
      minHeight: 3,
    },
    buildChart: (areas, scope) => {
      const highestArea = getAreaWithLargestValue(
        areas,
        'residentialAverageMonthlyBillUsd'
      );

      return {
        chartType: 'scatter',
        description: `2024 residential monthly bill versus usage by ${scope.breakdownLabel}.`,
        labels: areas.map((area) => area.shortLabel),
        tooltipLabels: areas.map((area) => area.label),
        points: areas.map((area) => ({
          x: area.residentialAverageMonthlyConsumptionKwh,
          y: area.residentialAverageMonthlyBillUsd,
        })),
        trend: `Highest bill in view: ${highestArea.label} at ${formatUsd(highestArea.residentialAverageMonthlyBillUsd)}/month`,
      };
    },
  },
  'price-vs-usage': {
    id: 'price-vs-usage',
    chartType: 'scatter',
    title: 'Price vs usage',
    size: {
      width: 4,
      height: 3,
      minWidth: 3,
      minHeight: 3,
    },
    buildChart: (areas, scope) => {
      const highestArea = getAreaWithLargestValue(
        areas,
        'residentialAveragePriceCentsPerKwh'
      );

      return {
        chartType: 'scatter',
        description: `2024 residential price versus usage by ${scope.breakdownLabel}.`,
        labels: areas.map((area) => area.shortLabel),
        tooltipLabels: areas.map((area) => area.label),
        points: areas.map((area) => ({
          x: area.residentialAverageMonthlyConsumptionKwh,
          y: area.residentialAveragePriceCentsPerKwh,
        })),
        trend: `Highest price in view: ${highestArea.label} at ${formatCents(highestArea.residentialAveragePriceCentsPerKwh)}`,
      };
    },
  },
};

export function getDemoElectricityRegionFilterOptions(): string[] {
  return [...demoElectricityRegionFilterOptions];
}

export function buildDemoElectricityChartItem(
  currentLayout: DraggableGridItem[]
): Omit<DraggableGridItem, 'id' | 'row' | 'column'> {
  const chartType = getNextChartTypeForLayout(currentLayout);
  const chartPreset = getNextChartPresetForType(currentLayout, chartType);

  return {
    kind: 'chart',
    chartPresetId: chartPreset.id,
    chartType: chartPreset.chartType,
    title: chartPreset.title,
    width: chartPreset.size.width,
    height: chartPreset.size.height,
    minWidth: chartPreset.size.minWidth,
    minHeight: chartPreset.size.minHeight,
  };
}

export function normalizeDemoLayoutWithElectricityCharts(
  layout: DraggableGridItem[]
): DraggableGridItem[] {
  return layout.map((item) => {
    if (item.kind !== 'chart') {
      return item;
    }

    const preset = getDemoElectricityChartPreset(item.chartPresetId, item.chartType);
    const hasValidPresetId =
      typeof item.chartPresetId === 'string' &&
      Object.prototype.hasOwnProperty.call(
        electricityChartPresets,
        item.chartPresetId
      );

    if (hasValidPresetId) {
      return {
        ...item,
        chartType: preset.chartType,
        title: item.title?.trim() || preset.title,
        width: item.width ?? preset.size.width,
        height: item.height ?? preset.size.height,
        minWidth: item.minWidth ?? preset.size.minWidth,
        minHeight: item.minHeight ?? preset.size.minHeight,
      };
    }

    return {
      ...item,
      chartPresetId: preset.id,
      chartType: preset.chartType,
      title: preset.title,
      width: item.width ?? preset.size.width,
      height: item.height ?? preset.size.height,
      minWidth: item.minWidth ?? preset.size.minWidth,
      minHeight: item.minHeight ?? preset.size.minHeight,
    };
  });
}

export function useResolvedDemoElectricityChart(
  item: DraggableGridItem
): DemoElectricityResolvedChart {
  const urlSearch = useSyncExternalStore(
    subscribeToUrlParamChanges,
    getUrlSearchSnapshot,
    () => ''
  );
  const regionKey = getDemoElectricityRegionKeyFromSearch(urlSearch);
  const preset = getDemoElectricityChartPreset(item.chartPresetId, item.chartType);
  const region = regionKey === 'all' ? null : electricityRegionMap.get(regionKey);
  const areas = regionKey === 'all' ? getRegionAreas() : getDivisionAreasForRegion(regionKey);
  const scope: DemoElectricityScope = {
    breakdownLabel:
      regionKey === 'all'
        ? 'Census region'
        : `Census division in the ${region?.label ?? 'selected region'}`,
    regionLabel: region?.label ?? 'the U.S. regional view',
    isAllRegions: regionKey === 'all',
  };
  const resolvedChart = preset.buildChart(areas, scope);

  return {
    ...resolvedChart,
    title: item.title?.trim() || preset.title,
  };
}

function getDemoElectricityChartPreset(
  presetId?: string,
  chartType?: DraggableGridChartType
): DemoElectricityChartPreset {
  if (
    presetId &&
    Object.prototype.hasOwnProperty.call(electricityChartPresets, presetId)
  ) {
    return electricityChartPresets[presetId as DemoElectricityChartPresetId];
  }

  const resolvedChartType = chartType ?? 'column';

  return electricityChartPresets[defaultChartPresetIdByType[resolvedChartType]];
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
  const chartTypeCounts = allChartTypes.reduce<
    Record<DraggableGridChartType, number>
  >(
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
    if (item.kind !== 'chart') {
      return;
    }

    const chartPreset = getDemoElectricityChartPreset(
      item.chartPresetId,
      item.chartType
    );

    chartTypeCounts[chartPreset.chartType] += 1;
  });

  const minimumCount = Math.min(
    ...allChartTypes.map((chartType) => chartTypeCounts[chartType])
  );
  const leastUsedChartTypes = allChartTypes.filter(
    (chartType) => chartTypeCounts[chartType] === minimumCount
  );

  return getRandomItem(leastUsedChartTypes);
}

function getNextChartPresetForType(
  currentLayout: DraggableGridItem[],
  chartType: DraggableGridChartType
): DemoElectricityChartPreset {
  const presetsForType = Object.values(electricityChartPresets).filter(
    (preset) => preset.chartType === chartType
  );
  const chartPresetCounts = presetsForType.reduce<Record<string, number>>(
    (result, preset) => ({
      ...result,
      [preset.id]: 0,
    }),
    {}
  );

  currentLayout.forEach((item) => {
    if (item.kind !== 'chart') {
      return;
    }

    const chartPreset = getDemoElectricityChartPreset(
      item.chartPresetId,
      item.chartType
    );

    if (chartPreset.chartType === chartType) {
      chartPresetCounts[chartPreset.id] += 1;
    }
  });

  const minimumCount = Math.min(
    ...presetsForType.map((preset) => chartPresetCounts[preset.id])
  );
  const leastUsedPresets = presetsForType.filter(
    (preset) => chartPresetCounts[preset.id] === minimumCount
  );

  return getRandomItem(leastUsedPresets);
}

function getDemoElectricityRegionKeyFromSearch(
  search = getUrlSearchSnapshot()
): DemoElectricityRegionKey | 'all' {
  const regionFilterValue = getUrlParamValue('region', search);
  const normalizedValue = regionFilterValue?.trim().toLowerCase();

  switch (normalizedValue) {
    case 'northeast':
      return 'northeast';
    case 'midwest':
      return 'midwest';
    case 'south':
      return 'south';
    case 'west':
      return 'west';
    default:
      return 'all';
  }
}

function getDivisionAreasForRegion(
  regionKey: DemoElectricityRegionKey
): DemoElectricityAreaMetrics[] {
  const region = electricityRegionMap.get(regionKey);

  if (!region) {
    return getRegionAreas();
  }

  return region.divisionKeys
    .map((divisionKey) => electricityDivisionMap.get(divisionKey))
    .filter(
      (division): division is DemoElectricityDivisionRecord =>
        division !== undefined
    );
}

function getRegionAreas(): DemoElectricityAreaMetrics[] {
  return electricityDataset.regions.map((region) =>
    buildRegionArea(region)
  );
}

function buildRegionArea(
  region: DemoElectricityRegionRecord
): DemoElectricityAreaMetrics {
  const divisions = region.divisionKeys
    .map((divisionKey) => electricityDivisionMap.get(divisionKey))
    .filter(
      (division): division is DemoElectricityDivisionRecord =>
        division !== undefined
    );
  const residentialCustomers = divisions.reduce(
    (sum, division) => sum + division.residentialCustomers,
    0
  );
  const weightedResidentialConsumption = divisions.reduce(
    (sum, division) =>
      sum +
      division.residentialCustomers *
        division.residentialAverageMonthlyConsumptionKwh,
    0
  );
  const weightedResidentialBill = divisions.reduce(
    (sum, division) =>
      sum + division.residentialCustomers * division.residentialAverageMonthlyBillUsd,
    0
  );
  const monthlyResidentialRevenueUsd = weightedResidentialBill;
  const monthlyResidentialConsumptionKwh = weightedResidentialConsumption;
  const allSectorSalesThousandMWh = divisions.reduce(
    (sum, division) => sum + division.allSectorSalesThousandMWh,
    0
  );
  const allSectorRevenueMillionUsd = divisions.reduce(
    (sum, division) => sum + division.allSectorRevenueMillionUsd,
    0
  );

  return {
    key: region.key,
    label: region.label,
    shortLabel: region.shortLabel,
    residentialCustomers,
    // Weighted averages keep the rollup faithful to the underlying customer
    // base instead of treating tiny divisions like AK/HI the same as California.
    residentialAverageMonthlyConsumptionKwh: roundTo(
      weightedResidentialConsumption / Math.max(residentialCustomers, 1),
      0
    ),
    residentialAveragePriceCentsPerKwh: roundTo(
      (monthlyResidentialRevenueUsd * 100) /
        Math.max(monthlyResidentialConsumptionKwh, 1),
      2
    ),
    residentialAverageMonthlyBillUsd: roundTo(
      weightedResidentialBill / Math.max(residentialCustomers, 1),
      2
    ),
    allSectorSalesThousandMWh,
    allSectorRevenueMillionUsd,
    allSectorAveragePriceCentsPerKwh: roundTo(
      (allSectorRevenueMillionUsd * 100) / Math.max(allSectorSalesThousandMWh, 1),
      2
    ),
  };
}

function getAreaWithLargestValue(
  areas: DemoElectricityAreaMetrics[],
  key: keyof DemoElectricityAreaMetrics
) {
  return areas.reduce((bestArea, currentArea) =>
    currentArea[key] > bestArea[key] ? currentArea : bestArea
  );
}

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCents(value: number) {
  return `${roundTo(value, 1).toFixed(1)}¢/kWh`;
}

function formatTwh(thousandMwh: number) {
  const twh = thousandMwh / 1000;
  const maximumFractionDigits = twh < 100 ? 1 : 0;

  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
  }).format(twh)} TWh`;
}

function formatRevenue(millionUsd: number) {
  if (millionUsd >= 1000) {
    return `$${roundTo(millionUsd / 1000, 1).toFixed(1)}B`;
  }

  return `$${Math.round(millionUsd)}M`;
}

function formatPercentShare(value: number, total: number) {
  return `${roundTo((value / Math.max(total, 1)) * 100, 1).toFixed(1)}%`;
}

function roundTo(value: number, digits: number) {
  const multiplier = 10 ** digits;

  return Math.round(value * multiplier) / multiplier;
}

function getRandomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
