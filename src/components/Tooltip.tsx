import React, { useState, useRef, useCallback, useEffect, useId } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  FloatingPortal,
  type Placement,
} from '@floating-ui/react';
import { GiPin } from 'react-icons/gi';
import { useTooltipGlobalManager } from './TooltipGlobalManager';
import './Tooltip.styles.css';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: Placement;
  offset?: number;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  delay?: number;
  closeDelay?: number;
  showArrow?: boolean;
  portal?: boolean;
  maxWidth?: number;
  /** When true, makes the entire tooltip bounding box clickable, not just the trigger element */
  clickableBounds?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  offset: offsetValue = 8,
  disabled = false,
  className = '',
  contentClassName = '',
  delay = 250,
  closeDelay = 0,
  showArrow = true,
  portal = true,
  maxWidth = 300,
  clickableBounds = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [globalRevealOpen, setGlobalRevealOpen] = useState(false);
  const [isActiveForKeyboard, setIsActiveForKeyboard] = useState(false);
  const arrowRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hook into global tooltip manager for Cmd/Ctrl reveal
  const globalManager = useTooltipGlobalManager();

  const isVisible = isHovered || isPinned || globalRevealOpen;

  const { refs, floatingStyles, context } = useFloating({
    open: isVisible,
    placement,
    middleware: [
      offset(offsetValue),
      flip({
        fallbackAxisSideDirection: 'start',
        padding: 8,
      }),
      shift({ padding: 8 }),
      ...(showArrow
        ? [
            arrow({
              element: arrowRef,
            }),
          ]
        : []),
    ],
    whileElementsMounted: autoUpdate,
  });

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Clear keyboard activity from other tooltips by dispatching custom event
    document.dispatchEvent(
      new CustomEvent('tooltip-keyboard-clear', {
        detail: { excludeId: tooltipId },
      })
    );

    // Mark this tooltip as active for keyboard interactions
    setIsActiveForKeyboard(true);

    if (!isHovered) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(true);
      }, delay);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Remove keyboard activity when leaving
    setIsActiveForKeyboard(false);

    if (!isPinned) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, closeDelay);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinned) {
      // If already pinned, unpin it
      setIsPinned(false);
    } else if (isHovered) {
      // If tooltip is open by hover, pin it
      setIsPinned(true);
    } else {
      // If tooltip is closed, open and pin it
      setIsPinned(true);
    }
  };

  // Register with global manager for Cmd/Ctrl reveal
  useEffect(() => {
    const showTooltip = () => {
      if (!isVisible && !isPinned) {
        setGlobalRevealOpen(true);
      }
    };

    const hideTooltip = () => {
      if (globalRevealOpen && !isPinned) {
        setGlobalRevealOpen(false);
      }
    };

    globalManager.registerTooltip(tooltipId, showTooltip, hideTooltip);

    return () => {
      globalManager.unregisterTooltip(tooltipId);
    };
  }, [tooltipId, globalManager, isVisible, isPinned, globalRevealOpen]);

  // Handle 't' key to toggle pinned state when hovering over trigger
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 't' || event.key === 'T') {
        if (isVisible && isActiveForKeyboard) {
          // Only respond if this tooltip is the actively hovered one
          event.preventDefault();
          setIsPinned(current => !current);
        }
      }
    };

    if (isVisible && isActiveForKeyboard) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isVisible, isActiveForKeyboard]);

  // Handle clearing keyboard activity when another tooltip becomes active
  useEffect(() => {
    const handleKeyboardClear = (event: CustomEvent) => {
      if (event.detail?.excludeId !== tooltipId) {
        setIsActiveForKeyboard(false);
      }
    };

    document.addEventListener(
      'tooltip-keyboard-clear',
      handleKeyboardClear as EventListener
    );
    return () => {
      document.removeEventListener(
        'tooltip-keyboard-clear',
        handleKeyboardClear as EventListener
      );
    };
  }, [tooltipId]);

  // Reset keyboard active state when tooltip becomes invisible
  useEffect(() => {
    if (!isVisible) {
      setIsActiveForKeyboard(false);
    }
  }, [isVisible]);

  // Handle escape key and outside clicks
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPinned(false);
        setIsHovered(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        refs.reference.current &&
        refs.floating.current &&
        !refs.reference.current.contains(event.target as Node) &&
        !refs.floating.current.contains(event.target as Node)
      ) {
        setIsPinned(false);
        setIsHovered(false);
      }
    };

    if (isPinned) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isPinned, refs.reference, refs.floating]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Get arrow positioning styles following Floating UI docs
  const getArrowStyles = useCallback(() => {
    const arrowData = context.middlewareData.arrow;
    const placement = context.placement;

    if (!arrowData) {
      return { display: 'none' };
    }

    const { x, y } = arrowData;
    const staticSide = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right',
    }[placement.split('-')[0]];

    return {
      position: 'absolute' as const,
      left: x != null ? `${x}px` : '',
      top: y != null ? `${y}px` : '',
      [staticSide!]: '-4px',
      width: '8px',
      height: '8px',
      backgroundColor: '#ffffff',
      border: '1px solid #e8e8e8',
      transform: 'rotate(45deg)',
      zIndex: -1,
    };
  }, [context.middlewareData.arrow, context.placement]);

  const renderTooltip = () => {
    if (!isVisible || disabled || !content) {
      return null;
    }

    return (
      <div
        ref={refs.setFloating}
        className={`tooltip-content ${contentClassName}`.trim()}
        style={{
          ...floatingStyles,
          backgroundColor: '#ffffff',
          border: '1px solid #e8e8e8',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '14px',
          lineHeight: '1.4',
          color: '#333333',
          boxShadow:
            '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 999999,
          maxWidth: `${maxWidth}px`,
          width: 'fit-content',
          display: 'inline-block',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'normal',
          position: 'relative',
          cursor: clickableBounds ? 'pointer' : 'default',
        }}
        data-placement={context.placement}
        onMouseEnter={clickableBounds ? handleMouseEnter : undefined}
        onMouseLeave={clickableBounds ? handleMouseLeave : undefined}
        onClick={clickableBounds ? handleClick : e => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <div style={{ flex: 1 }}>{content}</div>
          {isPinned && (
            <GiPin
              size={14}
              style={{
                color: '#3b82f6',
                flexShrink: 0,
                marginTop: '1px',
              }}
            />
          )}
        </div>
        {showArrow && <div ref={arrowRef} style={getArrowStyles()} />}
      </div>
    );
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        ref={refs.setReference}
        className={`tooltip-trigger ${className}`.trim()}
        style={{ display: 'inline-block', cursor: 'help' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        role="button"
        aria-describedby={isVisible ? tooltipId : undefined}
      >
        {children}
      </div>
      {portal ? (
        <FloatingPortal root={document.body}>{renderTooltip()}</FloatingPortal>
      ) : (
        renderTooltip()
      )}
    </>
  );
};

export default Tooltip;
