/**
 * Script to sync all DiceBear styles and their options from the API
 * Run with: npx ts-node -r tsconfig-paths/register src/gamification/scripts/sync-dicebear-styles.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DiceBearStyle, DiceBearStyleDocument, DiceBearCategory, DiceBearOptionValue } from '../schemas/dicebear-style.schema';

// All DiceBear styles with metadata (updated 2025)
// Reference: https://www.dicebear.com/styles/
const DICEBEAR_STYLES = [
  // === Characters ===
  { id: 'adventurer', name: 'Adventurer', creator: 'Lisa Wischofsky', license: 'CC BY 4.0', category: 'characters' },
  { id: 'adventurer-neutral', name: 'Adventurer Neutral', creator: 'Lisa Wischofsky', license: 'CC BY 4.0', category: 'characters' },
  { id: 'avataaars', name: 'Avataaars', creator: 'Pablo Stanley', license: 'Free for personal and commercial use', category: 'characters' },
  { id: 'avataaars-neutral', name: 'Avataaars Neutral', creator: 'Pablo Stanley', license: 'Free for personal and commercial use', category: 'characters' },
  { id: 'big-ears', name: 'Big Ears', creator: 'The Visual Team', license: 'CC BY 4.0', category: 'characters' },
  { id: 'big-ears-neutral', name: 'Big Ears Neutral', creator: 'The Visual Team', license: 'CC BY 4.0', category: 'characters' },
  { id: 'big-smile', name: 'Big Smile', creator: 'Ashley Seo', license: 'CC BY 4.0', category: 'characters' },
  { id: 'bottts', name: 'Bottts', creator: 'Pablo Stanley', license: 'Free for personal and commercial use', category: 'characters' },
  { id: 'bottts-neutral', name: 'Bottts Neutral', creator: 'Pablo Stanley', license: 'Free for personal and commercial use', category: 'characters' },
  { id: 'croodles', name: 'Croodles', creator: 'vijay verma', license: 'CC BY 4.0', category: 'characters' },
  { id: 'croodles-neutral', name: 'Croodles Neutral', creator: 'vijay verma', license: 'CC BY 4.0', category: 'characters' },
  { id: 'dylan', name: 'Dylan', creator: 'Natalia Spivak', license: 'CC BY 4.0', category: 'characters' },
  { id: 'fun-emoji', name: 'Fun Emoji', creator: 'Davis Uche', license: 'CC BY 4.0', category: 'characters' },
  { id: 'lorelei', name: 'Lorelei', creator: 'Lisa Wischofsky', license: 'CC0 1.0', category: 'characters' },
  { id: 'lorelei-neutral', name: 'Lorelei Neutral', creator: 'Lisa Wischofsky', license: 'CC0 1.0', category: 'characters' },
  { id: 'micah', name: 'Micah', creator: 'Micah Lanier', license: 'CC BY 4.0', category: 'characters' },
  { id: 'miniavs', name: 'Miniavs', creator: 'Webpixels', license: 'CC BY 4.0', category: 'characters' },
  { id: 'notionists', name: 'Notionists', creator: 'Zoish', license: 'CC0 1.0', category: 'characters' },
  { id: 'notionists-neutral', name: 'Notionists Neutral', creator: 'Zoish', license: 'CC0 1.0', category: 'characters' },
  { id: 'open-peeps', name: 'Open Peeps', creator: 'Pablo Stanley', license: 'CC0 1.0', category: 'characters' },
  { id: 'personas', name: 'Personas', creator: 'Draftbit', license: 'CC BY 4.0', category: 'characters' },
  { id: 'pixel-art', name: 'Pixel Art', creator: 'DiceBear', license: 'CC0 1.0', category: 'characters' },
  { id: 'pixel-art-neutral', name: 'Pixel Art Neutral', creator: 'DiceBear', license: 'CC0 1.0', category: 'characters' },
  { id: 'toon-head', name: 'Toon Head', creator: 'Johan Melin', license: 'CC BY 4.0', category: 'characters' },
  // === Minimalist ===
  { id: 'glass', name: 'Glass', creator: 'DiceBear', license: 'CC0 1.0', category: 'minimalist' },
  { id: 'icons', name: 'Icons', creator: 'Bootstrap', license: 'MIT', category: 'minimalist' },
  { id: 'identicon', name: 'Identicon', creator: 'DiceBear', license: 'CC0 1.0', category: 'minimalist' },
  { id: 'initials', name: 'Initials', creator: 'DiceBear', license: 'CC0 1.0', category: 'minimalist' },
  { id: 'rings', name: 'Rings', creator: 'DiceBear', license: 'CC0 1.0', category: 'minimalist' },
  { id: 'shapes', name: 'Shapes', creator: 'DiceBear', license: 'CC0 1.0', category: 'minimalist' },
  { id: 'thumbs', name: 'Thumbs', creator: 'DiceBear', license: 'CC0 1.0', category: 'minimalist' },
];

// Category display names in Spanish
const CATEGORY_NAMES: Record<string, string> = {
  base: 'Base',
  hair: 'Cabello',
  hairColor: 'Color de Cabello',
  skinColor: 'Tono de Piel',
  eyes: 'Ojos',
  eyebrows: 'Cejas',
  mouth: 'Boca',
  nose: 'Nariz',
  ears: 'Orejas',
  earrings: 'Aretes',
  glasses: 'Lentes',
  accessories: 'Accesorios',
  accessoriesColor: 'Color de Accesorios',
  clothing: 'Ropa',
  clothingColor: 'Color de Ropa',
  clothingGraphic: 'Gráfico de Ropa',
  top: 'Parte Superior',
  topColor: 'Color Superior',
  facialHair: 'Vello Facial',
  facialHairColor: 'Color Vello Facial',
  features: 'Características',
  backgroundColor: 'Color de Fondo',
  backgroundType: 'Tipo de Fondo',
  beard: 'Barba',
  beardColor: 'Color de Barba',
  body: 'Cuerpo',
  bodyColor: 'Color de Cuerpo',
  face: 'Cara',
  head: 'Cabeza',
  mask: 'Máscara',
  mouthColor: 'Color de Boca',
  noseColor: 'Color de Nariz',
  shirt: 'Camisa',
  shirtColor: 'Color de Camisa',
  glassesProbability: 'Probabilidad de Lentes',
  earringsProbability: 'Probabilidad de Aretes',
  featuresProbability: 'Probabilidad de Características',
  hairProbability: 'Probabilidad de Cabello',
  hatColor: 'Color de Sombrero',
  hat: 'Sombrero',
  hatProbability: 'Probabilidad de Sombrero',
  eyeColor: 'Color de Ojos',
  eyesColor: 'Color de Ojos',
  lipColor: 'Color de Labios',
  cheekColor: 'Color de Mejillas',
  frecklesProbability: 'Probabilidad de Pecas',
  dimplesProbability: 'Probabilidad de Hoyuelos',
  // New categories for various styles
  cheeks: 'Mejillas',
  cheeksColor: 'Color de Mejillas',
  eyesShadow: 'Sombra de Ojos',
  eyesShadowColor: 'Color Sombra de Ojos',
  freckles: 'Pecas',
  frecklesColor: 'Color de Pecas',
  gesture: 'Gesto',
  pattern: 'Patrón',
  primaryColor: 'Color Primario',
  secondaryColor: 'Color Secundario',
  tertiaryColor: 'Color Terciario',
  emotion: 'Emoción',
  shape: 'Forma',
  texture: 'Textura',
  variant: 'Variante',
  baseColor: 'Color Base',
  mole: 'Lunares',
  moleProbability: 'Probabilidad de Lunares',
  blush: 'Rubor',
  blushColor: 'Color de Rubor',
  flip: 'Voltear',
  style: 'Estilo',
  backgroundRotation: 'Rotación de Fondo',
  icon: 'Icono',
  row1: 'Fila 1',
  row2: 'Fila 2',
  row3: 'Fila 3',
  row4: 'Fila 4',
  row5: 'Fila 5',
  sides: 'Lados',
  mouthSmile: 'Sonrisa',
  mouthSmileProbability: 'Probabilidad de Sonrisa',
  shapeColor: 'Color de Forma',
  smile: 'Sonrisa',
  smileProbability: 'Probabilidad de Sonrisa',
  sideburn: 'Patillas',
  sideburnProbability: 'Probabilidad de Patillas',
  spectacles: 'Anteojos',
  spectaclesProbability: 'Probabilidad de Anteojos',
  tatoos: 'Tatuajes',
  tatoosProbability: 'Probabilidad de Tatuajes',
  wrinkles: 'Arrugas',
  wrinklesProbability: 'Probabilidad de Arrugas',
};

// Option value display names
function getOptionDisplayName(category: string, value: string): string {
  // Hair options
  if (category === 'hair') {
    if (value.startsWith('long')) return `Largo ${value.replace('long', '')}`;
    if (value.startsWith('short')) return `Corto ${value.replace('short', '')}`;
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  
  // Variant options
  if (value.startsWith('variant')) {
    return `Variante ${value.replace('variant', '')}`;
  }
  
  // Common transformations
  const displayNames: Record<string, string> = {
    default: 'Por defecto',
    none: 'Ninguno',
    transparent: 'Transparente',
    solid: 'Sólido',
    gradientLinear: 'Gradiente Lineal',
    happy: 'Feliz',
    sad: 'Triste',
    surprised: 'Sorprendido',
    angry: 'Enojado',
    wink: 'Guiño',
    smile: 'Sonrisa',
    serious: 'Serio',
    birthmark: 'Lunar',
    blush: 'Rubor',
    freckles: 'Pecas',
    mustache: 'Bigote',
    round: 'Redondo',
    square: 'Cuadrado',
  };
  
  return displayNames[value] || value.charAt(0).toUpperCase() + value.slice(1).replace(/([A-Z])/g, ' $1');
}

// Helper to format camelCase to readable name
function formatDisplayName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// Determine field type from schema property
function determineFieldType(key: string, prop: any): string {
  if (prop.type === 'boolean') return 'boolean';
  if (prop.type === 'integer') return 'integer';
  if (prop.type === 'array') return 'array';
  if (prop.enum) return 'enum';
  return 'unknown';
}

async function fetchSchema(styleId: string): Promise<any> {
  const url = `https://api.dicebear.com/9.x/${styleId}/schema.json`;
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (attempt === maxRetries) {
          console.warn(`  ⚠️ Could not fetch schema for ${styleId}: ${response.status}`);
          return null;
        }
        await new Promise(r => setTimeout(r, 1000 * attempt)); // Backoff
        continue;
      }
      return await response.json();
    } catch (error) {
      if (attempt === maxRetries) {
        console.warn(`  ⚠️ Error fetching schema for ${styleId}:`, error);
        return null;
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return null;
}

function parseSchemaToCategories(schema: any): DiceBearCategory[] {
  const categories: DiceBearCategory[] = [];
  const properties = schema?.properties || {};
  
  // Skip these generic/internal properties that don't affect appearance meaningfully
  const skipProperties = [
    'seed', 'flip', 'rotate', 'scale', 'radius', 'size', 
    'translateX', 'translateY', 'clip', 'randomizeIds'
  ];
  
  let sortOrder = 0;
  
  for (const [key, prop] of Object.entries(properties) as [string, any][]) {
    if (skipProperties.includes(key)) continue;
    
    const category: DiceBearCategory = {
      name: key,
      displayName: CATEGORY_NAMES[key] || formatDisplayName(key),
      type: determineFieldType(key, prop),
      options: [],
      sortOrder: sortOrder++,
    };
    
    // Check if it's a color property (by pattern or naming convention)
    const isColorField = 
      prop.items?.pattern?.includes('[a-fA-F0-9]') || 
      prop.items?.pattern?.includes('fA-F0-9') ||
      key.toLowerCase().includes('color') ||
      (prop.type === 'array' && prop.default?.every?.((v: string) => /^[a-fA-F0-9]{6}$/.test(v)));
    
    if (isColorField) {
      category.isColor = true;
      category.type = 'color';
      category.colorPattern = prop.items?.pattern;
      
      // Collect colors from examples, defaults, and enum
      const colorSet = new Set<string>();
      
      // From examples
      if (Array.isArray(prop.examples)) {
        prop.examples.flat().forEach((c: string) => {
          if (c && c !== 'transparent' && /^[a-fA-F0-9]{3,8}$/.test(c)) colorSet.add(c);
        });
      }
      
      // From default
      if (Array.isArray(prop.default)) {
        prop.default.forEach((c: string) => {
          if (c && c !== 'transparent' && /^[a-fA-F0-9]{3,8}$/.test(c)) colorSet.add(c);
        });
      }
      
      // From enum in items
      if (prop.items?.enum) {
        prop.items.enum.forEach((c: string) => {
          if (c && c !== 'transparent' && /^[a-fA-F0-9]{3,8}$/.test(c)) colorSet.add(c);
        });
      }
      
      colorSet.forEach(color => {
        category.options.push({
          value: color,
          displayName: `#${color.toUpperCase()}`,
        });
      });
    }
    // Array of string/enum options
    else if (prop.type === 'array' && prop.items?.enum) {
      prop.items.enum.forEach((value: string) => {
        category.options.push({
          value,
          displayName: getOptionDisplayName(key, value),
        });
      });
    }
    // Single enum (not array)
    else if (prop.enum) {
      prop.enum.forEach((value: string) => {
        category.options.push({
          value: String(value),
          displayName: getOptionDisplayName(key, String(value)),
        });
      });
    }
    // Integer with min/max (probability fields, etc)
    else if (prop.type === 'integer') {
      category.type = 'integer';
      category.min = prop.minimum ?? 0;
      category.max = prop.maximum ?? 100;
      // For probability fields, add preset options
      if (key.toLowerCase().includes('probability')) {
        category.options = [
          { value: '0', displayName: '0%' },
          { value: '25', displayName: '25%' },
          { value: '50', displayName: '50%' },
          { value: '75', displayName: '75%' },
          { value: '100', displayName: '100%' },
        ];
      }
    }
    // Boolean fields
    else if (prop.type === 'boolean') {
      category.type = 'boolean';
      category.options = [
        { value: 'true', displayName: 'Sí' },
        { value: 'false', displayName: 'No' },
      ];
    }
    
    // Only add categories with options or numeric ranges
    if (category.options.length > 0 || category.type === 'integer' || category.isColor) {
      categories.push(category);
    }
  }
  
  // Sort: important categories first
  const priorityOrder = ['skinColor', 'hair', 'hairColor', 'eyes', 'eyebrows', 'mouth', 'nose', 'glasses', 'accessories', 'clothing', 'backgroundColor'];
  categories.sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.name);
    const bIndex = priorityOrder.indexOf(b.name);
    if (aIndex === -1 && bIndex === -1) return a.sortOrder - b.sortOrder;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  
  // Update sort order after sorting
  categories.forEach((cat, i) => cat.sortOrder = i);
  
  return categories;
}

async function main() {
  console.log('🎨 Syncing DiceBear styles...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const styleModel = app.get<Model<DiceBearStyleDocument>>(getModelToken(DiceBearStyle.name));

  let synced = 0;
  let failed = 0;

  for (const style of DICEBEAR_STYLES) {
    console.log(`📦 Processing ${style.name}...`);
    
    const schema = await fetchSchema(style.id);
    
    if (!schema) {
      failed++;
      continue;
    }
    
    const categories = parseSchemaToCategories(schema);
    
    const styleDoc: Partial<DiceBearStyle> = {
      styleId: style.id,
      displayName: style.name,
      creator: style.creator,
      license: style.license || 'CC BY 4.0',
      styleCategory: style.category,
      apiUrl: `https://api.dicebear.com/9.x/${style.id}/svg`,
      schemaUrl: `https://api.dicebear.com/9.x/${style.id}/schema.json`,
      categories,
      isActive: true,
      sortOrder: DICEBEAR_STYLES.indexOf(style),
      lastSyncedAt: new Date(),
      description: `${style.name} by ${style.creator}`,
    };
    
    await styleModel.findOneAndUpdate(
      { styleId: style.id },
      { $set: styleDoc },
      { upsert: true, new: true }
    );
    
    console.log(`  ✅ ${style.name}: ${categories.length} categories, ${categories.reduce((sum, c) => sum + c.options.length, 0)} options`);
    synced++;
  }

  console.log(`\n✅ Sync complete: ${synced} styles synced, ${failed} failed`);
  
  await app.close();
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
