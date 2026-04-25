import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

import { activateBackgroundAudio, deactivateBackgroundAudio } from './audio-session';
import { usePlaybackStore } from './store';

const YOUTUBE_EMBED_ORIGIN = 'https://synmarket.com.br';
const YOUTUBE_EMBED_REFERRER = `${YOUTUBE_EMBED_ORIGIN}/`;

function getYoutubeEmbedUri(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    origin: YOUTUBE_EMBED_ORIGIN,
    playsinline: '1',
    widget_referrer: YOUTUBE_EMBED_REFERRER,
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function BackgroundPlaybackHost() {
  const video = usePlaybackStore((s) => s.video);
  const mode = usePlaybackStore((s) => s.mode);
  const close = usePlaybackStore((s) => s.close);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (video) {
      void activateBackgroundAudio();
    } else {
      void deactivateBackgroundAudio();
    }
  }, [video]);

  if (!video) {
    return null;
  }

  const isPip = mode === 'pip';
  const showChrome = mode === 'foreground';

  return (
    <View
      pointerEvents={mode === 'foreground' || mode === 'pip' ? 'auto' : 'none'}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        opacity: mode === 'background-audio' ? 0 : 1,
      }}
    >
      {showChrome ? (
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingHorizontal: 16,
            paddingBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: '#000',
          }}
        >
          <Pressable
            onPress={close}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            hitSlop={12}
          >
            <Ionicons color="#fff" name="chevron-down" size={28} />
          </Pressable>
          <Text
            className="flex-1 text-[14px] font-bold"
            numberOfLines={1}
            style={{ color: '#fff' }}
          >
            {video.title}
          </Text>
        </View>
      ) : null}

      <WebView
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        allowsPictureInPictureMediaPlayback
        androidLayerType="hardware"
        mediaPlaybackRequiresUserAction={false}
        source={{
          headers: {
            Referer: YOUTUBE_EMBED_REFERRER,
          },
          uri: getYoutubeEmbedUri(video.videoId),
        }}
        style={{ flex: 1, backgroundColor: '#000' }}
      />

      {isPip ? null : null}
    </View>
  );
}
