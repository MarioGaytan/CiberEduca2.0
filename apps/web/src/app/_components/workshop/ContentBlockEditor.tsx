'use client';

import { useState } from 'react';
import { Heading, FileText, Video, ImageIcon, X } from 'lucide-react';

export type ContentBlockType = 'text' | 'youtube' | 'image' | 'heading';

export type ContentBlock = {
  type: ContentBlockType;
  content?: string;
  url?: string;
  caption?: string;
};

type Props = {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  disabled?: boolean;
};

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function YouTubePreview({ url }: { url: string }) {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return <div className="text-sm text-red-400">URL de YouTube inválida</div>;
  }
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function ImagePreview({ url, caption }: { url: string; caption?: string }) {
  const [error, setError] = useState(false);
  
  if (error) {
    return <div className="text-sm text-red-400">No se pudo cargar la imagen</div>;
  }

  return (
    <div className="space-y-2">
      <img
        src={url}
        alt={caption || 'Imagen del taller'}
        className="max-h-80 rounded-xl object-contain"
        onError={() => setError(true)}
      />
      {caption && <div className="text-sm text-zinc-400 italic">{caption}</div>}
    </div>
  );
}

export default function ContentBlockEditor({ blocks, onChange, disabled }: Props) {
  function addBlock(type: ContentBlockType) {
    const newBlock: ContentBlock = { type };
    if (type === 'text' || type === 'heading') {
      newBlock.content = '';
    } else {
      newBlock.url = '';
    }
    onChange([...blocks, newBlock]);
  }

  function updateBlock(index: number, updates: Partial<ContentBlock>) {
    onChange(blocks.map((b, i) => (i === index ? { ...b, ...updates } : b)));
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    onChange(newBlocks);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addBlock('heading')}
          disabled={disabled}
          className="ce-btn ce-btn-soft text-sm disabled:opacity-50"
        >
          + Encabezado
        </button>
        <button
          type="button"
          onClick={() => addBlock('text')}
          disabled={disabled}
          className="ce-btn ce-btn-soft text-sm disabled:opacity-50"
        >
          + Texto
        </button>
        <button
          type="button"
          onClick={() => addBlock('youtube')}
          disabled={disabled}
          className="ce-btn ce-btn-soft text-sm disabled:opacity-50"
        >
          + Video YouTube
        </button>
        <button
          type="button"
          onClick={() => addBlock('image')}
          disabled={disabled}
          className="ce-btn ce-btn-soft text-sm disabled:opacity-50"
        >
          + Imagen
        </button>
      </div>

      {blocks.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/20 p-8 text-center text-sm text-zinc-500">
          Agrega bloques de contenido para tu taller: texto explicativo, videos de YouTube o imágenes.
        </div>
      )}

      {blocks.map((block, idx) => (
        <div key={idx} className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400">
                {block.type === 'heading' && <><Heading className="h-3.5 w-3.5 inline mr-1" /> Encabezado</>}
                {block.type === 'text' && <><FileText className="h-3.5 w-3.5 inline mr-1" /> Texto</>}
                {block.type === 'youtube' && <><Video className="h-3.5 w-3.5 inline mr-1" /> Video YouTube</>}
                {block.type === 'image' && <><ImageIcon className="h-3.5 w-3.5 inline mr-1" /> Imagen</>}
              </span>
              <span className="text-xs text-zinc-600">#{idx + 1}</span>
            </div>
            {!disabled && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveBlock(idx, -1)}
                  disabled={idx === 0}
                  className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-white/10 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(idx, 1)}
                  disabled={idx === blocks.length - 1}
                  className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-white/10 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(idx)}
                  className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {block.type === 'heading' && (
            <input
              type="text"
              value={block.content || ''}
              onChange={(e) => updateBlock(idx, { content: e.target.value })}
              placeholder="Título de sección..."
              disabled={disabled}
              className="ce-field text-lg font-semibold"
            />
          )}

          {block.type === 'text' && (
            <textarea
              value={block.content || ''}
              onChange={(e) => updateBlock(idx, { content: e.target.value })}
              placeholder="Escribe el contenido explicativo aquí..."
              disabled={disabled}
              className="ce-field min-h-[120px]"
            />
          )}

          {block.type === 'youtube' && (
            <div className="space-y-3">
              <input
                type="url"
                value={block.url || ''}
                onChange={(e) => updateBlock(idx, { url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={disabled}
                className="ce-field"
              />
              {block.url && <YouTubePreview url={block.url} />}
              <input
                type="text"
                value={block.caption || ''}
                onChange={(e) => updateBlock(idx, { caption: e.target.value })}
                placeholder="Descripción del video (opcional)"
                disabled={disabled}
                className="ce-field text-sm"
              />
            </div>
          )}

          {block.type === 'image' && (
            <div className="space-y-3">
              <input
                type="url"
                value={block.url || ''}
                onChange={(e) => updateBlock(idx, { url: e.target.value })}
                placeholder="https://ejemplo.com/imagen.jpg"
                disabled={disabled}
                className="ce-field"
              />
              {block.url && <ImagePreview url={block.url} caption={block.caption} />}
              <input
                type="text"
                value={block.caption || ''}
                onChange={(e) => updateBlock(idx, { caption: e.target.value })}
                placeholder="Pie de imagen (opcional)"
                disabled={disabled}
                className="ce-field text-sm"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
