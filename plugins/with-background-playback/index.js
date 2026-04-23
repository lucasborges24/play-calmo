const { withAndroidManifest, withInfoPlist, AndroidConfig } = require('@expo/config-plugins');

const ANDROID_PERMISSIONS = [
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
  'android.permission.WAKE_LOCK',
];

const PLAYBACK_SERVICE_NAME = '.PlaybackService';
const REQUIRED_CONFIG_CHANGES = [
  'screenSize',
  'smallestScreenSize',
  'screenLayout',
  'orientation',
];

function withBackgroundPlaybackAndroid(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    ANDROID_PERMISSIONS.forEach((permission) => {
      AndroidConfig.Permissions.addPermission(manifest, permission);
    });

    const application = manifest.application?.[0];
    if (!application) {
      return cfg;
    }

    const activity = (application.activity ?? []).find(
      (a) => a.$ && a.$['android:name'] === '.MainActivity',
    );
    if (activity) {
      activity.$['android:supportsPictureInPicture'] = 'true';
      const existing = (activity.$['android:configChanges'] ?? '')
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      const merged = Array.from(new Set([...existing, ...REQUIRED_CONFIG_CHANGES]));
      activity.$['android:configChanges'] = merged.join('|');
    }

    application.service = application.service ?? [];
    const hasService = application.service.some(
      (s) => s.$ && s.$['android:name'] === PLAYBACK_SERVICE_NAME,
    );
    if (!hasService) {
      application.service.push({
        $: {
          'android:name': PLAYBACK_SERVICE_NAME,
          'android:exported': 'false',
          'android:foregroundServiceType': 'mediaPlayback',
        },
      });
    }

    return cfg;
  });
}

function withBackgroundPlaybackIOS(config) {
  return withInfoPlist(config, (cfg) => {
    const modes = Array.isArray(cfg.modResults.UIBackgroundModes)
      ? cfg.modResults.UIBackgroundModes
      : [];
    if (!modes.includes('audio')) {
      modes.push('audio');
    }
    cfg.modResults.UIBackgroundModes = modes;
    return cfg;
  });
}

module.exports = function withBackgroundPlayback(config) {
  let next = withBackgroundPlaybackAndroid(config);
  next = withBackgroundPlaybackIOS(next);
  return next;
};
