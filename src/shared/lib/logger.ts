type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const REDACTED_KEYS = new Set([
  'accesstoken',
  'refreshtoken',
  'access_token',
  'refresh_token',
  'email',
  'authorization',
]);

export function redact<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redact(item)) as T;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    } as T;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const sanitizedEntries = Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      return [key, '[REDACTED]'];
    }

    return [key, redact(entry)];
  });

  return Object.fromEntries(sanitizedEntries) as T;
}

function write(level: LogLevel, ...args: unknown[]) {
  const sanitizedArgs = args.map((arg) => redact(arg));

  if (__DEV__) {
    switch (level) {
      case 'debug':
        console.debug(...sanitizedArgs);
        return;
      case 'info':
        console.info(...sanitizedArgs);
        return;
      case 'warn':
        console.warn(...sanitizedArgs);
        return;
      case 'error':
        console.error(...sanitizedArgs);
        return;
      default:
        return;
    }
  }

  // In production, forward warn/error to Sentry as breadcrumbs for context trail.
  if (level === 'warn' || level === 'error') {
    const { addBreadcrumb } = require('@sentry/react-native') as typeof import('@sentry/react-native');
    const sentryLevel = level === 'warn' ? 'warning' : 'error';
    addBreadcrumb({ message: String(sanitizedArgs[0]), level: sentryLevel, data: sanitizedArgs[1] as Record<string, unknown> });
  }
}

export function debug(...args: unknown[]) {
  write('debug', ...args);
}

export function info(...args: unknown[]) {
  write('info', ...args);
}

export function warn(...args: unknown[]) {
  write('warn', ...args);
}

export function error(...args: unknown[]) {
  write('error', ...args);
}
