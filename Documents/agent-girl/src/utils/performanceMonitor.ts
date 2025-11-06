// Performance monitoring utility for development
export const useRenderTracker = (componentName: string) => {
  if (process.env.NODE_ENV === 'development') {
    const renderCount = React.useRef(0);
    
    React.useEffect(() => {
      renderCount.current += 1;
      console.log(`🔄 ${componentName} rendered (count: ${renderCount.current})`);
      
      if (renderCount.current > 10) {
        console.warn(`⚠️ ${componentName} has rendered ${renderCount.current} times - possible performance issue!`);
      }
    });
  }
};

// Hook to detect unnecessary re-renders
export const useWhyDidYouUpdate = (name: string, props: any) => {
  if (process.env.NODE_ENV === 'development') {
    const previousProps = React.useRef() as any;
    
    React.useEffect(() => {
      if (previousProps.current) {
        const allKeys = Object.keys({ ...previousProps.current, ...props });
        const changesObj: any = {};
        
        allKeys.forEach((key) => {
          if (previousProps.current[key] !== props[key]) {
            changesObj[key] = {
              from: previousProps.current[key],
              to: props[key],
            };
          }
        });
        
        if (Object.keys(changesObj).length > 0) {
          console.log(`[why-did-you-update] ${name}`, changesObj);
        }
      }
      
      previousProps.current = props;
    });
  }
};
