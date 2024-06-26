import { FC, FormEvent, Ref, useCallback, useEffect, useRef, useState } from 'react';

import {
  Button,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';

import { TopologyLabels } from '../Topology.enum';

export interface ResourcesOptionsProps {
  name: string;
  identity: string;
}

interface DisplayResourcesProps {
  id?: string;
  options: ResourcesOptionsProps[];
  onSelect: Function;
  placeholder?: string;
}

const FILTER_BY_SERVICE_MAX_HEIGHT = 400;

const DisplayResources: FC<DisplayResourcesProps> = function ({
  id,
  placeholder = TopologyLabels.DisplayResourcesDefaultLabel,
  onSelect,
  options
}) {
  const [inputValue, setInputValue] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  const filterValueRef = useRef<string>('');
  const textInputRef = useRef<HTMLInputElement>();

  function handleToggleMenu() {
    setIsOpen((prevIsOpen) => !prevIsOpen);
  }

  const handleClear = useCallback(() => {
    setInputValue('');
    filterValueRef.current = '';
    textInputRef.current?.focus();
    onSelect?.(undefined);
  }, [onSelect]);

  const handleSelect = useCallback(
    (idSelected: string) => {
      setIsOpen(false);
      onSelect?.(idSelected);
    },
    [onSelect]
  );

  const handleTextInputChange = (_: FormEvent<HTMLInputElement>, selection: string) => {
    setInputValue(selection);
    filterValueRef.current = selection;
  };

  const selectOptions = (options || []).filter(
    ({ name }) =>
      !filterValueRef.current || name.toString().toLowerCase().includes(filterValueRef.current.toLowerCase())
  );

  useEffect(() => {
    if (id) {
      setInputValue(findOptionNameSelected(options, id));
      filterValueRef.current = '';
    }
  }, [id, options]);

  useEffect(() => {
    setIsOpen(!!inputValue && !!filterValueRef.current);
  }, [inputValue]);

  return (
    <Select
      role="resource-select"
      isOpen={isOpen}
      selected={id}
      maxMenuHeight={`${FILTER_BY_SERVICE_MAX_HEIGHT}px`}
      isScrollable
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <MenuToggle ref={toggleRef} isExpanded={isOpen} onClick={handleToggleMenu} variant="typeahead">
          <TextInputGroup isPlain>
            <TextInputGroupMain
              value={inputValue}
              onClick={handleToggleMenu}
              onChange={handleTextInputChange}
              autoComplete="off"
              innerRef={textInputRef}
              placeholder={placeholder}
              role="combobox"
              isExpanded={isOpen}
            />

            <TextInputGroupUtilities>
              {!!inputValue && (
                <Button variant="plain" onClick={handleClear} aria-label="Clear input value">
                  <TimesIcon aria-hidden />
                </Button>
              )}
            </TextInputGroupUtilities>
          </TextInputGroup>
        </MenuToggle>
      )}
    >
      <SelectList>
        {selectOptions.map(({ name, identity }) => (
          <SelectOption
            key={identity}
            value={identity}
            onClick={() => handleSelect(identity)}
            isSelected={identity === id}
          >
            {name}
          </SelectOption>
        ))}
      </SelectList>
    </Select>
  );
};

export default DisplayResources;

function findOptionNameSelected(options: ResourcesOptionsProps[], idSelected?: string) {
  return options.find(({ identity }) => identity === idSelected)?.name || '';
}
