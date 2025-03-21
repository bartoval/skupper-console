import { FC, useCallback } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getAllServices } from '../../../API/REST.endpoints';
import { RESTApi } from '../../../API/REST.resources';
import { UPDATE_INTERVAL } from '../../../config/reactQuery';
import SkSelectTypeHeadWithCheckbox from '../../../core/components/SkSelectTypeHeadWithCheckbox';

interface DisplayServicesProps {
  initialIdsSelected?: string[];
  onSelected: (items: string[] | undefined) => void;
}

const DisplayServices: FC<DisplayServicesProps> = function ({ initialIdsSelected, onSelected: onSelect }) {
  const { data: services } = useQuery({
    queryKey: [getAllServices()],
    queryFn: () => RESTApi.fetchServices(),
    refetchInterval: UPDATE_INTERVAL
  });

  const handleSelected = useCallback(
    (items: string[]) => {
      onSelect(items.length ? items : undefined);
    },
    [onSelect]
  );
  // useQuery is async: If services are not yet available (undefined), render a disabled placeholder
  if (!services) {
    return (
      <SkSelectTypeHeadWithCheckbox
        key={1}
        initOptions={[]}
        initIdsSelected={[]}
        onSelected={handleSelected}
        isDisabled={true}
      />
    );
  }

  // Extract service options from fetched data (if available)
  const options = services?.results?.map(({ name, identity }) => ({
    key: identity,
    value: identity,
    label: name
  }));

  return (
    <SkSelectTypeHeadWithCheckbox
      key={2}
      initIdsSelected={initialIdsSelected || []}
      initOptions={options}
      onSelected={handleSelected}
    />
  );
};

export default DisplayServices;
