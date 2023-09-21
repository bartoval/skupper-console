import { CSSProperties, FC } from 'react';

import { Bullseye, Card, CardBody, CardHeader, PageSection } from '@patternfly/react-core';
import { CogIcon } from '@patternfly/react-icons';

import { getTestsIds } from '@config/testIds';
import TransitionPage from '@core/components/TransitionPages/Fade';

import { LoadingLabels } from './Loading.enum';

const PleaseWait = function () {
  return (
    <Card isPlain>
      <CardHeader className="cog-wrapper">
        <CogIcon className="cog cog-main spinning-clockwise" />
        <CogIcon className="cog cog-secondary cog-upper spinning-clockwise--reverse" />
        <CogIcon className="cog cog-secondary cog-lower spinning-clockwise--reverse" />
      </CardHeader>
      <CardBody>{LoadingLabels.LoadingMessage}</CardBody>
    </Card>
  );
};

const floatLoader: CSSProperties = {
  top: 0,
  position: 'absolute',
  right: 0,
  width: '100%',
  height: '100%',
  zIndex: 100
};

interface LoadingPageProps {
  isFLoating?: boolean;
}

const LoadingPage: FC<LoadingPageProps> = function ({ isFLoating = false }) {
  return (
    <TransitionPage delay={0.35}>
      <PageSection>
        <Bullseye
          className="sk-loading-page"
          style={isFLoating ? floatLoader : undefined}
          data-testid={getTestsIds.loadingView()}
        >
          <PleaseWait />
        </Bullseye>
      </PageSection>
    </TransitionPage>
  );
};

export default LoadingPage;
