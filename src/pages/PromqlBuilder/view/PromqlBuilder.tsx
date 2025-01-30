import { useRef, useState } from 'react';

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Button,
  Stack,
  StackItem,
  InputGroup,
  InputGroupItem,
  Panel,
  PanelMain,
  debounce
} from '@patternfly/react-core';
import { useQuery } from '@tanstack/react-query';
import * as monaco from 'monaco-editor';
import MonacoEditor from 'react-monaco-editor';

import { PrometheusApi } from '../../../API/Prometheus.api';
import './PromqlBuilder.css';
import SkChartArea from '../../../core/components/SkCharts/SkChartArea';
import { PromQLError, SuggestController } from '../../../types/PromBuilder.interfaces';
import { completionItemsProvider } from '../config/Completition';
import { editorTheme } from '../config/EditorTheme';
import { languageConfiguration } from '../config/LanguageConfig';
import { monarchTokensProvider } from '../config/MonarchTokensProvider';
import { MONACO_OPTIONS } from '../config/UI';
import { applyErrorMarkers, validatePromQLWithPositions } from '../config/Validation';
import { convertPromQLToSkAxisXY, extractMetricInfo, formatY } from '../dataConversion.utils';
import { LANGUAGE_ID } from '../PromqlBuilder.constants';

const DISPLAY_MARKERS_TIMEOUT = 1000;
const DEBOUNCE_QUERY_TIMEOUT = 300;

const PromqlBuilder = function () {
  const [query, setQuery] = useState('');
  const [errors, setErrors] = useState<PromQLError[]>([]);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);

  // Query execution
  const { data, refetch } = useQuery({
    enabled: false,
    queryKey: ['PrometheusApi.fetchCustomQuery', query],
    queryFn: () =>
      PrometheusApi.fetchCustomQuery({
        query: query.trim(),
        start: Date.now() / 1000 - 60,
        end: Date.now() / 1000
      })
  });

  // Configuration for Monaco editor
  const handleDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
    monacoRef.current = monacoInstance;
    editorRef.current = editor;

    // Set tokens provider
    monacoInstance.languages.setMonarchTokensProvider(LANGUAGE_ID, monarchTokensProvider);
    // Register language
    monacoInstance.languages.register({ id: LANGUAGE_ID });
    // Configure language settings
    monacoInstance.languages.setLanguageConfiguration(LANGUAGE_ID, languageConfiguration);
    // Register completion provider
    monacoInstance.languages.registerCompletionItemProvider(LANGUAGE_ID, completionItemsProvider);
    // Configure theme
    monacoInstance.editor.defineTheme('promqlTheme', editorTheme);
    monacoInstance.editor.setTheme('promqlTheme');

    editor.onKeyDown((e) => {
      if (e.keyCode === monacoInstance.KeyCode.Enter) {
        const suggestController = editor.getContribution('editor.contrib.suggestController') as SuggestController;

        if (suggestController.model.state === 0) {
          e.preventDefault();

          // Get current value directly from editor
          const currentQuery = editor.getValue().trim();
          const model = editor.getModel();

          if (model) {
            const currentErrors = validatePromQLWithPositions(currentQuery);

            if (currentErrors.length === 0 && currentQuery) {
              refetch();
            }
          }
        }
      }
    });
  };

  const handleEditorChange = (value: string) => {
    const model = editorRef.current?.getModel() as monaco.editor.ITextModel;
    const promqlErrors = validatePromQLWithPositions(value);

    setQuery(value.trim());
    setErrors(promqlErrors);

    setTimeout(() => {
      applyErrorMarkers(model, promqlErrors);
    }, DISPLAY_MARKERS_TIMEOUT);
  };

  const handleExecuteQuery = () => {
    if (errors.length === 0 && query) {
      refetch();
    }
  };

  return (
    <Card isPlain isFullHeight>
      <CardHeader>
        <CardTitle>PromQL Query Builder </CardTitle>
        <p>
          Start typing your query or press <b>Ctrl+Space</b> to get suggestions.
        </p>
      </CardHeader>

      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <InputGroup>
              <InputGroupItem isFill>
                <Panel
                  variant="bordered"
                  style={{
                    width: '100%',
                    height: '100%',
                    padding: 5
                  }}
                >
                  <PanelMain
                    style={{
                      height: '100%'
                    }}
                  >
                    <MonacoEditor
                      language={LANGUAGE_ID}
                      options={MONACO_OPTIONS}
                      theme="promqlTheme"
                      editorDidMount={handleDidMount}
                      onChange={debounce(handleEditorChange, DEBOUNCE_QUERY_TIMEOUT)}
                    />
                  </PanelMain>
                </Panel>
              </InputGroupItem>

              <InputGroupItem>
                <Button variant="control" onClick={handleExecuteQuery} isDisabled={errors.length > 0 || !query}>
                  Run
                </Button>
              </InputGroupItem>
            </InputGroup>
          </StackItem>

          <StackItem>
            <SkChartArea
              height={600}
              padding={{
                bottom: 50,
                left: 100,
                right: 0,
                top: 50
              }}
              formatY={(y: number) => formatY(y, query)}
              legendLabels={extractMetricInfo(data)}
              showLegend={true}
              data={convertPromQLToSkAxisXY(data, { start: Date.now() / 1000 - 60, end: Date.now() / 1000 })}
              isChartLine={true}
            />
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default PromqlBuilder;
