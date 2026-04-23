describe('product-rule background capability', () => {
  const ORIGINAL = process.env.EXPO_PUBLIC_BACKGROUND_PLAYBACK;

  afterEach(() => {
    process.env.EXPO_PUBLIC_BACKGROUND_PLAYBACK = ORIGINAL;
    jest.resetModules();
  });

  function loadWith(value: string | undefined) {
    if (value === undefined) {
      delete process.env.EXPO_PUBLIC_BACKGROUND_PLAYBACK;
    } else {
      process.env.EXPO_PUBLIC_BACKGROUND_PLAYBACK = value;
    }
    let mod!: typeof import('./product-rule');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require('./product-rule');
    });
    return mod;
  }

  const fakeVideo = { videoId: 'abc' } as Parameters<
    ReturnType<typeof loadWith>['isPipAllowed']
  >[0];

  it('defaults to off when env is unset', () => {
    const mod = loadWith(undefined);
    expect(mod.getBackgroundCapability()).toBe('off');
    expect(mod.isPipAllowed(fakeVideo)).toBe(false);
    expect(mod.isAudioBackgroundAllowed(fakeVideo)).toBe(false);
  });

  it('treats unknown values as off', () => {
    const mod = loadWith('maybe');
    expect(mod.getBackgroundCapability()).toBe('off');
    expect(mod.isPipAllowed(fakeVideo)).toBe(false);
  });

  it('enables pip but not audio when set to pip', () => {
    const mod = loadWith('pip');
    expect(mod.getBackgroundCapability()).toBe('pip');
    expect(mod.isPipAllowed(fakeVideo)).toBe(true);
    expect(mod.isAudioBackgroundAllowed(fakeVideo)).toBe(false);
  });

  it('enables both pip and audio when set to full', () => {
    const mod = loadWith('full');
    expect(mod.getBackgroundCapability()).toBe('full');
    expect(mod.isPipAllowed(fakeVideo)).toBe(true);
    expect(mod.isAudioBackgroundAllowed(fakeVideo)).toBe(true);
  });

  it('always returns false when video is null regardless of capability', () => {
    const mod = loadWith('full');
    expect(mod.isPipAllowed(null)).toBe(false);
    expect(mod.isAudioBackgroundAllowed(null)).toBe(false);
  });

  it('is case-insensitive on env value', () => {
    const mod = loadWith('FULL');
    expect(mod.getBackgroundCapability()).toBe('full');
  });
});
