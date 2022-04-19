import { RESTApi } from '@models/API/REST';

import { Deployment } from './deployments.interfaces';

export const Services = {
    fetchDeployments: async (): Promise<Deployment[]> => RESTApi.fetchDeployments(),
};

export default Services;
