import { useEffect, useRef, useState } from "react";

interface AspectRatioGuardProps {
  children: React.ReactNode;
  className?: string;
  minRatio?: number;
  maxRatio?: number;
  fallbackRatio?: number;
}

export function AspectRatioGuard({
  children,
  className = "",
  minRatio = 0.5,  // 1:2 (tall/narrow)
  maxRatio = 2.0,  // 2:1 (wide)
  fallbackRatio = 16/9,
}: AspectRatioGuardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [lastKnownRatio, setLastKnownRatio] = useState(fallbackRatio);
  const [currentRatio, setCurrentRatio] = useState(fallbackRatio);

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = rect.width;
      const newHeight = rect.height;

      // Only update if we have meaningful dimensions
      if (newWidth > 0 && newHeight > 0) {
        const newRatio = newWidth / newHeight;
        
        // Update last known ratio if this is a reasonable ratio
        if (newRatio >= minRatio && newRatio <= maxRatio) {
          setLastKnownRatio(newRatio);
        }

        setDimensions({ width: newWidth, height: newHeight });
        
        // Apply ratio constraints
        let constrainedRatio = newRatio;
        if (newRatio < minRatio) {
          constrainedRatio = minRatio;
        } else if (newRatio > maxRatio) {
          constrainedRatio = maxRatio;
        }
        
        // Use last known ratio if current is extreme
        if (newRatio < minRatio || newRatio > maxRatio) {
          constrainedRatio = lastKnownRatio;
        }
        
        setCurrentRatio(constrainedRatio);
      }
    };

    // Initial measurement
    updateDimensions();

    // Set up ResizeObserver for responsive behavior
    let resizeObserver: ResizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateDimensions();
      });
      
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
    }

    // Fallback to window resize for older browsers
    const handleResize = () => {
      updateDimensions();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [minRatio, maxRatio, lastKnownRatio]);

  // Calculate constrained dimensions
  const constrainedHeight = dimensions.width / currentRatio;
  const constrainedWidth = dimensions.height * currentRatio;

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          // Use the constrained ratio to prevent layout shifts
          aspectRatio: currentRatio.toString(),
          // Ensure the content stays within bounds
          maxWidth: '100%',
          maxHeight: '100%',
          margin: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
