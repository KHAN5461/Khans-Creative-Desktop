import React, { useState, useRef } from 'react';
import Sticker from './Sticker';
import Dock from './Dock';
import DraggableWindow from './DraggableWindow';
import Terminal from './Terminal';
import Settings from './Settings';
import { ContextMenu } from './ContextMenu';
import { useTheme } from '../theme/ThemeContext';
import { StickerData, DockItemData } from '../types';
import { ThemeId } from '../theme/types'; 
import { themes } from '../theme/themes'; 
import { 
    IconArrowLeft, IconCodeBracket, IconFolder, IconLinkedIn, IconGithub, 
    IconTerminal, IconApps, IconRefresh, IconPlus, IconPalette, IconMonitor 
} from './Icons';

// Coordinates and rotations derived from the design spec
const INITIAL_STICKERS: StickerData[] = [
  { id: '1', text: "hi-i'm-khan", rotation: -1.7, left: '14.96%', top: '14.82%' },
  { id: '2', text: 'pixel-perfect', rotation: 1.1, left: '58.41%', top: '36.62%' },
  { id: '3', text: 'creative-developer', rotation: 1.1, left: '35.53%', top: '7.87%' },
  { id: '4', text: 'creativity', rotation: -1.1, left: '64.98%', top: '7.89%' },
  { id: '5', text: 'designer', rotation: 1.7, left: '84.96%', top: '4.84%' },
  { id: '6', text: 'developer', rotation: 2.9, left: '50.16%', top: '19.09%' },
  { id: '7', text: 'ui-ux', rotation: -2.9, left: '74.93%', top: '29.8%' },
  { id: '8', text: 'logic-with-soul', rotation: -1.1, left: '32.4%', top: '29.98%' }, 
  { id: '9', text: 'problem-solver', rotation: -1.1, left: '5.62%', top: '31.75%' },
];

// --- File System Data Types & Mock Data ---

interface FileSystemItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size: string;
  description?: string;
  techStack?: string[];
  items?: FileSystemItem[]; // Only for folders
}

const PROJECT_DATA: FileSystemItem[] = [
  {
    id: 'selected-works',
    name: 'Selected Works',
    type: 'folder',
    size: '3 items',
    items: [
       { 
         id: 'work-1', 
         name: 'Fintech_Dashboard.tsx', 
         type: 'file', 
         size: '124KB', 
         description: 'A high-performance real-time analytics dashboard.',
         techStack: ['React', 'TypeScript', 'D3.js', 'WebSockets', 'Tailwind']
       },
       { 
         id: 'work-2', 
         name: 'Luxury_Ecomm.tsx', 
         type: 'file', 
         size: '86KB', 
         description: 'Award-winning e-commerce experience.',
         techStack: ['Next.js', 'Three.js', 'Framer Motion', 'Shopify API']
       },
    ]
  },
  {
    id: 'experiments',
    name: 'Experiments',
    type: 'folder',
    size: '4 items',
    items: [
       { id: 'exp-1', name: 'Generative_Art.js', type: 'file', size: '14KB', description: 'Canvas-based generative art.', techStack: ['Canvas API', 'p5.js'] },
       { id: 'exp-2', name: 'WebAudio_Synth.ts', type: 'file', size: '28KB', description: 'Modular synthesizer.', techStack: ['Web Audio API', 'React'] },
    ]
  },
  {
    id: 'archive',
    name: 'Archive',
    type: 'folder',
    size: '2 items',
    items: []
  },
  {
      id: 'assets',
      name: 'Assets',
      type: 'folder',
      size: '120 items',
      items: [] // Empty for demo
  }
];

// --- Components ---

const MobileTopBar = () => (
  <div className="fixed top-[10px] left-[14px] right-[14px] z-40 h-[46px] md:hidden pointer-events-none">
     <div className="w-full h-full bg-surface border border-border rounded-[42px] flex items-center justify-center pointer-events-auto shadow-sm">
        <span className="font-roboto text-[16px] text-text-main -rotate-[0.24deg] select-none">
          hi-i'm-khan
        </span>
     </div>
  </div>
);

const CodeEditor = () => (
    <div className="h-full w-full bg-[#1e1e1e] p-6 font-mono text-sm leading-relaxed text-gray-300 selection:bg-gray-700 overflow-y-auto">
        {/* Keeping code editor dark themed always for code highlighting consistency */}
        <div className="flex">
            <div className="flex flex-col text-gray-600 select-none pr-4 text-right border-r border-gray-700 mr-4 font-mono">
                {Array.from({length: 12}).map((_, i) => <span key={i}>{i + 1}</span>)}
            </div>
            <div className="flex-1 whitespace-pre">
                <div><span className="text-pink-400">const</span> <span className="text-blue-400">me</span> = <span className="text-yellow-300">{`{`}</span></div>
                <div className="pl-4"><span className="text-blue-300">role</span>: <span className="text-green-400">'Creative Frontend Engineer'</span>,</div>
                <div className="pl-4"><span className="text-blue-300">stack</span>: <span className="text-yellow-300">[</span><span className="text-green-400">'React'</span>, <span className="text-green-400">'Next.js'</span><span className="text-yellow-300">]</span>,</div>
                <div><span className="text-yellow-300">{`}`}</span>;</div>
            </div>
        </div>
    </div>
);

const FileExplorer = () => {
  const [path, setPath] = useState<FileSystemItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileSystemItem | null>(null);

  const currentFolderItems = path.length === 0 ? PROJECT_DATA : path[path.length - 1].items || [];
  const currentFolderName = path.length === 0 ? '~/projects' : path[path.length - 1].name;

  const handleNavigate = (item: FileSystemItem) => {
    if (item.type === 'folder') {
      setPath([...path, item]);
      setSelectedFile(null);
    } else {
      setSelectedFile(item);
    }
  };

  const handleBack = () => {
    if (selectedFile) {
      setSelectedFile(null);
    } else if (path.length > 0) {
      setPath(path.slice(0, -1));
    }
  };

  if (selectedFile) {
    return (
      <div className="flex flex-col h-full bg-surface text-text-main">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <button onClick={handleBack} className="p-2 hover:bg-neutral-90/50 dark:hover:bg-neutral-10/50 rounded-full">
            <IconArrowLeft />
          </button>
          <div className="flex flex-col">
            <span className="font-bold">{selectedFile.name}</span>
            <span className="text-xs text-text-muted">{selectedFile.size}</span>
          </div>
        </div>
        <div className="p-8 flex flex-col gap-6 overflow-y-auto">
          <div className="w-16 h-16 bg-neutral-90 dark:bg-neutral-10 rounded-lg flex items-center justify-center text-primary-40">
             <IconCodeBracket />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Project Description</h3>
            <p className="text-text-muted leading-relaxed max-w-2xl">{selectedFile.description}</p>
          </div>
          
          {selectedFile.techStack && (
            <div>
              <h3 className="font-bold text-lg mb-3">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {selectedFile.techStack.map(tech => (
                  <span key={tech} className="px-3 py-1 bg-neutral-90 dark:bg-neutral-10 rounded-full text-sm font-medium">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface text-text-main">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface sticky top-0 z-10">
        <button 
          onClick={handleBack} 
          disabled={path.length === 0}
          className={`p-1.5 rounded-full ${path.length === 0 ? 'opacity-20 cursor-default' : 'hover:bg-neutral-90/50 opacity-100'}`}
        >
          <IconArrowLeft />
        </button>
        <span className="text-sm font-mono text-text-muted">{currentFolderName}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {currentFolderItems.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-text-muted pb-10">
              <span className="mb-2 text-2xl">📂</span>
              <span className="font-roboto">Folder is empty</span>
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentFolderItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item)}
                className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-neutral-90/50 dark:hover:bg-neutral-10/50 cursor-pointer transition-colors border border-transparent hover:border-border text-center focus:outline-none"
              >
                <div className="transform transition-transform group-hover:scale-105 text-text-main">
                  {item.type === 'folder' ? <IconFolder /> : (
                     <div className="w-10 h-10 flex items-center justify-center bg-neutral-90 dark:bg-neutral-10 rounded text-text-muted">
                       <IconCodeBracket />
                     </div>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-roboto font-medium text-sm break-all line-clamp-2">{item.name}</span>
                  <span className="font-roboto text-text-muted text-[10px] mt-0.5">{item.size}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="px-4 py-2 border-t border-border bg-neutral-90 dark:bg-neutral-10 text-[10px] text-text-muted font-mono flex justify-between">
          <span>{currentFolderItems.length} items</span>
          <span>Free space: 42GB</span>
      </div>
    </div>
  );
};

// --- Window Manager Types ---
type WindowId = 'projects' | 'terminal' | 'code' | 'settings';

interface WindowState {
  isOpen: boolean;
  zIndex: number;
  position: { x: number; y: number };
}

const DesktopEnvironment: React.FC = () => {
  const [stickers, setStickers] = useState<StickerData[]>(INITIAL_STICKERS);
  const { themeId, setTheme } = useTheme();
  const constraintsRef = useRef(null);
  
  // Window Manager State
  const [windows, setWindows] = useState<Record<WindowId, WindowState>>({
    projects: { isOpen: false, zIndex: 40, position: { x: 0, y: 0 } },
    terminal: { isOpen: false, zIndex: 41, position: { x: 0, y: 0 } },
    code: { isOpen: false, zIndex: 42, position: { x: 0, y: 0 } },
    settings: { isOpen: false, zIndex: 43, position: { x: 0, y: 0 } },
  });

  const resetDesktop = () => setStickers(INITIAL_STICKERS);
  
  const handleAddSticker = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const phrases = ["innovation", "make-it-pop", "ship-it", "refactor", "coffee-time", "deadline", "hustle", "flow-state"];
    const text = phrases[Math.floor(Math.random() * phrases.length)];
    const rotation = (Math.random() * 10) - 5;
    const top = `${20 + Math.random() * 50}%`;
    const left = `${20 + Math.random() * 50}%`;
    
    setStickers(prev => [...prev, { id, text, rotation, top, left, variant: 'default' }]);
  };

  const handleNextTheme = () => {
      const themeKeys = Object.keys(themes) as ThemeId[];
      const currentIndex = themeKeys.indexOf(themeId);
      const nextIndex = (currentIndex + 1) % themeKeys.length;
      setTheme(themeKeys[nextIndex]);
  };

  const handleCloseSticker = (id: string) => setStickers((prev) => prev.filter((s) => s.id !== id));
  
  const handleInteractSticker = (id: string) => {
    setStickers((prev) => {
      const index = prev.findIndex(s => s.id === id);
      if (index === -1 || index === prev.length - 1) return prev;
      const newStickers = [...prev];
      const [sticker] = newStickers.splice(index, 1);
      newStickers.push(sticker);
      return newStickers;
    });
  };

  const handleTerminalCommand = (cmd: string) => {
    if (cmd === 'error') {
       const newErrors: StickerData[] = [];
       // Spawn a stack of error windows
       for (let i = 0; i < 6; i++) {
           const id = `err-${Date.now()}-${i}`;
           // Cascade position
           const top = `${20 + (i * 5) + (Math.random() * 5 - 2.5)}%`;
           const left = `${30 + (i * 5) + (Math.random() * 5 - 2.5)}%`;
           
           newErrors.push({
               id,
               text: "Task failed successfully.",
               rotation: 0, // Errors don't rotate
               top,
               left,
               variant: 'error'
           });
       }
       setStickers(prev => [...prev, ...newErrors]);
    }
  };

  const focusWindow = (id: WindowId) => {
    setWindows(prev => {
      const currentWindow = prev[id];
      const maxZ = Math.max(...Object.values(prev).map((w: WindowState) => w.zIndex));
      if (currentWindow.zIndex === maxZ) return prev;
      return { ...prev, [id]: { ...currentWindow, zIndex: maxZ + 1 } };
    });
  };

  const openWindow = (id: WindowId) => {
    setWindows(prev => {
      const maxZ = Math.max(...Object.values(prev).map((w: WindowState) => w.zIndex));
      return { ...prev, [id]: { ...prev[id], isOpen: true, zIndex: maxZ + 1 } };
    });
  };

  const closeWindow = (id: WindowId) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], isOpen: false } }));
  };

  const updateWindowPosition = (id: WindowId, pos: { x: number; y: number }) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], position: pos } }));
  };

  // Dock items state
  const dockItems: DockItemData[] = [
    { id: 'cursor', icon: <IconArrowLeft />, label: 'Pointer' },
    { id: 'settings', icon: <IconApps />, label: 'Settings', onClick: () => openWindow('settings') }, 
    { id: 'terminal', icon: <IconTerminal />, label: 'Terminal', onClick: () => openWindow('terminal') },
    { id: 'code-brackets', icon: <IconCodeBracket />, label: 'Code', onClick: () => openWindow('code') },
    { id: 'folder', icon: <IconFolder />, label: 'Projects', onClick: () => openWindow('projects') },
    { id: 'separator-1', type: 'separator' },
    { id: 'linkedin', icon: <IconLinkedIn />, label: 'LinkedIn', onClick: () => window.open('https://linkedin.com', '_blank') },
    { id: 'github', icon: <IconGithub />, label: 'GitHub', onClick: () => window.open('https://github.com', '_blank') },
  ];

  const contextMenuItems = [
      { label: 'Refresh Desktop', action: resetDesktop, icon: <IconRefresh size={14} />, shortcut: '⌘R' },
      { label: 'Add Sticky Note', action: handleAddSticker, icon: <IconPlus size={14} /> },
      { label: 'Next Theme', action: handleNextTheme, icon: <IconPalette size={14} />, separator: true },
      { label: 'System Settings', action: () => openWindow('settings'), icon: <IconMonitor size={14} /> }
  ];

  return (
    <ContextMenu items={contextMenuItems}>
        <div ref={constraintsRef} className={`relative h-screen w-screen overflow-hidden overscroll-none touch-none cursor-auto`}>
        <MobileTopBar />

        {/* Background Layer with gradients */}
        <div className="absolute inset-0 z-[-1] transition-all duration-300 ease-in-out">
            <div className="w-full h-full bg-bg-app">
                {/* Desktop Gradient: Radial with subtle movement */}
                <div className="hidden md:block absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,var(--primary-95)_0%,transparent_70%)] opacity-80" />
                <div className="hidden md:block absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,var(--secondary-95)_0%,transparent_50%)] opacity-60" />
                
                {/* Mobile Gradient: Linear for better vertical rhythm */}
                <div className="md:hidden absolute inset-0 bg-gradient-to-b from-primary-95/80 via-bg-app to-bg-app" />
            </div>
        </div>

        <div className="absolute inset-0 hidden md:block">
            {stickers.map((sticker) => (
            <Sticker
                key={sticker.id}
                {...sticker}
                onClose={handleCloseSticker}
                onInteract={handleInteractSticker}
            />
            ))}
            {stickers.length === 0 && (
                <div className="flex h-full w-full items-center justify-center pointer-events-none">
                    <button 
                        onClick={resetDesktop}
                        className="pointer-events-auto rounded-full bg-surface px-6 py-3 font-roboto text-text-main shadow-lg border border-border hover:bg-neutral-90 dark:hover:bg-neutral-10 transition-all"
                    >
                        Refresh Desktop
                    </button>
                </div>
            )}
        </div>

        <DraggableWindow 
            isOpen={windows.projects.isOpen} 
            onClose={() => closeWindow('projects')}
            onFocus={() => focusWindow('projects')}
            onDragEnd={(pos) => updateWindowPosition('projects', pos)}
            zIndex={windows.projects.zIndex}
            defaultPosition={windows.projects.position}
            constraintsRef={constraintsRef}
            title="~/projects"
            contentClassName="p-0 bg-surface"
        >
            <FileExplorer />
        </DraggableWindow>

        <DraggableWindow 
            isOpen={windows.terminal.isOpen} 
            onClose={() => closeWindow('terminal')}
            onFocus={() => focusWindow('terminal')}
            onDragEnd={(pos) => updateWindowPosition('terminal', pos)}
            zIndex={windows.terminal.zIndex}
            defaultPosition={windows.terminal.position}
            constraintsRef={constraintsRef}
            title="khan@portfolio — zsh"
            contentClassName="bg-[#1C1C1E] p-0"
        >
            <Terminal onCommand={handleTerminalCommand} />
        </DraggableWindow>

        <DraggableWindow 
            isOpen={windows.code.isOpen} 
            onClose={() => closeWindow('code')}
            onFocus={() => focusWindow('code')}
            onDragEnd={(pos) => updateWindowPosition('code', pos)}
            zIndex={windows.code.zIndex}
            defaultPosition={windows.code.position}
            constraintsRef={constraintsRef}
            title="User.tsx"
            contentClassName="bg-[#1e1e1e] p-0"
        >
            <CodeEditor />
        </DraggableWindow>

        {/* Settings Window */}
        <DraggableWindow 
            isOpen={windows.settings.isOpen} 
            onClose={() => closeWindow('settings')}
            onFocus={() => focusWindow('settings')}
            onDragEnd={(pos) => updateWindowPosition('settings', pos)}
            zIndex={windows.settings.zIndex}
            defaultPosition={windows.settings.position}
            constraintsRef={constraintsRef}
            title="System Settings"
            contentClassName="bg-surface p-0"
        >
            <Settings />
        </DraggableWindow>

        <Dock items={dockItems} />
        </div>
    </ContextMenu>
  );
};

export default DesktopEnvironment;
