/**
 * Script to sync all DiceBear styles and their options from the API
 * Run with: npx ts-node -r tsconfig-paths/register src/gamification/scripts/sync-dicebear-styles.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DiceBearStyle, DiceBearStyleDocument, DiceBearCategory, DiceBearOptionValue } from '../schemas/dicebear-style.schema';

// All 32 DiceBear styles with metadata
const DICEBEAR_STYLES = [
  { id: 'adventurer', name: 'Adventurer', creator: 'Lisa Wischofsky' },
  { id: 'adventurer-neutral', name: 'Adventurer Neutral', creator: 'Lisa Wischofsky' },
  { id: 'avataaars', name: 'Avataaars', creator: 'Pablo Stanley' },
  { id: 'avataaars-neutral', name: 'Avataaars Neutral', creator: 'Pablo Stanley' },
  { id: 'big-ears', name: 'Big Ears', creator: 'The Visual Team' },
  { id: 'big-ears-neutral', name: 'Big Ears Neutral', creator: 'The Visual Team' },
  { id: 'big-smile', name: 'Big Smile', creator: 'Ashley Seo' },
  { id: 'bottts', name: 'Bottts', creator: 'Pablo Stanley' },
  { id: 'bottts-neutral', name: 'Bottts Neutral', creator: 'Pablo Stanley' },
  { id: 'croodles', name: 'Croodles', creator: 'vijay verma' },
  { id: 'croodles-neutral', name: 'Croodles Neutral', creator: 'vijay verma' },
  { id: 'dylan', name: 'Dylan', creator: 'Natalia Flores' },
  { id: 'fun-emoji', name: 'Fun Emoji', creator: 'Davis Uche' },
  { id: 'glass', name: 'Glass', creator: 'DiceBear' },
  { id: 'icons', name: 'Icons', creator: 'Bootstrap' },
  { id: 'identicon', name: 'Identicon', creator: 'DiceBear' },
  { id: 'initials', name: 'Initials', creator: 'DiceBear' },
  { id: 'lorelei', name: 'Lorelei', creator: 'Lisa Wischofsky' },
  { id: 'lorelei-neutral', name: 'Lorelei Neutral', creator: 'Lisa Wischofsky' },
  { id: 'micah', name: 'Micah', creator: 'Micah Lanier' },
  { id: 'miniavs', name: 'Miniavs', creator: 'Webpixels' },
  { id: 'notionists', name: 'Notionists', creator: 'Zoish' },
  { id: 'notionists-neutral', name: 'Notionists Neutral', creator: 'Zoish' },
  { id: 'open-peeps', name: 'Open Peeps', creator: 'Pablo Stanley' },
  { id: 'personas', name: 'Personas', creator: 'Draftbit' },
  { id: 'pixel-art', name: 'Pixel Art', creator: 'DiceBear' },
  { id: 'pixel-art-neutral', name: 'Pixel Art Neutral', creator: 'DiceBear' },
  { id: 'rings', name: 'Rings', creator: 'DiceBear' },
  { id: 'shapes', name: 'Shapes', creator: 'DiceBear' },
  { id: 'thumbs', name: 'Thumbs', creator: 'DiceBear' },
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

async function fetchSchema(styleId: string): Promise<any> {
  const url = `https://api.dicebear.com/9.x/${styleId}/schema.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`  ⚠️ Could not fetch schema for ${styleId}: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`  ⚠️ Error fetching schema for ${styleId}:`, error);
    return null;
  }
}

function parseSchemaToCategories(schema: any): DiceBearCategory[] {
  const categories: DiceBearCategory[] = [];
  const properties = schema?.properties || {};
  
  // Skip these generic properties
  const skipProperties = ['seed', 'flip', 'rotate', 'scale', 'radius', 'size', 'translateX', 'translateY', 'clip', 'randomizeIds'];
  
  let sortOrder = 0;
  
  for (const [key, prop] of Object.entries(properties) as [string, any][]) {
    if (skipProperties.includes(key)) continue;
    
    const category: DiceBearCategory = {
      name: key,
      displayName: CATEGORY_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1),
      type: prop.type || 'array',
      options: [],
      sortOrder: sortOrder++,
    };
    
    // Check if it's a color property
    if (prop.items?.pattern?.includes('fA-F0-9') || key.toLowerCase().includes('color')) {
      category.isColor = true;
      category.colorPattern = prop.items?.pattern;
      
      // If there are example colors, add them as options
      if (Array.isArray(prop.examples) && prop.examples.length > 0) {
        const colors = prop.examples.flat();
        colors.forEach((color: string, i: number) => {
          if (color && color !== 'transparent') {
            category.options.push({
              value: color,
              displayName: `#${color}`,
            });
          }
        });
      }
    }
    // Array of string options
    else if (prop.type === 'array' && prop.items?.enum) {
      prop.items.enum.forEach((value: string, i: number) => {
        category.options.push({
          value,
          displayName: getOptionDisplayName(key, value),
        });
      });
    }
    // Integer with min/max
    else if (prop.type === 'integer') {
      category.min = prop.minimum;
      category.max = prop.maximum;
    }
    // Boolean
    else if (prop.type === 'boolean') {
      category.options = [
        { value: 'true', displayName: 'Sí' },
        { value: 'false', displayName: 'No' },
      ];
    }
    
    // Only add categories with options or specific types
    if (category.options.length > 0 || category.isColor || category.type === 'integer') {
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
      license: 'CC BY 4.0',
      apiUrl: `https://api.dicebear.com/9.x/${style.id}/svg`,
      schemaUrl: `https://api.dicebear.com/9.x/${style.id}/schema.json`,
      categories,
      isActive: true,
      sortOrder: DICEBEAR_STYLES.indexOf(style),
      lastSyncedAt: new Date(),
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
