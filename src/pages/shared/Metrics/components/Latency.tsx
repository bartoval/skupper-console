import { FC, useCallback, useEffect, useState } from 'react';

import { Card, CardBody, CardExpandableContent, CardHeader, CardTitle } from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import LatencyCharts from './LatencyCharts';
import { Labels } from '../../../../config/labels';
import SKEmptyData from '../../../../core/components/SkEmptyData';
import SkIsLoading from '../../../../core/components/SkIsLoading';
import { QueryMetricsParams, QueriesMetrics } from '../../../../types/Metrics.interfaces';
import { MetricsController } from '../services';

interface LatencyProps {
  title?: string;
  selectedFilters: QueryMetricsParams;
  openSections?: boolean;
  forceUpdate?: number;
  refetchInterval?: number;
  onGetIsSectionExpanded?: Function;
}

const minChartHeight = 680;

const Latency: FC<LatencyProps> = function ({
  title = '',
  selectedFilters,
  forceUpdate,
  openSections = false,
  refetchInterval,
  onGetIsSectionExpanded
}) {
  const [isExpanded, setIsExpanded] = useState(openSections);

  const { data, refetch, isRefetching, isLoading } = useQuery({
    queryKey: [QueriesMetrics.GetLatency, selectedFilters],
    queryFn: () => MetricsController.getLatencyPercentiles(selectedFilters),
    refetchInterval,
    placeholderData: keepPreviousData,
    enabled: isExpanded
  });

  const {
    data: bucketsData,
    refetch: refetchBuckets,
    isRefetching: isRefetchingBuckets,
    isLoading: isLoadingBuckets
  } = useQuery({
    queryKey: [QueriesMetrics.GetLatencyBuckets, selectedFilters],
    queryFn: () => MetricsController.getLatencyBuckets(selectedFilters),
    refetchInterval,
    placeholderData: keepPreviousData,
    enabled: isExpanded
  });

  const handleExpand = useCallback(() => {
    setIsExpanded(!isExpanded);

    if (onGetIsSectionExpanded) {
      onGetIsSectionExpanded({ [title]: !isExpanded });
    }
  }, [isExpanded, onGetIsSectionExpanded, title]);

  //Filters: refetch manually the prometheus API
  const handleRefetchMetrics = useCallback(() => {
    refetch();
    refetchBuckets();
  }, [refetch, refetchBuckets]);

  useEffect(() => {
    if (forceUpdate && isExpanded) {
      handleRefetchMetrics();
    }
  }, [forceUpdate, handleRefetchMetrics, isExpanded]);

  return (
    <Card isExpanded={isExpanded} aria-label={title} isFullHeight>
      <CardHeader onExpand={handleExpand}>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardExpandableContent>
        {/*display grid center the child SKEmptyData */}
        <CardBody style={{ minHeight: minChartHeight, display: 'grid' }}>
          {(isLoading || isLoadingBuckets) && <SkIsLoading />}
          {!isLoading && !isLoadingBuckets && data?.length && bucketsData && (
            <>
              {!isLoading && !isLoadingBuckets && isRefetching && isRefetchingBuckets && <SkIsLoading />}
              <LatencyCharts
                latenciesData={data}
                bucketsData={bucketsData.distribution}
                summary={bucketsData.summary}
              />
            </>
          )}
          {!isLoading && !isLoadingBuckets && (!data?.length || !bucketsData) && (
            <SKEmptyData
              message={Labels.NoMetricFound}
              description={Labels.NoMetricFoundDescription}
              icon={SearchIcon}
            />
          )}
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
};

export default Latency;
