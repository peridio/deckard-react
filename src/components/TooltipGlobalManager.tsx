import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

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
  const [showAllTooltips, setShowAllTooltips] = useState(false);
  const [registeredTooltips] = useState<
    Map<string, { show: () => void; hide: () => void }>
  >(new Map());

  // Log when provider mounts
  useEffect(() => {
    // TooltipGlobalManagerProvider mounted and ready
  }, []);

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

  // Handle Ctrl key press for all platforms
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isRevealKey = event.ctrlKey;

      // Key pressed: { key, ctrlKey, isRevealKey }

      if (isRevealKey && !showAllTooltips) {
        setShowAllTooltips(true);
        // Show all registered tooltips
        registeredTooltips.forEach(({ show }) => {
          show();
        });
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const wasRevealKey = !event.ctrlKey;

      if (wasRevealKey && showAllTooltips) {
        setShowAllTooltips(false);
        // Hide all registered tooltips (except pinned ones)
        registeredTooltips.forEach(({ hide }) => {
          hide();
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [showAllTooltips, registeredTooltips]);

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
