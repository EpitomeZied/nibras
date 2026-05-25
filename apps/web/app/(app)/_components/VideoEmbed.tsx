'use client';

import type { CourseVideo } from '@nibras/contracts';

type VideoEmbedProps = {
  video: Pick<CourseVideo, 'title' | 'provider' | 'playbackUrl'>;
  className?: string;
  onEnded?: () => void;
};

export default function VideoEmbed({ video, className, onEnded }: VideoEmbedProps) {
  const url = video.playbackUrl;

  if (video.provider === 'youtube' || video.provider === 'bilibili' || video.provider === 'url') {
    return (
      <iframe
        className={className}
        src={url}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return <video key={url} className={className} src={url} controls onEnded={onEnded} />;
}
