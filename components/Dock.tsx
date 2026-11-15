import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DockItemData } from '../types';
import Clock from './Clock';

interface DockProps {
  items: DockItemData[];
}

const MobileDivider = () => (
  <div className="flex h-[51px] w-[16px] items-center justify-center shrink-0 md:hidden">
    <div className="h-[24px] w-[1px] bg-text-main opacity-20"></div>
  </div>
);

const DesktopDivider = () => (
  <div className="hidden md:block h-8 w-[1px] bg-text-main opacity-20 mx-4"></div>
);

const MenuIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  return (
    <div className="relative h-[24px] w-[24px] flex items-center justify-center">
      <motion.div
        initial={false}
        animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1, rotate: isOpen ? 180 : 0 }}
        className="absolute inset-0 rounded-[12px] border-[3px] border-text-main box-border"
      />
      <motion.div
        initial={false}
        animate={{ scale: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0, rotate: isOpen ? 0 : -180 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <X size={24} className="text-text-main" strokeWidth={3} />
      </motion.div>
    </div>
  );
};

const Drawer: React.FC<{ isOpen: boolean; items: DockItemData[] }> = ({ isOpen, items }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="absolute bottom-[94px] left-[14px] md:bottom-[82px] md:left-[32px] z-40
                     bg-surface border border-border shadow-hard
                     rounded-2xl p-4 flex flex-wrap gap-4 max-w-[280px] md:max-w-[320px] pointer-events-auto cursor-default"
        >
          {items.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={item.onClick}
              className="flex flex-col items-center gap-2 group"
            >
               <div className="flex items-center justify-center h-[48px] w-[48px] rounded-[24px] border border-border bg-surface group-hover:bg-neutral-90/50 dark:group-hover:bg-neutral-10/50 transition-colors shadow-medium text-text-main">
                 {item.icon}
               </div>
               {item.label && <span className="text-[10px] font-roboto text-text-main font-medium">{item.label}</span>}
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Dock: React.FC<DockProps> = ({ items }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const visibleItemIds = ['cursor', 'settings', 'folder'];
  const visibleItems = items.filter(item => visibleItemIds.includes(item.id));
  const hiddenItems = items.filter(item => !visibleItemIds.includes(item.id) && item.type !== 'separator');
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <div className="absolute bottom-0 left-0 right-0 h-0 w-full pointer-events-none">
         <Drawer isOpen={isMenuOpen} items={hiddenItems} />
      </div>

      <div className={`
        pointer-events-auto flex items-center transition-all duration-200
        h-[84px] w-full rounded-t-[42px] border-t border-x border-black/10 dark:border-white/10
        bg-surface shadow-none overflow-hidden px-[14px]
        md:h-[71px] md:rounded-t-[42px] md:rounded-b-none md:border-b-0 md:px-8
      `}>
        <div className="flex md:hidden items-center shrink-0">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMenu}
                className="flex h-[51px] w-[51px] shrink-0 items-center justify-center rounded-[25.5px] border border-border bg-surface shadow-medium box-border p-[5px]"
            >
                <MenuIcon isOpen={isMenuOpen} />
            </motion.button>
            <MobileDivider />
        </div>

        <div className="hidden md:flex items-center shrink-0">
             <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMenu}
                className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-surface border border-border shadow-medium hover:bg-neutral-90/50 dark:hover:bg-neutral-10/50 transition-colors"
            >
                <MenuIcon isOpen={isMenuOpen} />
            </motion.button>
            <DesktopDivider />
        </div>

        <div className="flex items-center gap-[12px] md:gap-4 overflow-x-auto scrollbar-hide h-full flex-1 justify-center">
            {visibleItems.map((item) => {
                return (
                <motion.button
                    key={item.id}
                    layoutId={item.id}
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="
                        flex shrink-0 items-center justify-center 
                        border border-border bg-surface shadow-medium
                        h-[51px] w-[51px] rounded-[25.5px]
                        md:h-[48px] md:w-[48px] md:rounded-[24px] md:hover:bg-neutral-90/50 dark:md:hover:bg-neutral-10/50
                    "
                    onClick={item.onClick}
                    title={item.label}
                >
                    <div className="flex items-center justify-center text-text-main">
                        {item.icon}
                    </div>
                </motion.button>
            )})}
        </div>
        
        <MobileDivider />
        <div className="flex items-center shrink-0 gap-3">
             <DesktopDivider />
             <Clock />
        </div>
      </div>
    </div>
  );
};

export default Dock;
