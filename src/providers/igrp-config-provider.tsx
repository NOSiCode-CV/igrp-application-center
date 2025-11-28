"use client";

import { createContext, useContext } from "react";

type IGRPConfig = {
  showBreadcrumb: boolean;
  showSidebar: boolean;
  showNotifications: boolean;
  showSearch: boolean;
};

const IGRPConfigContext = createContext<IGRPConfig>({
  showBreadcrumb: true,
  showSidebar: true,
  showNotifications: true,
  showSearch: true,
});

export function IGRPConfigProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config: IGRPConfig;
}) {
  return (
    <IGRPConfigContext.Provider value={config}>
      {children}
    </IGRPConfigContext.Provider>
  );
}

export const useIGRPConfig = () => useContext(IGRPConfigContext);