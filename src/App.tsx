import React from 'react';

import { Page } from '@patternfly/react-core';

import Header from './layout/Header';
import SideBar from './layout/SideBar';
import Routes from './routes';

import './App.scss';

const App = function () {
  return (
    <Page header={<Header />} sidebar={<SideBar />} isManagedSidebar className="app-main-container">
      <Routes />
    </Page>
  );
};

export default App;
