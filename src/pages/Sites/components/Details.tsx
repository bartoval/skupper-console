import { FC } from 'react';

import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Grid,
  GridItem,
  List,
  ListItem,
  Title
} from '@patternfly/react-core';
import { useSuspenseQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { FlowDirection } from '@API/REST.enum';
import EmptyData from '@core/components/EmptyData';
import ResourceIcon from '@core/components/ResourceIcon';
import { ProcessesRoutesPaths } from '@pages/Processes/Processes.enum';

import SitesController from '../services';
import { SitesRoutesPaths, SiteLabels } from '../Sites.enum';
import { DetailsProps } from '../Sites.interfaces';
import { queryDetails } from '../Sites.queries';

const processQueryParams = { endTime: 0 };
const linkQueryParams = { direction: FlowDirection.Outgoing };

const Details: FC<DetailsProps> = function ({ site }) {
  const { identity: siteId, nameSpace, siteVersion, platform } = site;

  const [{ data: sites }, { data: hosts }, { data: links }, { data: processesData }] = useSuspenseQueries({
    queries: [
      queryDetails.fetchSites(),
      queryDetails.fetchHostsBySiteId(siteId),
      queryDetails.fetchLinksBySiteId(siteId, linkQueryParams),
      queryDetails.fetchProcessesBySiteId(siteId, processQueryParams)
    ]
  });

  const { linkSiteIds } = SitesController.bindLinksWithSiteIds([site], links)[0];
  const linkedSites = sites.filter(({ identity }) => linkSiteIds.map((id) => id.targetId).includes(identity));
  const processResults = processesData.results.filter(({ processRole }) => processRole !== 'internal');

  return (
    <Grid hasGutter sm={12} xl={6} xl2={4}>
      <GridItem sm={12}>
        <Card>
          <CardTitle>
            <Title headingLevel="h2">{SiteLabels.Details}</Title>
          </CardTitle>
          <CardBody>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>{SiteLabels.Namespace}</DescriptionListTerm>
                <DescriptionListDescription>{nameSpace}</DescriptionListDescription>
                <DescriptionListTerm>{SiteLabels.Platform}</DescriptionListTerm>
                <DescriptionListDescription>{platform}</DescriptionListDescription>
                <DescriptionListTerm>{SiteLabels.SiteVersion}</DescriptionListTerm>
                <DescriptionListDescription>{siteVersion}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>
      </GridItem>

      <GridItem>
        <Card isFullHeight>
          <CardTitle>
            <Title headingLevel="h2">{SiteLabels.Links}</Title>
          </CardTitle>
          <CardBody>
            {(!!linkedSites.length && (
              <List isPlain>
                {linkedSites.map(({ identity, name: linkedSiteName }) => (
                  <ListItem key={identity}>
                    <Flex>
                      <ResourceIcon type="site" />
                      <Link to={`${SitesRoutesPaths.Sites}/${linkedSiteName}@${identity}`}>{linkedSiteName}</Link>
                    </Flex>
                  </ListItem>
                ))}
              </List>
            )) || <EmptyData />}
          </CardBody>
        </Card>
      </GridItem>

      <GridItem>
        <Card isFullHeight>
          <CardTitle>
            <Title headingLevel="h2">{SiteLabels.Hosts}</Title>
          </CardTitle>
          <CardBody>
            {(!!hosts.length && (
              <List isPlain>
                {hosts.map(({ identity, provider, name: hostName }) => (
                  <ListItem key={identity}>{provider ? `${provider} (${hostName})` : hostName}</ListItem>
                ))}
              </List>
            )) || <EmptyData />}
          </CardBody>
        </Card>
      </GridItem>

      <GridItem sm={12} xl={12} xl2={4}>
        <Card isFullHeight>
          <CardTitle>
            <Title headingLevel="h2">{SiteLabels.Processes}</Title>
          </CardTitle>
          <CardBody>
            {(!!processResults.length && (
              <List isPlain>
                {processResults.map(({ identity, name: processName }) => (
                  <ListItem key={identity}>
                    <Flex>
                      <ResourceIcon type="process" />
                      <Link to={`${ProcessesRoutesPaths.Processes}/${processName}@${identity}`}>{processName}</Link>
                    </Flex>
                  </ListItem>
                ))}
              </List>
            )) || <EmptyData />}
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );
};

export default Details;
