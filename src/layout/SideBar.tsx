import { PageSidebar, PageSidebarBody } from '@patternfly/react-core';

import NavBar from '../core/components/NavBar';

const SkSidebar = function () {
  return (
    <PageSidebar>
      <PageSidebarBody>
        <NavBar />
      </PageSidebarBody>
    </PageSidebar>
  );
};

export default SkSidebar;
