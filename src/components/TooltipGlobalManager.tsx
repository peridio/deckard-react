import React, { createContext, useContext, useState, useCallback } from 'react';

interface TooltipGlobalManagerContextType {
  showAllTooltips: boolean;
  registerTooltip: (
    id: string,
    showTooltip: () => void,
    hideTooltip: () => void
  ) => void;
  unregisterTooltip: (id: string) => void;
}

const TooltipGlobalManagerContext =
  createContext<TooltipGlobalManagerContextType | null>(null);

export const useTooltipGlobalManager = () => {
  const context = useContext(TooltipGlobalManagerContext);
  if (!context) {
    // Return a default implementation if not wrapped in provider
    return {
      showAllTooltips: false,
      registerTooltip: () => {},
      unregisterTooltip: () => {},
    };
  }
  return context;
};

export const TooltipGlobalManagerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [showAllTooltips] = useState(false);
  const [registeredTooltips] = useState<
    Map<string, { show: () => void; hide: () => void }>
  >(new Map());

  const registerTooltip = useCallback(
    (id: string, showTooltip: () => void, hideTooltip: () => void) => {
      registeredTooltips.set(id, { show: showTooltip, hide: hideTooltip });
    },
    [registeredTooltips]
  );

  const unregisterTooltip = useCallback(
    (id: string) => {
      registeredTooltips.delete(id);
    },
    [registeredTooltips]
  );

  const value: TooltipGlobalManagerContextType = {
    showAllTooltips,
    registerTooltip,
    unregisterTooltip,
  };

  return (
    <TooltipGlobalManagerContext.Provider value={value}>
      {children}
    </TooltipGlobalManagerContext.Provider>
  );
};

export default TooltipGlobalManagerProvider;
