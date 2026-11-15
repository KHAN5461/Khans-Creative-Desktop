import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="flex flex-shrink-0 items-center justify-center border border-border bg-surface shadow-medium box-border 
    h-[51px] w-[51px] rounded-[25.5px] px-0
    md:w-auto md:h-[48px] md:rounded-[24px] md:px-[24px]
    hover:bg-neutral-90/50 dark:hover:bg-neutral-10/50
    transition-colors cursor-default select-none">
      <span className="font-roboto text-[13px] md:text-[15.2px] font-medium text-text-main leading-[18px]">
        {formatTime(time)}
      </span>
    </div>
  );
};

export default Clock;
