import { BIG_PAGINATION_SIZE } from '../../../config/app';
import { Labels } from '../../../config/labels';
import { getTestsIds } from '../../../config/testIds';
import SkTable from '../../../core/components/SkTable';
import MainContainer from '../../../layout/MainContainer';
import { TopologyRoutesPaths, TopologyViews } from '../../Topology/Topology.enum';
import { CustomComponentCells, ComponentColumns } from '../Components.constants';
import { useComponentsData } from '../hooks/useComponentsData';

const Components = function () {
  const {
    components,
    summary: { componentCount },
    handleGetFilters
  } = useComponentsData();

  return (
    <MainContainer
      dataTestId={getTestsIds.componentsView()}
      title={Labels.Components}
      description={Labels.ComponentsDescription}
      link={`${TopologyRoutesPaths.Topology}?type=${TopologyViews.Components}`}
      mainContentChildren={
        <SkTable
          columns={ComponentColumns}
          rows={components}
          pagination={true}
          paginationPageSize={BIG_PAGINATION_SIZE}
          paginationTotalRows={componentCount}
          onGetFilters={handleGetFilters}
          customCells={CustomComponentCells}
        />
      }
    />
  );
};

export default Components;
