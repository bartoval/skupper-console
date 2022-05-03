import React, { useState } from 'react';

import { Card } from '@patternfly/react-core';
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';

import { ErrorRoutesPaths } from '@pages/shared/Errors/errors.constants';
import LoadingPage from '@pages/shared/Loading';
import { UPDATE_INTERVAL } from 'config';

import DeploymentsServices from '../services';
import { QueriesDeployments } from '../services/deployments.enum';
import { ServicesOverviewColumns } from './Overview.enum';

const DeploymentsOverview = function () {
    const navigate = useNavigate();
    const [refetchInterval, setRefetchInterval] = useState(UPDATE_INTERVAL);

    const { data: rows, isLoading } = useQuery(
        QueriesDeployments.GetDeployments,
        DeploymentsServices.fetchDeployments,
        {
            refetchInterval,
            onError: handleError,
        },
    );

    function handleError({ httpStatus }: { httpStatus?: number }) {
        const route = httpStatus ? ErrorRoutesPaths.ErrServer : ErrorRoutesPaths.ErrConnection;

        setRefetchInterval(0);
        navigate(route);
    }

    if (isLoading) {
        return <LoadingPage />;
    }

    return (
        <Card>
            <TableComposable
                className="flows-table"
                aria-label="flows table"
                borders={false}
                isStickyHeader
            >
                <Thead>
                    <Tr>
                        <Th>{ServicesOverviewColumns.Name}</Th>
                        <Th>{ServicesOverviewColumns.Protocol}</Th>
                        <Th>{ServicesOverviewColumns.Deployed}</Th>
                        <Th>{ServicesOverviewColumns.NumSitesConnectionsIn}</Th>
                        <Th>{ServicesOverviewColumns.NumSitesConnectionsOut}</Th>
                    </Tr>
                </Thead>
                {rows?.map((row) => (
                    <Tbody key={row.id}>
                        <Tr>
                            <Td dataLabel={ServicesOverviewColumns.Name}>{row.name}</Td>
                            <Td
                                dataLabel={ServicesOverviewColumns.Protocol}
                            >{`${row.protocol}`}</Td>
                            <Td dataLabel={ServicesOverviewColumns.Deployed}>
                                {`${row.sites.map((site) => `${site.name} (${site.url})`)}`}
                            </Td>
                            <Td
                                dataLabel={ServicesOverviewColumns.NumSitesConnectionsIn}
                            >{`${row.numConnectionsIn}`}</Td>
                            <Td
                                dataLabel={ServicesOverviewColumns.NumSitesConnectionsOut}
                            >{`${row.numConnectionsOut}`}</Td>
                        </Tr>
                    </Tbody>
                ))}
            </TableComposable>
        </Card>
    );
};

export default DeploymentsOverview;