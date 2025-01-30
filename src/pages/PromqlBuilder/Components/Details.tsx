import { FC } from 'react';

import {
  Button,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Split,
  SplitItem,
  Title,
  Truncate
} from '@patternfly/react-core';
import { PlayIcon, TrashIcon } from '@patternfly/react-icons';

import { formatLocalizedDateTime } from '../../../core/utils/formatLocalizedDateTime';
import useQueryHistory from '../hooks/useQueryHistory';

const QueryHistoryComponent: FC<{ onExecute: Function }> = function ({ onExecute }) {
  const { queries, deleteQuery, clearQueries } = useQueryHistory();

  return (
    <>
      <Split>
        <SplitItem isFilled>
          <Title headingLevel="h4"> </Title>
        </SplitItem>
        <SplitItem>
          Clear all <Button variant="plain" onClick={() => clearQueries()} icon={<TrashIcon />} />
        </SplitItem>
      </Split>
      <DataList aria-label="history list">
        {queries?.map((query) => (
          <DataListItem key={query.id}>
            <DataListItemRow>
              <DataListItemCells
                dataListCells={[
                  <DataListCell key="label content" isFilled={true} style={{ maxWidth: '90%' }}>
                    <Truncate content={` ${query.query} - ${formatLocalizedDateTime(query.timestamp * 1000)}`} />
                  </DataListCell>,
                  <DataListCell alignRight key="value content" isFilled={false}>
                    <Button variant="plain" onClick={() => onExecute(query.query)} icon={<PlayIcon />} />
                    <Button variant="plain" onClick={() => deleteQuery(query.id)} icon={<TrashIcon />} />
                  </DataListCell>
                ]}
              />
            </DataListItemRow>
          </DataListItem>
        ))}
      </DataList>
    </>
  );
};

export default QueryHistoryComponent;
