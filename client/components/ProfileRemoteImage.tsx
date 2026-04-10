import { Image, type ImageErrorEventData, type ImageProps } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import { getProfileImageDisplayUri } from '@/lib/profileMediaDisplay';
import type { ProfileMediaItem } from '@/types';

export type ProfileRemoteImageProps = Omit<ImageProps, 'source'> & {
  media: ProfileMediaItem;
};

/**
 * Remote (or file) profile media with disk+memory cache. Prefers `optimizedUri` when set;
 * on fetch failure, retries with legacy `uri`.
 */
export function ProfileRemoteImage({ media, onError, ...rest }: ProfileRemoteImageProps) {
  const preferred = getProfileImageDisplayUri(media);
  const [uri, setUri] = useState(preferred);

  useEffect(() => {
    setUri(preferred);
  }, [preferred, media.id]);

  const handleError = useCallback(
    (event: ImageErrorEventData) => {
      const opt = media.type === 'image' ? media.optimizedUri?.trim() : undefined;
      if (opt && uri === opt) {
        setUri(media.uri);
        return;
      }
      onError?.(event);
    },
    [media.type, media.optimizedUri, media.uri, uri, onError],
  );

  return (
    <Image
      {...rest}
      source={{ uri }}
      cachePolicy="memory-disk"
      onError={handleError}
      recyclingKey={uri}
    />
  );
}
