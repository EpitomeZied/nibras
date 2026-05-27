'use client';

import type { CourseVideo } from '@nibras/contracts';

type VideoEmbedProps = {
  video: Pick<CourseVideo, 'title' | 'provider' | 'playbackUrl' | 'embedUrl'>;
  className?: string;
  onEnded?: () => void;
};

const YOUTUBE_ID_RE = /^[\w-]{11}$/;

function looksLikeDirectMediaUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      return id && YOUTUBE_ID_RE.test(id) ? id : null;
    }
    if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') {
        const v = u.searchParams.get('v');
        return v && YOUTUBE_ID_RE.test(v) ? v : null;
      }
      const pathId = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1];
      if (pathId) return pathId;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function toYouTubeNocookieEmbed(url: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
  embed.searchParams.set('rel', '0');
  embed.searchParams.set('modestbranding', '1');
  if (typeof window !== 'undefined') {
    embed.searchParams.set('origin', window.location.origin);
  }
  return embed.toString();
}

function toBilibiliEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith('bilibili.com')) return null;
    if (u.pathname.includes('player.html')) return url;

    const bvMatch = url.match(/(BV[0-9A-Za-z]+)/i);
    if (!bvMatch) return null;
    const embed = new URL('https://player.bilibili.com/player.html');
    embed.searchParams.set('bvid', bvMatch[1]);
    embed.searchParams.set('high_quality', '1');
    return embed.toString();
  } catch {
    return null;
  }
}

function resolveIframeSrc(
  video: Pick<CourseVideo, 'provider' | 'playbackUrl' | 'embedUrl'>
): string {
  const playbackUrl = video.playbackUrl;

  if (video.provider === 'youtube') {
    return toYouTubeNocookieEmbed(playbackUrl) ?? playbackUrl;
  }
  if (video.provider === 'bilibili') {
    return playbackUrl || toBilibiliEmbedUrl(video.embedUrl ?? '') || playbackUrl;
  }
  if (video.provider === 'url') {
    const fromPlayback = toYouTubeNocookieEmbed(playbackUrl);
    if (fromPlayback) return fromPlayback;
    const fromEmbed = video.embedUrl ? toYouTubeNocookieEmbed(video.embedUrl) : null;
    if (fromEmbed) return fromEmbed;
    return playbackUrl;
  }

  return playbackUrl;
}

export default function VideoEmbed({ video, className, onEnded }: VideoEmbedProps) {
  const playbackUrl = video.playbackUrl;

  if (video.provider === 'url' && looksLikeDirectMediaUrl(playbackUrl)) {
    return (
      <video key={playbackUrl} className={className} src={playbackUrl} controls onEnded={onEnded} />
    );
  }

  if (video.provider === 'youtube' || video.provider === 'bilibili' || video.provider === 'url') {
    return (
      <iframe
        className={className}
        src={resolveIframeSrc(video)}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  }

  return (
    <video key={playbackUrl} className={className} src={playbackUrl} controls onEnded={onEnded} />
  );
}
