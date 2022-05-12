import React, { memo } from 'react';

import { Card } from '@patternfly/react-core';
import { CloudIcon } from '@patternfly/react-icons';
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { Link } from 'react-router-dom';

import { SiteRoutesPaths } from '../sites.enum';
import { SitesColumns } from './SitesTable.enum';
import { SitesTableProps } from './SitesTable.interfaces';

const SitesTable = memo(function ({ sites }: SitesTableProps) {
    return (
        <Card>
            <TableComposable
                className="network-table"
                aria-label="network table"
                borders={false}
                variant="compact"
                isStriped
            >
                <Thead>
                    <Tr>
                        <Th>{SitesColumns.Name}</Th>
                        <Th>{SitesColumns.Namespace}</Th>
                        <Th>{SitesColumns.Url}</Th>
                        <Th>{SitesColumns.Gateway}</Th>
                        <Th>{SitesColumns.Edge}</Th>
                    </Tr>
                </Thead>
                {sites?.map((row) => (
                    <Tbody key={row.siteId}>
                        <Tr>
                            <Td dataLabel={SitesColumns.Name}>
                                <Link to={`${SiteRoutesPaths.Details}/${row.siteId}`}>
                                    {row.siteName}
                                </Link>
                            </Td>
                            <Td dataLabel={SitesColumns.Namespace}>{`${row.namespace}`}</Td>
                            <Td dataLabel={SitesColumns.Url}>{`${row.url}`}</Td>
                            <Td dataLabel={SitesColumns.Gateway}>
                                {row.gateway ? (
                                    <CloudIcon color="var(--pf-global--success-color--100)" />
                                ) : (
                                    <CloudIcon color="var(--pf-global--disabled-color--300)" />
                                )}
                            </Td>
                            <Td dataLabel={SitesColumns.Edge}>
                                {row.edge ? (
                                    <CloudIcon color="var(--pf-global--success-color--100)" />
                                ) : (
                                    <CloudIcon color="var(--pf-global--disabled-color--300)" />
                                )}
                            </Td>
                        </Tr>
                    </Tbody>
                ))}
            </TableComposable>
        </Card>
    );
});

export default SitesTable;