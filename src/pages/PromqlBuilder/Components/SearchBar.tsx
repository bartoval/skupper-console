import { useCallback, useEffect, useState } from 'react';

import {
  Button,
  Divider,
  InputGroup,
  InputGroupItem,
  List,
  ListItem,
  Panel,
  PanelMain,
  Popover,
  Stack,
  StackItem,
  Title,
  Tooltip
} from '@patternfly/react-core';
import { HistoryIcon, OutlinedClockIcon, PlayIcon } from '@patternfly/react-icons';
import MonacoEditor from 'react-monaco-editor';

import {
  defaultTimeInterval,
  PrometheusLabelsV2,
  PrometheusMetricsV2,
  timeIntervalMap
} from '../../../config/prometheus';
import SkSelect from '../../../core/components/SkSelect';
import { MONACO_OPTIONS } from '../config/UI';
import { useSearch } from '../hooks/useSearch';
import { LANGUAGE_ID } from '../PromqlBuilder.constants';

const BUTTON_RUN_LABEL = 'Run Query';
const BUTTON_LABELS_LABEL = 'Labels';
const BUTTON_METRICS_LABEL = 'Metrics';
const BUTTON_METRIC_BROWSER_LABEL = 'Browser Metrics';

export interface SearchProps {
  initialQuery?: string;
  disabled?: boolean;
  onExecute: (query: string) => void;
  onQueryChange?: (query: string) => void;
  onSelectFilters?: (interval: number) => void;
  onOpenDetails?: () => void;
}

const getPrometheusMetrics = (): string[] => Object.values(PrometheusMetricsV2);

const getPrometheusLabels = (): string[] => {
  const allLabels = Object.values(PrometheusLabelsV2);

  return allLabels.filter((label) => !label.endsWith('_id'));
};

const SearchBar = function ({
  initialQuery = '',
  disabled,
  onQueryChange = () => null,
  onExecute,
  onOpenDetails = () => null,
  onSelectFilters
}: SearchProps) {
  const [interval, setInterval] = useState<number>(defaultTimeInterval.seconds);

  const { query, errors, handleEditorChange, handleExecuteQuery, handleDidMount } = useSearch(
    onQueryChange,
    onExecute,
    initialQuery
  );

  const handleSelectTimeInterval = useCallback(
    (selection: string | number | undefined) => {
      const duration = selection as number;

      setInterval(duration);

      if (onSelectFilters) {
        onSelectFilters(duration);
      }
    },
    [onSelectFilters]
  );

  useEffect(() => {
    if (initialQuery) {
      handleEditorChange(initialQuery);
    }
  }, [initialQuery]);

  const metrics = getPrometheusMetrics();
  const labels = getPrometheusLabels();

  return (
    <InputGroup>
      <InputGroupItem>
        <Popover
          bodyContent={
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3">{BUTTON_METRICS_LABEL}</Title>
                <List isPlain>
                  {metrics.map((metric) => (
                    <ListItem key={metric}>{metric}</ListItem>
                  ))}
                </List>
              </StackItem>

              <Divider />

              <StackItem>
                <Title headingLevel="h3">{BUTTON_LABELS_LABEL}</Title>
                <br />
                <List isPlain>
                  {labels.map((label) => (
                    <ListItem key={label}>{label}</ListItem>
                  ))}
                </List>
              </StackItem>
            </Stack>
          }
        >
          <Button variant="link">{BUTTON_METRIC_BROWSER_LABEL}</Button>
        </Popover>
      </InputGroupItem>

      <InputGroupItem isFill>
        <Panel variant="bordered" style={{ width: '100%', height: '100%', padding: 5, marginRight: 10 }}>
          <PanelMain style={{ height: '100%' }}>
            <MonacoEditor
              value={query}
              language={LANGUAGE_ID}
              options={MONACO_OPTIONS}
              theme="promqlTheme"
              editorDidMount={handleDidMount}
              onChange={handleEditorChange}
            />
          </PanelMain>
        </Panel>
      </InputGroupItem>

      <InputGroupItem>
        <SkSelect
          selected={interval}
          items={Object.values(timeIntervalMap).map(({ label, seconds }) => ({
            id: seconds.toString(),
            label
          }))}
          icon={<OutlinedClockIcon />}
          onSelect={handleSelectTimeInterval}
        />
      </InputGroupItem>

      <InputGroupItem>
        <Tooltip content="View History">
          <Button variant="control" onClick={onOpenDetails} icon={<HistoryIcon />} />
        </Tooltip>
      </InputGroupItem>

      <InputGroupItem>
        <Button onClick={handleExecuteQuery} isDisabled={disabled || errors.length > 0 || !query} icon={<PlayIcon />}>
          {BUTTON_RUN_LABEL}
        </Button>
      </InputGroupItem>
    </InputGroup>
  );
};

export default SearchBar;
