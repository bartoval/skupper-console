import { FC, useCallback, useState } from 'react';

import { Button, Icon, Popover, SearchInput } from '@patternfly/react-core';
import { ExpandArrowsAltIcon, InfoCircleIcon } from '@patternfly/react-icons';

import { Labels } from '../../../config/labels';

enum DisplayResourcesLabels {
  SearchInfo1 = 'Search results may appear outside of the visible area. Click to the',
  SearchInfo2 = 'button to fit to the screen.'
}
interface DisplayResourcesProps {
  onSelect: (searchText: string) => void;
  placeholder?: string;
}

const DisplayResources: FC<DisplayResourcesProps> = function ({ placeholder = Labels.FindResource, onSelect }) {
  const [searchText, setSearchText] = useState('');

  const handleClear = useCallback(() => {
    setSearchText('');
    onSelect?.('');
  }, [onSelect]);

  const handleTextInputChange = (selection: string) => {
    setSearchText(selection);
    onSelect?.(selection);
  };

  return (
    <>
      <SearchInput
        data-testid="sk-search-box"
        className="sk-search-filter"
        placeholder={placeholder}
        onChange={(_, selection) => handleTextInputChange(selection)}
        value={searchText}
        onClear={handleClear}
      />
      <Popover
        position={'right'}
        bodyContent={
          <>
            {DisplayResourcesLabels.SearchInfo1} <ExpandArrowsAltIcon /> {DisplayResourcesLabels.SearchInfo2}
          </>
        }
      >
        <Button
          icon={
            <Icon status="info">
              <InfoCircleIcon />
            </Icon>
          }
          variant="plain"
        />
      </Popover>
    </>
  );
};

export default DisplayResources;
