'use client';

import { useState } from 'react';

export type ContentBlockType = 'text' | 'youtube' | 'image' | 'heading';

export type ContentBlock = {
  type: ContentBlockType;
  content?: string;
  url?: string;
  caption?: string;
};

type Props = {
  blocks: ContentBlock[];
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

function YouTubeEmbed({ url, caption }: { url: string; caption?: string }) {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  return (
    <div className="my-6">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {caption && (
        <p className="mt-2 text-center text-sm text-zinc-400 italic">{caption}</p>
      )}
    </div>
  );
}

function ImageBlock({ url, caption }: { url: string; caption?: string }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (error) return null;

  return (
    <figure className="my-6">
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900">
        {!loaded && (
          <div className="flex h-48 items-center justify-center text-zinc-500">
            Cargando imagen...
          </div>
        )}
        <img
          src={url}
          alt={caption || 'Imagen del taller'}
          className={`w-full rounded-2xl object-contain transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-zinc-400 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export default function ContentBlockViewer({ blocks }: Props) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 p-8 text-center text-zinc-500">
        Este taller aún no tiene contenido.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading':
            return (
              <h2 key={idx} className="mt-8 text-xl font-bold text-zinc-100 first:mt-0">
                {block.content}
              </h2>
            );

          case 'text':
            return (
              <div
                key={idx}
                className="text-zinc-300 leading-relaxed whitespace-pre-wrap"
              >
                {block.content}
              </div>
            );

          case 'youtube':
            return block.url ? (
              <YouTubeEmbed key={idx} url={block.url} caption={block.caption} />
            ) : null;

          case 'image':
            return block.url ? (
              <ImageBlock key={idx} url={block.url} caption={block.caption} />
            ) : null;

          default:
            return null;
        }
      })}
    </div>
  );
}
