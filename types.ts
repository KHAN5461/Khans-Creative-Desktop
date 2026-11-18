import React from 'react';
export type { ThemeId } from './theme/types';

export type StickerVariant = 'default' | 'highlight' | 'error' | 'pixel' | 'stamp';
export type StickerTone = 'surface' | 'amber' | 'mint' | 'lavender' | 'rose';
export type StampIconId = 'rocket' | 'sparkles' | 'coffee' | 'zap' | 'terminal' | 'heart';

export interface StickerData {
  id: string;
  text: string;
  rotation: number;
  top: string;
  left: string;
  variant?: StickerVariant;
  tone?: StickerTone;
  imageUrl?: string;
  stampIcon?: StampIconId;
}

export type WindowId =
  | 'welcome'
  | 'projects'
  | 'resume'
  | 'pixel'
  | 'code'
  | 'terminal'
  | 'settings';

export type SnapSide = 'left' | 'right' | null;

export type WorkspacePreset = 'showcase-split' | 'recruiter-mode' | 'clean-desk';

export interface WindowState {
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  snapSide: SnapSide;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export type ToyMode = 'default' | 'trail';

export interface DockItemData {
  id: string;
  icon?: React.ReactNode;
  label?: string;
  previewSubtitle?: string;
  onClick?: () => void;
  onCloseWindow?: () => void;
  onMinimizeWindow?: () => void;
  href?: string;
  type?: 'icon' | 'separator';
  windowId?: WindowId;
  isActive?: boolean;
  isMinimized?: boolean;
  badge?: string;
}

export type ProjectCategory =
  | 'Featured Releases'
  | 'Lab Experiments'
  | 'Open Source'
  | 'Design Assets';

export interface ProjectSpecPin {
  id: string;
  label: string;
  metric: string;
  reason: string;
  x: number;
  y: number;
  preset?: 'spring-card' | 'wave-canvas' | 'profile';
}

export interface ProjectItem {
  id: string;
  title: string;
  filename: string;
  category: ProjectCategory;
  size: string;
  year: string;
  role: string;
  summary: string;
  highlights: string[];
  stack: string[];
  previewKind: 'fintech' | 'ecomm' | 'generative' | 'synth' | 'spring-hook' | 'tokens';
  githubUrl: string;
  liveUrl?: string;
  specs?: ProjectSpecPin[];
}
