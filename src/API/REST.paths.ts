//COLLECTORS

import { COLLECTOR_URL } from '@config/config';

// ask to Skupper the url to call the api that retrieves the url of the prometheus server
const COLLECTORS_PATH = `${COLLECTOR_URL}/collectors/`;
export const getCollectors = () => COLLECTORS_PATH;

export const getUser = () => `${COLLECTOR_URL}/user/`;

export const logout = () => `${COLLECTOR_URL}/logout?nonce=${Date.now()}`;

// SITES
const SITES_PATH = `${COLLECTOR_URL}/sites/`;
export const getSitesPATH = () => SITES_PATH;
export const getSitePATH = (id: string) => `${SITES_PATH}${id}`;
export const getLinksBySitePATH = (id: string) => `${SITES_PATH}${id}/links`;
export const getHostsBySitePATH = (id: string) => `${SITES_PATH}${id}/hosts`;

// HOSTS
const HOSTS_PATH = `${COLLECTOR_URL}/hosts/`;
export const getHostsPATH = () => HOSTS_PATH;

// LINKS
const LINKS_PATH = `${COLLECTOR_URL}/links/`;
export const getLinksPATH = () => LINKS_PATH;
export const getLinkPATH = (id: string) => `${LINKS_PATH}${id}`;

// PROCESSES
const PROCESSES_PATH = `${COLLECTOR_URL}/processes/`;
export const geProcessesPATH = () => PROCESSES_PATH;
export const geProcessPATH = (id: string) => `${PROCESSES_PATH}${id}`;

// PROCESS_GROUPS
const PROCESS_GROUPS_PATH = `${COLLECTOR_URL}/processgroups/`;
export const getProcessGroupsPATH = () => PROCESS_GROUPS_PATH;
export const getProcessGroupPATH = (id: string) => `${PROCESS_GROUPS_PATH}${id}`;

// SERVICES
const SERVICE_PATH = `${COLLECTOR_URL}/addresses/`;
export const getServicesPath = () => SERVICE_PATH;
export const getFlowsPairsByServicePATH = (id: string) => `${SERVICE_PATH}${id}/flowpairs`;
export const getProcessesByServicePATH = (id: string) => `${SERVICE_PATH}${id}/processes`;
export const getProcessPairsByServicePATH = (id: string) => `${SERVICE_PATH}${id}/processpairs`;

// CONNECTIONS & RESPONSES
const FLOW_PAIRS_PATH = `${COLLECTOR_URL}/flowpairs/`;
export const getFlowPairsPATH = () => FLOW_PAIRS_PATH;
export const getFlowPairPATH = (id: string) => `${FLOW_PAIRS_PATH}${id}`;

const SITE_PAIRS_PATH = `${COLLECTOR_URL}/sitepairs/`;
export const getSitePairsPATH = () => SITE_PAIRS_PATH;
export const getSitePairPATH = (id: string) => `${SITE_PAIRS_PATH}${id}`;

const PROCESS_GROUP_PAIRS_PATH = `${COLLECTOR_URL}/processgrouppairs/`;
export const getProcessGroupPairsPATH = () => PROCESS_GROUP_PAIRS_PATH;
export const getProcessGroupPairPATH = (id: string) => `${PROCESS_GROUP_PAIRS_PATH}${id}`;

const PROCESS_PAIRS_PATH = `${COLLECTOR_URL}/processpairs/`;
export const getProcessPairsPATH = () => PROCESS_PAIRS_PATH;
