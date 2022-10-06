import { ProcessResponse, ProcessGroupResponse } from 'API/REST.interfaces';

export interface ProcessesMetricsProps {
    services: ProcessGroupResponse[];
}

export interface ProcessesTableProps {
    processes: ProcessResponse[];
}

export interface ProcessesBytesChartProps {
    bytes: { x: string; y: number }[];
    labels?: { name: string }[];
    themeColor?: string;
}

export interface ProcessesNameLinkCellProps {
    data: ProcessResponse;
    value: ProcessResponse[keyof ProcessResponse];
}

export interface CurrentBytesInfoProps {
    description?: string;
    direction?: 'down' | 'up';
    byteRate: number;
    bytes: number;
    style?: Record<string, string>;
}