import { useEffect, useRef, useCallback } from 'react';
import DOMPurify from 'dompurify';

/**
 * A safer version of useEffect that prevents operations on unmounted components
 * and provides better cleanup handling for DOM manipulation
 */
export const useSafeEffect = (
  effect: () => void | (() => void),
  deps?: React.DependencyList
) => {
  const isMountedRef = useRef(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isMountedRef.current) return;

    try {
      const cleanup = effect();
      if (typeof cleanup === 'function') {
        cleanupRef.current = cleanup;
      }
    } catch (error) {
      console.warn('Error in safe effect:', error);
    }

    return () => {
      isMountedRef.current = false;
      
      // Run cleanup with error handling
      if (cleanupRef.current) {
        try {
          cleanupRef.current();
        } catch (error) {
          console.warn('Error during safe effect cleanup:', error);
        }
        cleanupRef.current = null;
      }
    };
  }, deps);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef.current;
};

/**
 * Hook for safe DOM operations that checks if component is still mounted
 */
export const useSafeCallback = <T extends any[]>(
  callback: (...args: T) => void,
  deps: React.DependencyList
) => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback((...args: T) => {
    if (isMountedRef.current) {
      try {
        callback(...args);
      } catch (error) {
        console.warn('Error in safe callback:', error);
      }
    }
  }, deps);
};

/**
 * Hook for safe DOM element operations
 */
export const useSafeDOMOperation = () => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeOperation = useCallback((operation: () => void, errorMessage?: string) => {
    if (!isMountedRef.current) return;

    try {
      operation();
    } catch (error) {
      console.warn(errorMessage || 'Safe DOM operation failed:', error);
    }
  }, []);

  const safeRemoveChild = useCallback((parent: Node, child: Node) => {
    if (!isMountedRef.current) return;

    try {
      if (parent && child && parent.contains(child)) {
        parent.removeChild(child);
      }
    } catch (error) {
      console.warn('Safe removeChild operation failed:', error);
    }
  }, []);

  const safeSetInnerHTML = useCallback((element: Element, html: string) => {
    if (!isMountedRef.current) return;

    try {
      if (element && element.parentNode) {
        element.innerHTML = DOMPurify.sanitize(html);
      }
    } catch (error) {
      console.warn('Safe innerHTML operation failed:', error);
    }
  }, []);

  return {
    safeOperation,
    safeRemoveChild,
    safeSetInnerHTML,
    isMounted: isMountedRef.current
  };
};
