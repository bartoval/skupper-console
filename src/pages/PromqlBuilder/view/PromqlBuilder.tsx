import { useState, useCallback, useRef } from 'react';

import {
  Alert,
  Card,
  CardBody,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Stack,
  StackItem,
  Title
} from '@patternfly/react-core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { PrometheusApi } from '../../../API/Prometheus.api';
import { Labels } from '../../../config/labels';
import { defaultTimeInterval } from '../../../config/prometheus';
import QueryHistoryComponent from '../Components/Details';
import Result from '../Components/Results';
import SearchBar from '../Components/SearchBar';
import useQueryHistory from '../hooks/useQueryHistory';
import { sortPrometheusResults } from '../utils/dataConversion';

import './PromqlBuilder.css';

const PromqlBuilder = function () {
  const [responseError, setResponseError] = useState('');
  const [areDetailsExpanded, setAreDetailsExpanded] = useState(false);
  const { addQuery } = useQueryHistory();

  const queryRef = useRef('');
  const intervalRef = useRef(defaultTimeInterval.seconds);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['PrometheusApi.fetchCustomQuery', queryRef.current, intervalRef.current],
    queryFn: () => (queryRef.current ? fetchData(queryRef.current) : { result: [], query: '' }),
    throwOnError: false,
    placeholderData: keepPreviousData
  });

  const fetchData = async (queryString: string) => {
    try {
      const end = Date.now() / 1000;
      const start = end - intervalRef.current;

      const result = await PrometheusApi.fetchCustomQuery({
        query: queryString.trim(),
        start,
        end
      });

      if (responseError) {
        setResponseError('');
      }

      addQuery(queryRef.current);

      return { result, query: queryRef.current };
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string }>;
      const errorMessage = axiosError.response?.data?.error || axiosError.message || 'An unknown error occurred';
      setResponseError(errorMessage);

      return undefined;
    }
  };

  const handleRunQuery = useCallback(
    (queryToRun: string) => {
      queryRef.current = queryToRun;
      refetch();
    },
    [refetch]
  );

  const handleIntervalSelected = useCallback((interval: number) => {
    intervalRef.current = interval;
  }, []);

  const handleOpenDetails = useCallback(() => {
    setAreDetailsExpanded(true);
  }, []);

  const panelContent = (
    <DrawerPanelContent defaultSize={'700px'}>
      <DrawerHead>
        <Title headingLevel="h1">{Labels.Details}</Title>
        <DrawerActions>
          <DrawerCloseButton onClick={() => setAreDetailsExpanded(false)} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody style={{ overflow: 'auto' }} hasNoPadding>
        <Card isPlain>
          <CardBody>
            <Title headingLevel="h4">History</Title>
            <QueryHistoryComponent onExecute={handleRunQuery} />
          </CardBody>
        </Card>
      </DrawerPanelBody>
    </DrawerPanelContent>
  );

  return (
    <Drawer isExpanded={areDetailsExpanded} isInline>
      <DrawerContent panelContent={panelContent}>
        <DrawerContentBody>
          <Card isFullHeight isPlain>
            <CardBody>
              <Stack hasGutter>
                <StackItem>
                  <Title headingLevel="h1">{Labels.PromQlTitle}</Title>
                  {Labels.PromQlDescription}
                </StackItem>

                <StackItem>
                  <SearchBar
                    initialQuery={queryRef.current}
                    onExecute={handleRunQuery}
                    disabled={isFetching}
                    onSelectFilters={handleIntervalSelected}
                    onOpenDetails={handleOpenDetails}
                  />
                </StackItem>

                <StackItem>{responseError && <Alert variant="danger" title={responseError} />}</StackItem>

                <StackItem isFilled>
                  <Result
                    data={sortPrometheusResults(data?.result)}
                    query={data?.query}
                    interval={intervalRef.current}
                  />
                </StackItem>
              </Stack>
            </CardBody>
          </Card>
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export default PromqlBuilder;
