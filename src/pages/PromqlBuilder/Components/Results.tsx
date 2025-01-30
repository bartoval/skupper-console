import { useCallback, useState, useMemo, memo, useEffect } from 'react';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem
} from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';

import { Labels } from '../../../config/labels';
import { generateChartColorClasses } from '../../../config/styles';
import SkChartArea from '../../../core/components/SkCharts/SkChartArea';
import SKEmptyData from '../../../core/components/SkEmptyData';
import { MatrixMetric } from '../../../types/Prometheus.interfaces';
import {
  convertPromQLToSkAxisXY,
  formatMetrics,
  extractMetricInfo,
  getMetricLabel,
  getChartTitle,
  formatY
} from '../utils/dataConversion';

interface ResultProps {
  data: MatrixMetric[] | undefined;
  interval: number;
  query?: string;
}

const Result = function ({ data, interval, query }: ResultProps) {
  const [labelsSelected, setLabelSelected] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number[]>([]);

  const handleSelectItem = useCallback((labelItem: string, index: number) => {
    setLabelSelected((prevLabelsSelected: string[]) => {
      if (prevLabelsSelected.includes(labelItem)) {
        return prevLabelsSelected.filter((labelSelected) => labelSelected !== labelItem);
      }

      return [...prevLabelsSelected, labelItem];
    });

    setSelectedIndex((prevIndexSelected: number[]) => {
      if (prevIndexSelected.includes(index)) {
        return prevIndexSelected.filter((indexSelected) => indexSelected !== index);
      }

      return [...prevIndexSelected, index];
    });
  }, []);

  const chartFormatYaxis = useCallback((y: number) => formatY(y, query), [query]);

  const selectAllToggle = useCallback(() => {
    const labels = labelsSelected.length ? [] : formatMetrics(data, chartFormatYaxis).map(({ label }) => label);
    const indexes = Array.from({ length: labels.length }, (_, i) => i);

    setLabelSelected(labels);
    setSelectedIndex(indexes);
  }, [chartFormatYaxis, data, labelsSelected.length]);

  const list = useMemo(() => formatMetrics(data, chartFormatYaxis), [chartFormatYaxis, data]);

  const filteredData = data?.filter((dataItem) => !labelsSelected.includes(getMetricLabel(dataItem.metric)));

  const chardData = useMemo(() => convertPromQLToSkAxisXY(filteredData, { interval }), [filteredData, interval]);
  const chartLabels = useMemo(() => extractMetricInfo(filteredData || []), [filteredData]);

  const colors = useMemo(() => generateChartColorClasses(data?.length || 0), [data]);
  const chartColors = colors.filter((_, index) => !selectedIndex.includes(index));
  const chartTitle = getChartTitle(query);

  useEffect(() => {
    setLabelSelected([]);
    setSelectedIndex([]);
  }, [data]);

  return (
    <Stack hasGutter>
      <StackItem>
        <SkChartArea
          title={chartTitle}
          colorScale={chartColors}
          data={chardData}
          height={600}
          formatY={chartFormatYaxis}
          showLegend={false}
          legendLabels={chartLabels}
          isChartLine={true}
        />
      </StackItem>

      <StackItem>
        <Title headingLevel="h2">{Labels.PromQlListTitle}</Title>
        <p>{Labels.PromQlListDescription}</p>
      </StackItem>

      <StackItem isFilled>
        <Card isFullHeight style={{ overflow: 'hidden' }}>
          {!!list.length && (
            <CardHeader>
              <Toolbar>
                <ToolbarContent>
                  <ToolbarItem>
                    <Button variant="link" onClick={selectAllToggle}>
                      {selectedIndex.length ? Labels.SelectAll : Labels.UnselectAll}
                    </Button>
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>
            </CardHeader>
          )}

          <CardBody style={{ overflow: 'auto', flexBasis: 0 }}>
            {!list.length && (
              <SKEmptyData
                message={Labels.NoEntriesQueryFound}
                description={Labels.NoEntriesQueryFoundDescription}
                icon={CubesIcon}
              />
            )}

            {!!list.length && (
              <DataList aria-label="metric list">
                {list.map((item, index) => (
                  <DataListItem key={index}>
                    <DataListItemRow style={{ paddingLeft: 0 }}>
                      <DataListItemCells
                        dataListCells={[
                          <DataListCell key="label content" isFilled={true} style={{ maxWidth: '90%' }}>
                            <Split>
                              <SplitItem>
                                <Button
                                  variant="control"
                                  onClick={() => handleSelectItem(item.label, index)}
                                  className="legend-square "
                                  style={{
                                    background: selectedIndex.includes(index) ? '' : colors[index]
                                  }}
                                />
                              </SplitItem>
                              <SplitItem>{item.label}</SplitItem>
                            </Split>
                          </DataListCell>,
                          <DataListCell alignRight key="value content" isFilled={false}>
                            <b>{item.value}</b>
                          </DataListCell>
                        ]}
                      />
                    </DataListItemRow>
                  </DataListItem>
                ))}
              </DataList>
            )}
          </CardBody>
        </Card>
      </StackItem>
    </Stack>
  );
};

export default memo(Result);
