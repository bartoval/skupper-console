import React, { createContext, useMemo, useState, useContext } from 'react';

import { ConnectionSiteInfoState, GlobalStateProviderProps } from './Data.interfaces';

// Initial States
const siteInfoInitialState = {
  siteInfo: null,
  setSiteInfo: () => {
    return null;
  },
};

// Contexts
const SiteInfoContext = createContext<ConnectionSiteInfoState>(siteInfoInitialState);

// Provider
const GlobalStateProvider = function ({ children }: GlobalStateProviderProps) {
  const [siteInfo, setSiteInfo] = useState(siteInfoInitialState.siteInfo);

  // Contexts values
  const siteInfoContextValue = useMemo(() => {
    return { siteInfo, setSiteInfo };
  }, [siteInfo]);

  return (
    <SiteInfoContext.Provider value={siteInfoContextValue}>{children}</SiteInfoContext.Provider>
  );
};

// custom hooks
export const useSiteInfo = () => {
  return useContext(SiteInfoContext);
};

export default GlobalStateProvider;
