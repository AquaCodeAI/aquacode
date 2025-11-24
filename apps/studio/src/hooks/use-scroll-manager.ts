import React, { useCallback, useEffect, useRef, useState } from 'react';

interface UseScrollManagerReturn {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isNearBottom: boolean;
  scrollToBottom: (smooth?: boolean) => void;
}

interface UseScrollManagerOptions {
  /** Distance from bottom (in pixels) to consider "near bottom" */
  bottomThreshold?: number;
}

/**
 * Custom hook for managing scroll position and scroll-to-bottom functionality
 * Provides scroll container ref, near-bottom detection, and scroll utilities
 */
export const useScrollManager = ({ bottomThreshold = 100 }: UseScrollManagerOptions = {}): UseScrollManagerReturn => {
  // Ref for the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // State to track if user is near bottom of container
  const [isNearBottom, setIsNearBottom] = useState<boolean>(true);

  /**
   * Scrolls the container to the bottom (most recent content)
   * @param smooth - Whether to use smooth scrolling animation (default: true)
   */
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'instant',
      });
    }
  }, []);

  /**
   * Checks the current scroll position and updates isNearBottom and isNearTop states
   */
  const checkScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

      // Calculate if user is within threshold distance from bottom
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const isNearBottomPosition = distanceFromBottom < bottomThreshold;

      setIsNearBottom(isNearBottomPosition);
    }
  }, [bottomThreshold]);

  /**
   * Set up scroll event listener and initial position check
   */
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    if (scrollContainer) {
      // Add scroll event listener
      scrollContainer.addEventListener('scroll', checkScrollPosition, { passive: true });

      // Check initial scroll position
      checkScrollPosition();

      // Cleanup function
      return () => {
        scrollContainer.removeEventListener('scroll', checkScrollPosition);
      };
    }
  }, [checkScrollPosition]);

  return {
    scrollContainerRef,
    isNearBottom,
    scrollToBottom,
  };
};
