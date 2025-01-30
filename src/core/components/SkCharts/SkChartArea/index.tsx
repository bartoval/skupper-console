import { FC, useMemo, useState, useCallback } from 'react';

import {
  ChartProps,
  Chart,
  ChartAxis,
  createContainer,
  ChartGroup,
  ChartLegendTooltip,
  ChartThemeColor,
  ChartArea,
  ChartLine,
  ChartLabel
} from '@patternfly/react-charts/victory';
import { Button } from '@patternfly/react-core';

import { CHART_CONFIG } from './SkChartArea.constants';
import {
  calculateCustomTickValues,
  calculateTickDensity,
  filterDataByRange,
  getChartDynamicPaddingLeft
} from './SkChartArea.utils';
import { useChartDimensions } from '../../../../hooks/useChartDimensions';
import { skAxisXY } from '../../../../types/SkCharts';
import { formatChartDateByRange } from '../../../utils/formatChartDateByRange';

interface SkChartAreaProps extends ChartProps {
  data: skAxisXY[][];
  title?: string;
  formatY?: (y: number) => string | number;
  formatX?: (timestamp: number, range: number) => string;
  axisYLabel?: string;
  legendLabels?: string[];
  isChartLine?: boolean;
  padding?: Record<string, number>;
  showLegend?: boolean;
}

const SkChartArea: FC<SkChartAreaProps> = function ({
  data,
  formatY = (y: number) => y,
  formatX = (timestamp: number, range: number) => formatChartDateByRange(timestamp, range),
  axisYLabel,
  legendLabels = [],
  showLegend = true,
  isChartLine = false,
  title,
  height = CHART_CONFIG.LAYOUT.DEFAULT_HEIGHT,
  legendOrientation = 'horizontal',
  legendPosition = 'bottom',
  padding = CHART_CONFIG.LAYOUT.DEFAULT_PADDING,
  ...props
}) {
  // 1. Container and Dimensions
  const CursorVoronoiContainer = useMemo(() => createContainer('voronoi', 'brush'), []);
  const { chartWidth, chartContainerRef } = useChartDimensions();

  // 2. State Management
  const [brushDomain, setBrushDomain] = useState<{ x: number[]; y: number[] } | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);

  // 3. Data Processing and Memoization
  const filteredData = useMemo(() => filterDataByRange(data, brushDomain), [data, brushDomain]); // useMemo here
  const legendData = useMemo(() => legendLabels.map((label) => ({ childName: label, name: label })), [legendLabels]);
  const startDate = filteredData[0]?.[0]?.x ?? 0;
  const endDate = filteredData[filteredData.length - 1]?.[filteredData[0]?.length - 1]?.x ?? startDate + 1000;

  // 4. Tick Calculation
  const tickYCount = useMemo(
    () =>
      Math.max(
        CHART_CONFIG.TICKS.MIN_COUNT,
        Math.min(
          CHART_CONFIG.TICKS.MAX_COUNT,
          Math.floor((height - CHART_CONFIG.LAYOUT.CHART_OFFSET) / calculateTickDensity(chartWidth))
        )
      ),
    [height, chartWidth]
  );

  const tickXCount = useMemo(
    () =>
      Math.max(
        CHART_CONFIG.TICKS.MIN_COUNT,
        Math.min(CHART_CONFIG.TICKS.MAX_COUNT, Math.floor((chartWidth - 50) / calculateTickDensity(chartWidth, 160)))
      ),
    [chartWidth]
  );

  // 5. Brush Handlers (useCallback for stable references)
  const handleBrush = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleBrushEnd = useCallback(
    (zoom: { x: number[]; y: number[] }) => {
      setBrushDomain(zoom);
      setIsDragging(false);
    },
    [setBrushDomain, setIsDragging]
  );

  const handleBrushClear = useCallback(() => {
    setBrushDomain(undefined);
  }, [setBrushDomain]);

  // 6. Dynamic Padding
  const dynamicPaddingLeft = useMemo(() => getChartDynamicPaddingLeft(filteredData, formatY), [filteredData, formatY]);
  const calculatedPadding = useMemo(() => ({ ...padding, left: dynamicPaddingLeft }), [padding, dynamicPaddingLeft]);

  // 7. Custom Tick Values
  const customTickValues = useMemo(
    () => calculateCustomTickValues(filteredData, tickYCount),
    [filteredData, tickYCount]
  );

  // 9. Render
  return (
    <div ref={chartContainerRef} style={{ height: `${height}px` }}>
      <Button isDisabled={!brushDomain} variant="control" onClick={handleBrushClear}>
        Reset zoom
      </Button>

      {chartWidth > 0 && (
        <Chart
          width={chartWidth}
          height={height - CHART_CONFIG.LAYOUT.CHART_OFFSET}
          legendData={showLegend ? legendData : []}
          legendOrientation={legendOrientation}
          legendPosition={legendPosition}
          themeColor={props.themeColor || ChartThemeColor.multi}
          padding={calculatedPadding}
          containerComponent={
            <CursorVoronoiContainer
              brushDimension="x"
              brushStyle={{ stroke: 'transparent', fill: isDragging ? 'black' : 'transparent', fillOpacity: 0.1 }}
              defaultBrushArea={'none'}
              onBrushDomainChange={handleBrush}
              onBrushDomainChangeEnd={handleBrushEnd}
              voronoiDimension="x"
              handleWidth={0}
              labels={({ datum }: { datum: skAxisXY }) => formatY(datum.y)}
              labelComponent={
                <ChartLegendTooltip
                  legendData={legendData}
                  title={(datum) => `${formatX(Number(datum.x), endDate - startDate)}`}
                  cornerRadius={CHART_CONFIG.TOOLTIP.CORNER_RADIUS}
                  flyoutStyle={CHART_CONFIG.TOOLTIP.STYLE}
                />
              }
              mouseFollowTooltips
              voronoiPadding={CHART_CONFIG.TOOLTIP.PADDING}
            />
          }
          {...props}
        >
          {title && (
            <ChartLabel
              text={title}
              x={20}
              y={-40}
              textAnchor="start"
              style={{ fontSize: CHART_CONFIG.AXIS.TITLE_FONT_SIZE }}
            />
          )}

          <ChartAxis
            style={{
              tickLabels: {
                fontSize: CHART_CONFIG.AXIS.DEFAULT_FONT_SIZE
              }
            }}
            tickFormat={(tick) => tick && formatX(tick, endDate - startDate)}
            tickCount={tickXCount}
            domain={[startDate, endDate]}
            showGrid
          />
          <ChartAxis
            label={axisYLabel}
            dependentAxis
            style={{
              tickLabels: { fontSize: CHART_CONFIG.AXIS.DEFAULT_FONT_SIZE },
              axisLabel: {
                fontSize: CHART_CONFIG.AXIS.DEFAULT_FONT_SIZE,
                padding: CHART_CONFIG.AXIS.LABEL_PADDING
              }
            }}
            domain={[Math.min(...customTickValues), Math.max(...customTickValues)]}
            tickValues={customTickValues}
            tickFormat={(tick) => tick && formatY(tick < 0.001 ? 0 : tick)}
            showGrid
          />
          <ChartGroup>
            {filteredData.map((series, index) =>
              isChartLine ? (
                <ChartLine key={index} data={series} name={legendData[index]?.name} />
              ) : (
                <ChartArea key={index} data={series} name={legendData[index]?.name} />
              )
            )}
          </ChartGroup>
        </Chart>
      )}
    </div>
  );
};

export default SkChartArea;
