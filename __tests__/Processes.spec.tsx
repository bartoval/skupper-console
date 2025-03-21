import { Suspense } from 'react';

import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { Server } from 'miragejs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import processesData from '../mocks/data/PROCESSES.json';
import { loadMockServer } from '../mocks/server';
import { waitForElementToBeRemovedTimeout } from '../src/config/app';
import { getTestsIds } from '../src/config/testIds';
import LoadingPage from '../src/core/components/SkLoading';
import { ComponentRoutesPaths } from '../src/pages/Components/Components.enum';
import { ProcessesRoutesPaths } from '../src/pages/Processes/Processes.enum';
import Processes from '../src/pages/Processes/views/Processes';
import { SitesRoutesPaths } from '../src/pages/Sites/Sites.enum';
import { Providers } from '../src/providers';

const processesResults = processesData.results;

describe('Begin testing the Processes component', () => {
  let server: Server;

  beforeEach(() => {
    server = loadMockServer() as Server;
    server.logging = false;

    render(
      <Providers>
        <Suspense fallback={<LoadingPage />}>
          <Processes />
        </Suspense>
      </Providers>
    );
  });

  afterEach(() => {
    server.shutdown();
    vi.clearAllMocks();
  });

  it('should render a loading page when data is loading', () => {
    expect(screen.getByTestId(getTestsIds.loadingView())).toBeInTheDocument();
  });

  it('should render the Processes view after the data loading is complete', async () => {
    expect(screen.queryByTestId(getTestsIds.loadingView())).toBeInTheDocument();

    await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });
    expect(screen.getByTestId(getTestsIds.processesView())).toBeInTheDocument();
  });

  // it('should render a table with the Processes data after the data has loaded.', async () => {
  //   await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
  //     timeout: waitForElementToBeRemovedTimeout
  //   });

  //   expect(screen.getByText(processesResults[0].name)).toBeInTheDocument();
  // });

  it('Should ensure the Processes component renders with correct Component link href after loading page', async () => {
    await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });

    expect(screen.getAllByRole('link', { name: processesResults[0].componentName })[0]).toHaveAttribute(
      'href',
      `#${ComponentRoutesPaths.Components}/${processesResults[0].componentName}@${processesResults[0].componentId}`
    );
  });

  it('Should ensure the Processes component renders with correct Site link href after loading page', async () => {
    await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });

    expect(screen.getAllByRole('link', { name: processesResults[0].siteName })[0]).toHaveAttribute(
      'href',
      `#${SitesRoutesPaths.Sites}/${processesResults[0].siteName}@${processesResults[0].siteId}`
    );
  });

  it('Should ensure the Processes component renders with correct Name link href after loading page', async () => {
    await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });

    expect(screen.getByRole('link', { name: processesResults[0].name })).toHaveAttribute(
      'href',
      `#${ProcessesRoutesPaths.Processes}/${processesResults[0].name}@${processesResults[0].identity}`
    );
  });
});
