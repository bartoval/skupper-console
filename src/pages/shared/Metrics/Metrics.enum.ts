export enum MetricsLabels {
  TrafficSent = 'transmitted',
  TrafficReceived = 'received',
  RequestsPerSecondsSeriesAxisYLabel = 'Request rate',
  ClientErrorRateSeriesAxisYLabel = 'Client Error rate',
  ServerErrorRateSeriesAxisYLabel = 'Server Error rate',
  FilterAllSourceProcesses = 'All processes',
  FilterAllDestinationProcesses = 'All clients and servers',
  FilterProtocolsDefault = 'All Protocols',
  NoMetricFoundMessage = 'No metrics found. Try adjusting your filter options',
  LatencyMetricAvg = 'Avg latency',
  LatencyMetric50quantile = '50th percentile',
  LatencyMetric90quantile = '90th percentile',
  LatencyMetric99quantile = '99th percentile',
  RequestTotalTitle = 'Total Requests',
  RequestRateAvgTitle = 'Avg. Request rate',
  ByteRateAvgCol = 'avg',
  ByteRateTotalCol = 'total',
  ByteRateCurrentCol = 'current',
  ByteRateMaxCol = 'max',
  MetricFilters = 'Filters',
  RefetchData = 'Data update',
  LatencyTitle = 'Http Latency',
  RequestsTitle = 'Http Requests',
  HttpStatus = 'Http Response Status'
}
