import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextMenuItem {
  label: string;
  action: () => void;
  icon?: React.ReactNode;
  shortcut?: string;
  separator?: boolean;
}

interface ContextMenuProps {
  children: React.ReactNode;
  items: ContextMenuItem[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ children, items }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => setIsVisible(false);
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleClick, { capture: true }); // Close on scroll
    return () => {
        window.removeEventListener('click', handleClick);
        window.removeEventListener('scroll', handleClick, { capture: true });
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling if nested

    const menuWidth = 180;
    const menuHeight = items.length * 40; // Approx height

    let x = e.clientX;
    let y = e.clientY;

    // Boundary check
    if (x + menuWidth > window.innerWidth) x -= menuWidth;
    if (y + menuHeight > window.innerHeight) y -= menuHeight;

    setPosition({ x, y });
    setIsVisible(true);
  };

  return (
    <div onContextMenu={handleContextMenu} className="h-full w-full">
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className="fixed z-[9999] min-w-[180px] bg-surface border border-border shadow-hard rounded-lg overflow-hidden py-1.5 cursor-default select-none"
            style={{ top: position.y, left: position.x }}
          >
            {items.map((item, index) => {
                if (item.separator) {
                    return <div key={`sep-${index}`} className="h-[1px] bg-border my-1.5 mx-2 opacity-50" />;
                }
                return (
                    <div
                        key={index}
                        onClick={(e) => {
                            e.stopPropagation();
                            item.action();
                            setIsVisible(false);
                        }}
                        className="flex items-center gap-3 px-3 py-1.5 mx-1 rounded-md text-sm text-text-main hover:bg-neutral-90/50 dark:hover:bg-neutral-10/50 active:bg-neutral-90 dark:active:bg-neutral-10 transition-colors"
                    >
                        {item.icon && <span className="opacity-70">{item.icon}</span>}
                        <span className="flex-1 font-medium font-roboto text-[13px]">{item.label}</span>
                        {item.shortcut && <span className="text-[10px] opacity-40 font-mono ml-2">{item.shortcut}</span>}
                    </div>
                );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
