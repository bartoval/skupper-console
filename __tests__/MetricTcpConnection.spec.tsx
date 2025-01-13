import { Suspense } from 'react';

import { fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { Server } from 'miragejs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import processesData from '../mocks/data/PROCESSES.json';
import { loadMockServer } from '../mocks/server';
import { extendedProcessResponse } from '../mocks/server.API';
import * as PrometheusAPIModule from '../src/API/Prometheus.api';
import { waitForElementToBeRemovedTimeout } from '../src/config/app';
import { Labels } from '../src/config/labels';
import { getTestsIds } from '../src/config/testIds';
import LoadingPage from '../src/core/components/SkLoading';
import TcpConnection from '../src/pages/shared/Metrics/components/TcpConnection';
import { Providers } from '../src/providers';

const processResult = processesData.results[0] as extendedProcessResponse;

describe('Tcp component', () => {
  let server: Server;
  beforeEach(() => {
    server = loadMockServer() as Server;
    server.logging = false;
  });

  afterEach(() => {
    server.shutdown();
    vi.clearAllMocks();
  });

  it('should render the Tcp section of the metric', async () => {
    const handleGetisSectionExpanded = vi.fn();

    render(
      <Providers>
        <Suspense fallback={<LoadingPage />}>
          <TcpConnection
            selectedFilters={{
              sourceProcess: processResult.name
            }}
            openSections={true}
            forceUpdate={1}
            onGetIsSectionExpanded={handleGetisSectionExpanded}
          />
        </Suspense>
      </Providers>
    );

    await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });

    expect(screen.getByText(Labels.TcpConnections)).toBeInTheDocument();

    const button = screen.getByLabelText(Labels.TcpConnections)?.querySelector('button');

    if (button) {
      fireEvent.click(button);
    }

    expect(handleGetisSectionExpanded).toHaveBeenCalledTimes(1);
  });

  it('should not render the Tcp section', async () => {
    vi.spyOn(PrometheusAPIModule.PrometheusApi, 'fetchOpenConnections').mockImplementation(
      vi.fn().mockReturnValue({ data: null })
    );

    vi.spyOn(PrometheusAPIModule.PrometheusApi, 'fetchOpenConnectionsInTimeRange').mockImplementation(
      vi.fn().mockReturnValue({ data: null })
    );

    render(
      <Providers>
        <Suspense fallback={<LoadingPage />}>
          <TcpConnection
            selectedFilters={{
              sourceProcess: processResult.name
            }}
            openSections={true}
            forceUpdate={1}
          />
        </Suspense>
      </Providers>
    );

    await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });

    expect(screen.getByText(Labels.NoMetricFound)).toBeInTheDocument();
    expect(screen.getByText(Labels.NoMetricFoundDescription)).toBeInTheDocument();
  });
});
