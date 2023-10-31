import { FC, Suspense } from 'react';

import { Button } from '@patternfly/react-core';
import { fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { Server } from 'miragejs';
import * as router from 'react-router';

import { waitForElementToBeRemovedTimeout } from '@config/config';
import { getTestsIds } from '@config/testIds';
import { GraphReactAdaptorProps } from '@core/components/Graph/Graph.interfaces';
import { Wrapper } from '@core/components/Wrapper';
import processesData from '@mocks/data/PROCESSES.json';
import servicesData from '@mocks/data/SERVICES.json';
import { loadMockServer } from '@mocks/server';
import LoadingPage from '@pages/shared/Loading';

import TopologyProcesses from '../components/TopologyProcesses';
import { TopologyLabels } from '../Topology.enum';

const navigate = jest.fn();

const processesResults = processesData.results;
const servicesResults = servicesData.results;
const serviceNameSelected = servicesResults[2].name;

const MockGraphComponent: FC<GraphReactAdaptorProps> = function ({ onClickEdge, onClickNode, onClickCombo }) {
  return (
    <>
      <Button onClick={() => onClickNode && onClickNode({ id: processesResults[0].identity })}>onClickNode</Button>
      <Button
        onClick={() =>
          onClickEdge && onClickEdge({ id: `${processesResults[2].identity}-to-${processesResults[1].identity}` })
        }
      >
        onClickEdge
      </Button>
      <Button onClick={() => onClickCombo && onClickCombo({ id: 'combo', label: 'combo' })}>onClickCombo</Button>
    </>
  );
};

describe('Begin testing the Topology component', () => {
  let server: Server;

  beforeEach(() => {
    server = loadMockServer() as Server;
    server.logging = false;

    render(
      <Wrapper>
        <Suspense fallback={<LoadingPage />}>
          <TopologyProcesses
            serviceId={serviceNameSelected}
            id={processesResults[2].name}
            GraphComponent={MockGraphComponent}
          />
        </Suspense>
      </Wrapper>
    );
  });

  afterEach(() => {
    server.shutdown();
    jest.clearAllMocks();
  });

  it('should render the Topology view after the data loading is complete', async () => {
    await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });
    expect(screen.getByTestId('sk-topology-processes')).toBeInTheDocument();
  });

  it('should clicking on the service menu', async () => {
    await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });

    fireEvent.click(screen.getByText(servicesResults[2].name));
    expect(screen.getByText(servicesResults[0].name)).toBeInTheDocument();
    expect(screen.getByText(servicesResults[1].name)).toBeInTheDocument();

    fireEvent.click(screen.getByText(servicesResults[0].name));
    expect(screen.queryByText(servicesResults[2].name)).not.toBeInTheDocument();
  });

  it('should clicking on the service menu and use the search filter', async () => {
    await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });

    fireEvent.click(screen.getByText(servicesResults[2].name));

    fireEvent.change(screen.getByPlaceholderText(TopologyLabels.ServiceFilterPlaceholderText), {
      target: { value: servicesResults[0].name }
    });

    expect(screen.getByText(servicesResults[0].name)).toBeInTheDocument();
    expect(screen.queryByText(servicesResults[1].name)).not.toBeInTheDocument();
  });

  it('should clicking on the display menu and select/deselect the Protocol checkbox', async () => {
    await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });

    fireEvent.click(screen.getByText(TopologyLabels.DisplayPlaceholderText));
    expect(screen.getByRole('display-select')).toBeInTheDocument();

    fireEvent.click(screen.getByText(TopologyLabels.CheckboxShowProtocol));
  });

  it('should clicking on a node', async () => {
    jest.spyOn(router, 'useNavigate').mockImplementation(() => navigate);

    await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });

    fireEvent.click(screen.getByText('onClickNode'));
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('should clicking on a edge', async () => {
    await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });

    fireEvent.click(screen.getByText('onClickEdge'));
    expect(navigate).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('onClickCombo'));
    expect(navigate).toHaveBeenCalledTimes(2);
  });

  it('should clicking on a combo', async () => {
    jest.spyOn(router, 'useNavigate').mockImplementation(() => navigate);

    await waitForElementToBeRemoved(() => screen.queryByTestId(getTestsIds.loadingView()), {
      timeout: waitForElementToBeRemovedTimeout
    });

    fireEvent.click(screen.getByText('onClickCombo'));
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
