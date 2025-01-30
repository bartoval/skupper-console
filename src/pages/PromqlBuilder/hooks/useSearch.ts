import { useRef, useState, useCallback, useEffect } from 'react';

import { debounce } from '@patternfly/react-core';
import type { editor, IDisposable } from 'monaco-editor';
import { monaco } from 'react-monaco-editor';

import { MonacoRefs, PromQLError, SuggestController, UseSearchReturn } from '../../../types/PromBuilder.interfaces';
import { completionItemProvider } from '../config/CompletitionItemProvider';
import { editorTheme } from '../config/EditorTheme';
import { languageConfiguration } from '../config/LanguageConfig';
import { monarchTokensProvider } from '../config/MonarchTokensProvider';
import { applyErrorMarkers, validatePromQLWithPositions } from '../config/validation/Validation';
import { LANGUAGE_ID } from '../PromqlBuilder.constants';

const DISPLAY_MARKERS_TIMEOUT = 100;
const DEBOUNCE_QUERY_TIMEOUT = 300;

export const useSearch = (
  onQueryChange: (query: string) => void,
  onExecute: (query: string) => void,
  initialQuery: string = ''
): UseSearchReturn => {
  const [query, setQuery] = useState(initialQuery);
  const [errors, setErrors] = useState<PromQLError[]>([]);

  const editorRef = useRef<MonacoRefs>({
    editor: null,
    disposables: []
  });

  const monacoInstanceRef = useRef<typeof monaco | null>(null);

  const initializeMonaco = useCallback(
    (editor: editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
      editorRef.current.editor = editor;
      monacoInstanceRef.current = monacoInstance;

      monacoInstance.languages.register({ id: LANGUAGE_ID });

      editorRef.current.disposables = [
        monacoInstance.languages.setMonarchTokensProvider(LANGUAGE_ID, monarchTokensProvider),
        monacoInstance.languages.setLanguageConfiguration(LANGUAGE_ID, languageConfiguration),
        monacoInstance.languages.registerCompletionItemProvider(LANGUAGE_ID, completionItemProvider),
        monacoInstance.editor.defineTheme('promqlTheme', editorTheme),
        monacoInstance.editor.setTheme('promqlTheme')
      ].filter((d): d is IDisposable => d !== undefined);

      editor.onKeyDown((e) => {
        if (e.keyCode === monacoInstance.KeyCode.Enter) {
          const suggestController = editor.getContribution('editor.contrib.suggestController') as SuggestController;

          if (suggestController.model.state === 0) {
            e.preventDefault();
            e.stopPropagation();

            const currentQuery = editor.getValue().trim();
            const model = editor.getModel();

            if (model) {
              const currentErrors = validatePromQLWithPositions(currentQuery);

              if (currentErrors.length === 0 && currentQuery) {
                onExecute(currentQuery);
              }
            }
          }
        }
      });
    },
    [onExecute]
  );

  const updateQueryAndErrors = useCallback(
    (value: string) => {
      const model = editorRef.current.editor?.getModel() as editor.ITextModel;
      const promqlErrors = validatePromQLWithPositions(value);

      setQuery(value.trim());
      setErrors(promqlErrors);
      onQueryChange(value.trim());

      setTimeout(() => {
        applyErrorMarkers(model, promqlErrors);
      }, DISPLAY_MARKERS_TIMEOUT);
    },
    [onQueryChange]
  );

  const handleEditorChange = useCallback(
    (value: string) => {
      updateQueryAndErrors(value);
    },
    [updateQueryAndErrors]
  );

  const handleExecuteQuery = useCallback(() => {
    if (errors.length === 0 && query) {
      onExecute(query);
    }
  }, [errors, onExecute, query]);

  useEffect(
    () => () => {
      editorRef.current.disposables.forEach((disposable) => disposable.dispose());
      if (editorRef.current.editor) {
        editorRef.current.editor.dispose();
      }
    },
    []
  );

  return {
    editorRef,
    monacoInstanceRef,
    query,
    errors,
    handleEditorChange: debounce(handleEditorChange, DEBOUNCE_QUERY_TIMEOUT),
    handleExecuteQuery,
    handleDidMount: initializeMonaco
  };
};
