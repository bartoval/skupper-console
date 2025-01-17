import { Quantiles } from './REST.enum';
import { PrometheusLabelsV2, PrometheusMetricsV2 } from '../config/prometheus';

export const queries = {
  // data transfer queries
  getByteRateInTimeRange(param: string, range: string, areDataReceived = false) {
    const label = areDataReceived ? PrometheusMetricsV2.ReceivedBytes : PrometheusMetricsV2.SentBytes;

    return `sum(rate(${label}{${param}}[${range}]))`;
  },

  // latency queries
  getPercentilesByLeInTimeRange(param: string, range: string, quantile: Quantiles) {
    return `histogram_quantile(${quantile},sum(rate(${PrometheusMetricsV2.LatencyBuckets}{${param}}[${range}]))by(le))`;
  },

  getBucketCountsInTimeRange(param: string, range: string) {
    return `sum by(le)(floor(delta(${PrometheusMetricsV2.LatencyBuckets}{${param}}[${range}])))`;
  },

  // calculate the open connections serie
  getOpenConnections(paramSource: string) {
    return `sum(${PrometheusMetricsV2.TcpOpenConnections}{${paramSource}}-${PrometheusMetricsV2.TcpCloseCOnnections}{${paramSource}})`;
  },

  // http request queries
  getRequestRateByMethodInInTimeRange(param: string, range: string) {
    return `sum by(${PrometheusLabelsV2.Method})(rate(${PrometheusMetricsV2.HttpRequests}{${param}}[${range}]))`;
  },

  // http response queries
  getResponseCountsByPartialCodeInTimeRange(param: string, range: string) {
    return `sum by(partial_code)(label_replace(increase(${PrometheusMetricsV2.HttpRequests}{${param}}[${range}]),"partial_code", "$1", "${PrometheusLabelsV2.Code}","(.*).{2}"))`;
  },

  getResponseRateByPartialCodeInTimeRange(param: string, range: string) {
    return `sum by(partial_code)(label_replace(rate((${PrometheusMetricsV2.HttpRequests}{${param}}[${range}])),"partial_code", "$1", "${PrometheusLabelsV2.Code}","(.*).{2}"))`;
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
  }
};
