import { FC, Ref, useEffect, useRef, useState } from 'react';

import {
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  MenuToggleElement,
  TextInputGroup,
  TextInputGroupMain,
  Button,
  MenuFooter
} from '@patternfly/react-core';

import {
  SkSelectTypeHeadWithCheckboxUseData,
  SkSelectTypeHeadWithCheckboxUseDataUseDataProps
} from './SkSelectTypeHeadWithCheckboxUseData';
import { EMPTY_VALUE_SYMBOL } from '../../../config/app';
import { Labels } from '../../../config/labels';

interface SkSelectTypeHeadwithCheckboxProps extends SkSelectTypeHeadWithCheckboxUseDataUseDataProps {
  initIdsSelected: string[];
  isDisabled?: boolean;
}

const SkSelectTypeHeadWithCheckbox: FC<SkSelectTypeHeadwithCheckboxProps> = function ({
  initIdsSelected = [],
  initOptions,
  isDisabled = false,
  onSelected
}) {
  const {
    inputValue,
    selected,
    selectOptions,
    isOpen,
    activeItem,
    focusedItemIndex,
    toggleServiceMenu,
    selectAllServices,
    selectService,
    onTextInputChange,
    onInputKeyDown,
    closeMenu
  } = SkSelectTypeHeadWithCheckboxUseData({
    initIdsSelected,
    initOptions,
    onSelected
  });

  const [placeholder, setPlaceholder] = useState(`${selected.length} routing keys selected`);
  const textInputRef = useRef<HTMLInputElement>(null);

  const handleSelectService = (item: string) => {
    selectService(item);
    textInputRef.current?.focus();
  };

  useEffect(() => {
    setPlaceholder(`${selected.length} routing keys selected`);
  }, [selected]);

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      isDisabled={isDisabled}
      variant="typeahead"
      role="togglebox"
      aria-label="Multi typeahead checkbox menu toggle"
      onClick={toggleServiceMenu}
      innerRef={toggleRef}
      isExpanded={isOpen}
      isFullWidth
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          value={inputValue}
          onClick={toggleServiceMenu}
          onChange={(_, value) => onTextInputChange(value)}
          onKeyDown={onInputKeyDown}
          id="multi-typeahead-select-checkbox-input"
          autoComplete="off"
          innerRef={textInputRef}
          placeholder={isDisabled ? '' : placeholder}
          {...(activeItem && { 'aria-activedescendant': activeItem })}
          role="combobox"
          isExpanded={isOpen}
          aria-controls="select-multi-typeahead-checkbox-listbox"
        />
      </TextInputGroup>
    </MenuToggle>
  );

  return (
    <Select
      role="menu"
      id="multi-typeahead-checkbox-select"
      isOpen={isOpen}
      selected={selected}
      onSelect={(_, selection) => handleSelectService(selection as string)}
      onOpenChange={(open) => !open && closeMenu()}
      toggle={toggle}
    >
      <SelectList>
        {selectOptions.map((option, index) => (
          <SelectOption
            {...(!option.isDisabled && { hasCheckbox: true })}
            isSelected={selected.includes(option.value)}
            key={option.value}
            isFocused={focusedItemIndex === index}
            className={option.className}
            id={`select-multi-typeahead-${option.value.replace(' ', EMPTY_VALUE_SYMBOL)}`}
            {...option}
            ref={null}
          >
            {option.label}
          </SelectOption>
        ))}
      </SelectList>
      <MenuFooter>
        <Button variant="link" isInline onClick={selectAllServices}>
          {Labels.ClearAll}
        </Button>
      </MenuFooter>
    </Select>
  );
};

export default SkSelectTypeHeadWithCheckbox;
