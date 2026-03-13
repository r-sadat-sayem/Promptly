type LogLevel = 'info' | 'warn' | 'error';

export function logOptimizationEvent(
  event: string,
  details: Record<string, unknown>,
  level: LogLevel = 'info'
) {
  const payload = {
    scope: 'optimization',
    event,
    level,
    timestamp: new Date().toISOString(),
    ...details,
  };

  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}
