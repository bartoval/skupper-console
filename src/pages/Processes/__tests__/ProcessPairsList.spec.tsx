import { Suspense } from 'react';

import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { Server } from 'miragejs';
import * as router from 'react-router';

import { ProcessPairsResponse, ProcessResponse, SitePairsResponse } from '@API/REST.interfaces';
import { waitForElementToBeRemovedTimeout } from '@config/config';
import { getTestsIds } from '@config/testIds';
import { Wrapper } from '@core/components/Wrapper';
import processesPairsData from '@mocks/data/PROCESS_PAIRS.json';
import processesData from '@mocks/data/PROCESSES.json';
import { loadMockServer } from '@mocks/server';
import LoadingPage from '@pages/shared/Loading';

import ProcessPairsList from '../components/ProcessPairsList';
import { ProcessesLabels, ProcessesRoutesPaths } from '../Processes.enum';

const processResult = processesData.results[7] as ProcessResponse;
const processPairsResult = processesPairsData.results[7] as ProcessPairsResponse | SitePairsResponse;

describe('Processes Pairs component', () => {
  let server: Server;
  beforeEach(() => {
    server = loadMockServer() as Server;
    server.logging = false;
    // Mock URL query parameters and inject them into the component
    jest.spyOn(router, 'useParams').mockReturnValue({ id: `${processResult.name}@${processResult.identity}` });

    render(
      <Wrapper>
        <Suspense fallback={<LoadingPage />}>
          <ProcessPairsList process={processResult} />
        </Suspense>
      </Wrapper>
    );
  });

  afterEach(() => {
    server.shutdown();
    jest.clearAllMocks();
  });

  it('Should ensure the Process associated renders with correct link href after loading page', async () => {
    await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });

    expect(screen.getAllByRole('link', { name: 'view pairs' })[0]).toHaveAttribute(
      'href',
      `#${ProcessesRoutesPaths.Processes}/${processPairsResult.destinationName}@${processPairsResult.destinationId}/${ProcessesLabels.ProcessPairs}@${processesPairsData.results[6].identity}@${processesPairsData.results[6].protocol}?type=${ProcessesLabels.ProcessPairs}`
    );
  });
});
