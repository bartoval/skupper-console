import { Bullseye, PageSection, Text, TextContent, TextVariants } from '@patternfly/react-core';

import { NotFoundLabels } from './NotFound.enum';

const NotFound = function () {
  return (
    <PageSection>
      <Bullseye data-testid="sk-not-found-view">
        <TextContent>
          <Text component={TextVariants.h1}>{NotFoundLabels.ErrorTitle}</Text>
        </TextContent>
      </Bullseye>
    </PageSection>
  );
};

export default NotFound;
