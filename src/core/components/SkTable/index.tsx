import { KeyboardEvent, MouseEvent as ReactMouseEvent, useCallback, useState, useMemo, FC } from 'react';

import { Card, CardBody, CardHeader, Flex, Text, TextContent, Title } from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import {
  InnerScrollContainer,
  SortByDirection,
  Table,
  TableText,
  Tbody,
  Td,
  Th,
  Thead,
  ThProps,
  Tr
} from '@patternfly/react-table';

import { getValueFromNestedProperty } from '@core/utils/getValueFromNestedProperty';
import { NonNullableValue, SKTableColumn } from '@sk-types/SkTable.interfaces';

import SkPagination from './SkPagination';
import SKEmptyData from '../SkEmptyData';
import { sortRowsByColumnName } from './SkTable.utils';

const FIRST_PAGE_NUMBER = 1;
const PAGINATION_PAGE_SIZE = 10;

export interface SKTableProps<T> {
  columns: SKTableColumn<NonNullableValue<T>>[];
  rows?: NonNullableValue<T>[];
  title?: string;
  customCells?: Record<string, Function>;
  borders?: boolean;
  isStriped?: boolean;
  isPlain?: boolean;
  isFullHeight?: boolean;
  shouldSort?: boolean;
  pagination?: boolean;
  alwaysShowPagination?: boolean;
  paginationPageSize?: number;
  paginationTotalRows?: number;
  onGetFilters?: Function;
}

interface CustomCellProps<T> {
  value: string | T[keyof T] | undefined;
  data: T;
  callback?: Function;
  isDisabled?: boolean;
  format?: Function;
  fitContent?: boolean;
}

const SkTable = function <T>({
  title,
  columns,
  rows = [],
  customCells,
  onGetFilters,
  pagination = false,
  alwaysShowPagination = true,
  paginationPageSize = PAGINATION_PAGE_SIZE,
  paginationTotalRows = rows.length,
  ...props
}: SKTableProps<T>) {
  const [activeSortIndex, setActiveSortIndex] = useState<number>();
  const [activeSortDirection, setActiveSortDirection] = useState<SortByDirection>();
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(FIRST_PAGE_NUMBER);
  const [paginationSize, setPaginationSize] = useState<number>(paginationPageSize);

  const skColumns = columns.filter(({ show }) => show !== false);

  const getSortParams = useCallback(
    (columnIndex: number): ThProps['sort'] => ({
      sortBy: {
        index: activeSortIndex,
        direction: activeSortDirection
      },
      onSort: (_event: ReactMouseEvent, index: number, direction: SortByDirection) => {
        if (onGetFilters) {
          onGetFilters({
            limit: paginationSize,
            offset: (currentPageNumber - 1) * paginationSize,
            sortName: index !== undefined && skColumns[index].prop,
            sortDirection: direction
          });
        }

        setActiveSortIndex(index);
        setActiveSortDirection(direction);
      },
      columnIndex
    }),
    [activeSortDirection, activeSortIndex, skColumns, currentPageNumber, paginationSize, onGetFilters]
  );

  const handleSetPageNumber = useCallback(
    (_: ReactMouseEvent | KeyboardEvent | MouseEvent, pageNumber: number) => {
      setCurrentPageNumber(pageNumber);

      if (onGetFilters) {
        onGetFilters({
          limit: paginationSize,
          offset: (pageNumber - 1) * paginationSize,
          sortName: activeSortIndex !== undefined && skColumns[activeSortIndex].prop,
          sortDirection: activeSortDirection
        });
      }
    },
    [activeSortDirection, activeSortIndex, skColumns, onGetFilters, paginationSize]
  );

  const handleSetPaginationSize = useCallback(
    (_: ReactMouseEvent | KeyboardEvent | MouseEvent, pageSizeSelected: number, newPage: number) => {
      setPaginationSize(pageSizeSelected);
      setCurrentPageNumber(FIRST_PAGE_NUMBER);

      if (onGetFilters) {
        onGetFilters({
          limit: pageSizeSelected,
          offset: (newPage - 1) * pageSizeSelected,
          sortName: activeSortIndex !== undefined && skColumns[activeSortIndex].prop,
          sortDirection: activeSortDirection
        });
      }
    },
    [activeSortDirection, activeSortIndex, skColumns, onGetFilters]
  );

  let sortedRows = rows;

  // enable the local sort and local pagination in case the onGetFilters is not defined
  if (!onGetFilters) {
    // Get the name of the currently active sort column, if any.
    const activeSortColumnName = skColumns[activeSortIndex || 0].prop;

    if (activeSortColumnName) {
      // Sort the rows array based on the values of the currently active sort column and direction.
      const sortDirectionMultiplier = activeSortDirection === SortByDirection.desc ? -1 : 1;
      sortedRows = sortRowsByColumnName<T>(rows, activeSortColumnName as string, sortDirectionMultiplier);
    }

    if (pagination) {
      sortedRows = sortedRows.slice(
        (currentPageNumber - 1) * paginationSize,
        (currentPageNumber - 1) * paginationSize + paginationSize
      );
    }
  }

  const skRows = sortedRows.map((row, index) => ({
    id: index,
    columns: skColumns.map((column) => {
      const { prop } = column;
      const value = prop ? getValueFromNestedProperty(row, (prop as string).split('.') as (keyof T)[]) : '';

      return {
        ...column,
        data: row,
        value
      };
    })
  }));

  const isPaginationEnabled = useMemo(
    () => (pagination && paginationTotalRows > paginationPageSize) || alwaysShowPagination,
    [alwaysShowPagination, pagination, paginationPageSize, paginationTotalRows]
  );

  const { shouldSort = true, isFullHeight = false, ...restProps } = props;

  return (
    <Card isFullHeight={isFullHeight}>
      {title && (
        <CardHeader>
          <TextContent>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <Title headingLevel="h3">{title}</Title>
              {!isPaginationEnabled && (
                <Text>{`${paginationTotalRows || rows.length} ${rows.length === 1 ? 'item' : 'items'}`}</Text>
              )}
            </Flex>
          </TextContent>
        </CardHeader>
      )}

      <CardBody>
        <InnerScrollContainer>
          <Table variant="compact" {...restProps}>
            <Thead>
              <Tr>
                {skColumns.map(({ name, prop, columnDescription, isStickyColumn, modifier }, index) => (
                  <Th
                    aria-label={!name ? 'Action Column' : undefined}
                    colSpan={1}
                    key={name}
                    modifier={modifier}
                    isStickyColumn={isStickyColumn}
                    sort={(prop && shouldSort && getSortParams(index)) || undefined}
                    info={
                      columnDescription
                        ? {
                            tooltip: columnDescription,
                            tooltipProps: {
                              isContentLeftAligned: true
                            }
                          }
                        : undefined
                    }
                  >
                    {name}
                  </Th>
                ))}
              </Tr>
            </Thead>

            <Tbody>
              {skRows.length === 0 && (
                <Tr>
                  <Td colSpan={12}>
                    <SKEmptyData icon={SearchIcon} />
                  </Td>
                </Tr>
              )}

              {!(skRows.length === 0) &&
                skRows.map((row) => (
                  <Tr key={row.id}>
                    {row.columns.map(
                      ({ data, value, customCellName, callback, format, width, modifier, isStickyColumn }, index) => {
                        const Component =
                          !!customCells && !!customCellName && (customCells[customCellName] as FC<CustomCellProps<T>>);

                        return (
                          <Td
                            width={width}
                            key={index}
                            modifier={modifier}
                            isStickyColumn={isStickyColumn}
                            style={{ verticalAlign: 'middle' }}
                          >
                            {Component && (
                              <Component
                                value={value}
                                data={data}
                                callback={callback}
                                format={format && format(value)}
                                fitContent={modifier === 'nowrap'}
                              />
                            )}

                            {!Component && (
                              <TableText wrapModifier={modifier === 'nowrap' ? 'fitContent' : 'truncate'}>
                                {(format && format(value)) || value}
                              </TableText>
                            )}
                          </Td>
                        );
                      }
                    )}
                  </Tr>
                ))}
            </Tbody>
          </Table>
        </InnerScrollContainer>

        {isPaginationEnabled && (
          <SkPagination
            totalRow={paginationTotalRows}
            paginationSize={paginationSize}
            currentPageNumber={currentPageNumber}
            onSetPageNumber={handleSetPageNumber}
            onSetPaginationSize={handleSetPaginationSize}
          />
        )}
      </CardBody>
    </Card>
  );
};

export default SkTable;
