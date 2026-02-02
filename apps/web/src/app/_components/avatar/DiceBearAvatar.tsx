'use client';

import { useMemo } from 'react';

// Dynamic config type - DiceBear styles have different properties
// Using index signature to allow any valid DiceBear parameter
export type DiceBearConfig = {
  style: string;
  seed?: string;
  // Common properties across many styles
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
  // Allow any other DiceBear properties dynamically
  [key: string]: string | undefined;
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

// Keys to exclude from URL params (not DiceBear API params)
const EXCLUDED_KEYS = ['style', 'seed'];

export function buildDiceBearUrl(config: Partial<DiceBearConfig>, seed?: string): string {
  const style = config.style || 'avataaars';
  const baseUrl = `https://api.dicebear.com/9.x/${style}/svg`;
  
  const params = new URLSearchParams();
  
  if (seed) params.set('seed', seed);
  
  // Pass ALL config values to the API (DiceBear ignores unknown params)
  for (const [key, value] of Object.entries(config)) {
    if (EXCLUDED_KEYS.includes(key)) continue;
    if (value === undefined || value === null || value === '' || value === 'none') continue;
    
    // Handle probability params for optional features
    if (['accessories', 'glasses', 'earrings', 'facialHair', 'beard'].includes(key) && value) {
      params.set(`${key}Probability`, '100');
    }
    
    params.set(key, String(value));
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
