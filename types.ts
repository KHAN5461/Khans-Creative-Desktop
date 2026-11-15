import React from 'react';

export interface StickerData {
  id: string;
  text: string;
  rotation: number;
  top: string;
  left: string;
  variant?: 'default' | 'error';
}

export interface DockItemData {
  id: string;
  icon?: React.ReactNode;
  label?: string;
  onClick?: () => void;
  type?: 'icon' | 'separator';
}
