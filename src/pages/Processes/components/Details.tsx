import { FC, ReactElement } from 'react';

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
  Title,
  Tooltip,
  Truncate
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';

import { EMPTY_VALUE_SYMBOL } from '../../../config/app';
import ResourceIcon from '../../../core/components/ResourceIcon';
import { formatLocalizedDateTime } from '../../../core/utils/formatLocalizedDateTime';
import { ProcessResponse } from '../../../types/REST.interfaces';
import { ComponentRoutesPaths } from '../../Components/Components.enum';
import { ServicesRoutesPaths } from '../../Services/Services.enum';
import { SitesRoutesPaths } from '../../Sites/Sites.enum';
import { ProcessesLabels } from '../Processes.enum';

interface DetailsProps {
  process: ProcessResponse;
  title?: string | ReactElement;
}

const Details: FC<DetailsProps> = function ({ process, title }) {
  const {
    parent,
    parentName,
    imageName,
    groupName,
    groupIdentity,
    sourceHost,
    hostName,
    startTime,
    processBinding,
    addresses
  } = process;

  return (
    <Card>
      {title && (
        <CardTitle>
          <Title headingLevel="h1">{title}</Title>
        </CardTitle>
      )}
      <CardBody>
        <DescriptionList>
          <Grid hasGutter>
            <GridItem span={6}>
              <DescriptionListGroup>
                <DescriptionListTerm>{ProcessesLabels.Site}</DescriptionListTerm>
                <DescriptionListDescription>
                  <ResourceIcon type="site" />
                  <Link to={`${SitesRoutesPaths.Sites}/${parentName}@${parent}`}>{parentName}</Link>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </GridItem>
            <GridItem span={6}>
              <DescriptionListGroup>
                <DescriptionListTerm>{ProcessesLabels.Component}</DescriptionListTerm>
                <DescriptionListDescription>
                  <ResourceIcon type="component" />
                  <Link to={`${ComponentRoutesPaths.Components}/${groupName}@${groupIdentity}`}>{groupName}</Link>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </GridItem>

            <GridItem span={6}>
              <DescriptionListGroup>
                <DescriptionListTerm>{ProcessesLabels.SourceIP}</DescriptionListTerm>
                <DescriptionListDescription>{sourceHost}</DescriptionListDescription>
              </DescriptionListGroup>
            </GridItem>

            <GridItem span={6}>
              <DescriptionListGroup>
                <DescriptionListTerm>{ProcessesLabels.Host}</DescriptionListTerm>
                <DescriptionListDescription>{hostName || EMPTY_VALUE_SYMBOL}</DescriptionListDescription>
              </DescriptionListGroup>
            </GridItem>

            <GridItem span={6}>
              <DescriptionListGroup>
                <DescriptionListTerm>{ProcessesLabels.Created}</DescriptionListTerm>
                <DescriptionListDescription>{formatLocalizedDateTime(startTime)}</DescriptionListDescription>
              </DescriptionListGroup>
            </GridItem>

            <GridItem span={6}>
              <DescriptionListGroup>
                <DescriptionListTerm>{ProcessesLabels.Image}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Tooltip content={imageName}>
                    <Truncate content={imageName || EMPTY_VALUE_SYMBOL} trailingNumChars={10} position={'middle'} />
                  </Tooltip>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </GridItem>

            <GridItem span={6}>
              <DescriptionListGroup>
                <DescriptionListTerm>{ProcessesLabels.BindingState}</DescriptionListTerm>
                <DescriptionListDescription>{processBinding}</DescriptionListDescription>
              </DescriptionListGroup>
            </GridItem>

            {!!addresses?.length && (
              <GridItem span={6}>
                <DescriptionListGroup>
                  <DescriptionListTerm>{ProcessesLabels.Services}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Flex>
                      {addresses.map((service) => (
                        <div key={service}>
                          <ResourceIcon type="service" />
                          <Link to={`${ServicesRoutesPaths.Services}/${service}`}>{service.split('@')[0]}</Link>
                        </div>
                      ))}
                    </Flex>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </GridItem>
            )}
          </Grid>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

export default Details;
