import { Icon, Truncate } from '@patternfly/react-core';
import { GlobeAmericasIcon } from '@patternfly/react-icons';

import { timeAgo } from '@core/utils/timeAgo';

import { EndTimeProps } from './EndTime';

const EndTimeCell = function <T>({ value }: EndTimeProps<T>) {
  if (!value) {
    return null;
  }

  typeof value;

  return (
    <>
      <Icon isInline>
        <GlobeAmericasIcon />
      </Icon>{' '}
      <Truncate content={timeAgo(value as number)} position={'middle'} />
    </>
  );
};

export default EndTimeCell;
