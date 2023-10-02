import { FC, useCallback, useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';

import { isPrometheusActive } from '@config/config';

import TrafficCharts from './TrafficCharts';
import { QueriesMetrics, SelectedFilters } from '../Metrics.interfaces';
import MetricsController from '../services';

interface TrafficProps {
  selectedFilters: SelectedFilters;
  openSections?: boolean;
  forceUpdate?: number;
  refetchInterval?: number;
}

const Traffic: FC<TrafficProps> = function ({ selectedFilters, forceUpdate, refetchInterval }) {
  const { data, refetch } = useQuery(
    [QueriesMetrics.GetTraffic, selectedFilters],
    () => MetricsController.getTraffic(selectedFilters),
    {
      enabled: isPrometheusActive,
      refetchInterval,
      keepPreviousData: true
    }
  );

  //Filters: refetch manually the prometheus API
  const handleRefetchMetrics = useCallback(() => {
    isPrometheusActive && refetch();
  }, [refetch]);

  useEffect(() => {
    if (forceUpdate) {
      handleRefetchMetrics();
    }
  }, [forceUpdate, handleRefetchMetrics]);

  if (!data) {
    return null;
  }

  return <TrafficCharts bytesData={data.bytesData} byteRateData={data.byteRateData} />;
};

export default Traffic;