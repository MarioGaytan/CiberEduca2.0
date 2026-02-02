'use client';

import { useMemo } from 'react';

export type DiceBearConfig = {
  style: string;
  seed?: string;
  backgroundColor?: string;
  skinColor?: string;
  hair?: string;
  hairColor?: string;
  eyes?: string;
  eyebrows?: string;
  mouth?: string;
  accessories?: string;
  accessoriesColor?: string;
  clothing?: string;
  clothingColor?: string;
  facialHair?: string;
  top?: string;
};

type Props = {
  config: Partial<DiceBearConfig>;
  seed?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
};

const SIZE_MAP: Record<string, number> = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

export function buildDiceBearUrl(config: Partial<DiceBearConfig>, seed?: string): string {
  const style = config.style || 'avataaars';
  const baseUrl = `https://api.dicebear.com/9.x/${style}/svg`;
  
  const params = new URLSearchParams();
  
  if (seed) params.set('seed', seed);
  if (config.backgroundColor && config.backgroundColor !== 'transparent') {
    params.set('backgroundColor', config.backgroundColor);
  }
  
  // Style-specific params for avataaars
  if (style === 'avataaars') {
    if (config.skinColor) params.set('skinColor', config.skinColor);
    if (config.top && config.top !== 'none') params.set('top', config.top);
    if (config.eyes && config.eyes !== 'default') params.set('eyes', config.eyes);
    if (config.eyebrows) params.set('eyebrows', config.eyebrows);
    if (config.mouth && config.mouth !== 'default') params.set('mouth', config.mouth);
    if (config.accessories && config.accessories !== 'none') {
      params.set('accessories', config.accessories);
      params.set('accessoriesProbability', '100');
    }
    if (config.clothing) params.set('clothing', config.clothing);
    if (config.clothingColor) params.set('clothingColor', config.clothingColor);
    if (config.facialHair) params.set('facialHair', config.facialHair);
    if (config.hairColor) params.set('hairColor', config.hairColor);
  }
  
  // For other styles, pass relevant params
  if (style === 'lorelei' || style === 'notionists' || style === 'open-peeps' || style === 'pixel-art') {
    if (config.backgroundColor) params.set('backgroundColor', config.backgroundColor);
  }
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export default function DiceBearAvatar({ config, seed, size = 'md', className = '' }: Props) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 48;
  
  const url = useMemo(() => buildDiceBearUrl(config, seed), [config, seed]);
  
  return (
    <img
      src={url}
      alt="Avatar"
      width={pixelSize}
      height={pixelSize}
      className={`rounded-full ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    />
  );
}
