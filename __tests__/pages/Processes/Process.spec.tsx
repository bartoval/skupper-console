import { Suspense } from 'react';

import { fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { Server } from 'miragejs';
import * as router from 'react-router';

import processesData from '../../../mocks/data/PROCESSES.json';
import { loadMockServer } from '../../../mocks/server';
import { waitForElementToBeRemovedTimeout } from '../../../src/config/config';
import { getTestsIds } from '../../../src/config/testIds';
import { Wrapper } from '../../../src/core/components/Wrapper';
import { ProcessesLabels } from '../../../src/pages/Processes/Processes.enum';
import Process from '../../../src/pages/Processes/views/Process';
import LoadingPage from '../../../src/pages/shared/Loading';
import { ProcessResponse } from '../../../src/types/REST.interfaces';

const processResult = processesData.results[0] as ProcessResponse;

describe('Process component', () => {
  let server: Server;
  beforeEach(() => {
    server = loadMockServer() as Server;
    server.logging = false;
    // Mock URL query parameters and inject them into the component
    jest.spyOn(router, 'useParams').mockReturnValue({ id: `${processResult.name}@${processResult.identity}` });

    render(
      <Wrapper>
        <Suspense fallback={<LoadingPage />}>
          <Process />
        </Suspense>
      </Wrapper>
    );
  });

  afterEach(() => {
    server.shutdown();
    jest.clearAllMocks();
  });

  it('should render the Process view after the data loading is complete', async () => {
    // Wait for the loading page to disappear before continuing with the test.
    await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });

    expect(screen.getByTestId(getTestsIds.processView(processResult.identity))).toBeInTheDocument();
    expect(screen.getAllByRole('sk-heading')[0]).toHaveTextContent(processResult.name);

    fireEvent.click(screen.getByText(ProcessesLabels.Details));
    expect(screen.getByText(ProcessesLabels.Details).closest('li')?.classList.contains('pf-m-current'));

    fireEvent.click(screen.getByText(ProcessesLabels.ProcessPairs));
    expect(screen.getByText(ProcessesLabels.ProcessPairs).closest('li')?.classList.contains('pf-m-current'));
  });
});
