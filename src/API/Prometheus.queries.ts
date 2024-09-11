import { PrometheusLabelsV2, PrometheusMetricsV2 } from '@config/prometheus';
import { IntervalTimePropValue } from '@sk-types/Prometheus.interfaces';

import { AvailableProtocols, Quantiles } from './REST.enum';

export const queries = {
  // data transfer queries
  getByteRateByDirectionInTimeRange(param: string, range: IntervalTimePropValue, areDataReceived = false) {
    const label = areDataReceived ? PrometheusMetricsV2.ReceivedBytes : PrometheusMetricsV2.SentBytes;

    return `sum(rate(${label}{${param}}[${range}]))`;
  },

  // latency queries
  getPercentilesByLeInTimeRange(param: string, range: IntervalTimePropValue, quantile: Quantiles) {
    return `histogram_quantile(${quantile},sum(rate(${PrometheusMetricsV2.LatencyBuckets}{${param}}[${range}]))by(le))`;
  },

  getBucketCountsInTimeRange(param: string, range: IntervalTimePropValue) {
    return `sum by(le)(floor(delta(${PrometheusMetricsV2.LatencyBuckets}{${param}}[${range}])))`;
  },

  // calculate the open connections serie
  getOpenConnections(paramSource: string) {
    return `sum(${PrometheusMetricsV2.TcpOpenOnnections}{${paramSource}})`;
  },

  // count the number of active tcp flows in the services table
  getTcpActiveFlowsByService() {
    return `sum by(${PrometheusLabelsV2.RoutingKey})(${PrometheusMetricsV2.TcpOpenOnnections}{protocol="${AvailableProtocols.Tcp}"})`;
  },

  // http request queries
  getRequestRateByMethodInInTimeRange(param: string, range: IntervalTimePropValue) {
    return `sum by(${PrometheusLabelsV2.Method})(rate(${PrometheusMetricsV2.HttpRequestMethod}{${param}}[${range}]))`;
  },

  // http response queries
  getResponseCountsByPartialCodeInTimeRange(param: string, range: IntervalTimePropValue) {
    return `sum by(partial_code)(label_replace(sum_over_time(${PrometheusMetricsV2.HttpResponse}{${param}}[${range}]),"partial_code", "$1", "${PrometheusLabelsV2.Code}","(.*).{2}"))`;
  },

  getResponseRateByPartialCodeInTimeRange(param: string, range: IntervalTimePropValue) {
    return `sum by(partial_code)(label_replace(rate((${PrometheusMetricsV2.HttpResponse}{${param}}[${range}])),"partial_code", "$1", "${PrometheusLabelsV2.Code}","(.*).{2}"))`;
  },

  // TOPOLOGY instant queries
  getAllPairsBytes(groupBy: string, params?: string, areDataReceived = false) {
    const label = areDataReceived ? PrometheusMetricsV2.ReceivedBytes : PrometheusMetricsV2.SentBytes;

    if (params) {
      return `sum by(${groupBy})(${label}{${params}})`;
    }

    return `sum by(${groupBy})(${label})`;
  },

  getAllPairsByteRates(groupBy: string, params?: string, areDataReceived = false) {
    const label = areDataReceived ? PrometheusMetricsV2.ReceivedBytes : PrometheusMetricsV2.SentBytes;

    if (params) {
      return `sum by(${groupBy})(rate(${label}{${params}}[1m]))`;
    }

    return `sum by(${groupBy})(rate(${label}[1m]))`;
  },

  getAllPairsLatencies(groupBy: string, params?: string) {
    if (params) {
      return `sum by(${groupBy})(rate(${PrometheusMetricsV2.LatencySum}{${params}}[1m]))`;
    }

    return `sum by(${groupBy})(rate(${PrometheusMetricsV2.LatencySum}[1m]))`;
  },

  // SERVICES queries
  // calculate the open connections count (used in the services table)

  // calculate the TCP byterate for exposed services
  getTcpByteRateByService(serviceName: string) {
    return `rate(${PrometheusMetricsV2.SentBytes}{protocol="tcp",  ${PrometheusLabelsV2.RoutingKey}="${serviceName}"}[1m])`;
  },

  // calculate the byterate used by the sankey diagram in the requests/connections page
  getResourcePairsByService(param: string, groupBy: string, time: string) {
    return `sum by(${groupBy})(rate(${PrometheusMetricsV2.SentBytes}{${param}}[${time}]) > 0)`;
  }
};
