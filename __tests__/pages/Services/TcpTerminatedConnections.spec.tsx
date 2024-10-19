import { Suspense } from 'react';

import { render, waitForElementToBeRemoved } from '@testing-library/react';
import { Server } from 'miragejs';


import BiflowData from '../../../mocks/data/FLOW_PAIRS.json';
import servicesData from '../../../mocks/data/SERVICES.json';
import { loadMockServer } from '../../../mocks/server';
import { waitForElementToBeRemovedTimeout } from '../../../src/config/config';
import { getTestsIds } from '../../../src/config/testIds';
import LoadingPage from '../../../src/core/components/SkLoading';
import { Wrapper } from '../../../src/core/components/Wrapper';
import TcpTerminatedConnections from '../../../src/pages/Services/components/TcpTerminatedConnections';

const servicesResults = servicesData.results;
const tcpBiFlowTerminated = BiflowData.results[6];

describe('Begin testing the TCP connections component', () => {
  let server: Server;

  beforeEach(() => {
    server = loadMockServer() as Server;
    server.logging = false;
  });

  afterEach(() => {
    server.shutdown();
    jest.clearAllMocks();
  });

  it('should render the Connection view -> Old Connections after the data loading is complete', async () => {
    const { queryByTestId, getByText, getAllByText } = render(
      <Wrapper>
        <Suspense fallback={<LoadingPage />}>
          <TcpTerminatedConnections routingKey={servicesResults[4].name} />
        </Suspense>
      </Wrapper>
    );

    await waitForElementToBeRemoved(() => queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });

    expect(getAllByText(tcpBiFlowTerminated.sourceProcessName)[0]).toBeInTheDocument();
    expect(getByText('Closed')).toBeInTheDocument();
  });
});
