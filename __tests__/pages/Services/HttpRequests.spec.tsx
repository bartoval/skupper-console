import { Suspense } from 'react';

import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { Server } from 'miragejs';


import httpRequests from '../../../mocks/data/HTTP_REQUESTS.json';
import servicesData from '../../../mocks/data/SERVICES.json';
import { loadMockServer } from '../../../mocks/server';
import { waitForElementToBeRemovedTimeout } from '../../../src/config/app';
import { getTestsIds } from '../../../src/config/testIds';
import LoadingPage from '../../../src/core/components/SkLoading';
import { Wrapper } from '../../../src/core/components/Wrapper';
import HttpRequests from '../../../src/pages/Services/components/HttpRequests';

const servicesResults = servicesData.results;
const httpRequestResults = httpRequests.results;

describe('Begin testing the Http requests component', () => {
  let server: Server;

  beforeEach(() => {
    server = loadMockServer() as Server;
    server.logging = false;
  });

  afterEach(() => {
    server.shutdown();
    jest.clearAllMocks();
  });

  it('should render the Requests view -> Requests after the data loading is complete', async () => {
    render(
      <Wrapper>
        <Suspense fallback={<LoadingPage />}>
          <HttpRequests routingKey={servicesResults[1].name} />
        </Suspense>
      </Wrapper>
    );

    await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });

    expect(screen.getAllByText(httpRequestResults[0].sourceProcessName)[0]).toBeInTheDocument();
  });
});
