import { joinUrlSegments } from '@utils/url-segments';
import { describe, expect, it } from 'vitest';

describe('joinUrlSegments', () => {
  it('joins a base and segments with single slashes', () => {
    expect(joinUrlSegments('https://cm.example.se/', '2281', 'errands', 'errand-1')).toBe('https://cm.example.se/2281/errands/errand-1');
    expect(joinUrlSegments('https://cm.example.se///', 'errands')).toBe('https://cm.example.se/errands');
  });

  it('keeps a value from drakel’s own URL to one path segment of the upstream URL', () => {
    expect(joinUrlSegments('https://cm.example.se', 'errands', '../../admin?x=1#y')).toBe(
      'https://cm.example.se/errands/..%2F..%2Fadmin%3Fx%3D1%23y',
    );
    expect(joinUrlSegments('https://cm.example.se', 'user-settings', 'joe doe')).toBe('https://cm.example.se/user-settings/joe%20doe');
  });

  it('refuses an empty or a dot segment, which would address another upstream resource', () => {
    expect(() => joinUrlSegments('https://cm.example.se', 'errands', '')).toThrow(expect.objectContaining({ status: 400 }) as Error);
    expect(() => joinUrlSegments('https://cm.example.se', 'errands', '.')).toThrow(expect.objectContaining({ status: 400 }) as Error);
    expect(() => joinUrlSegments('https://cm.example.se', 'errands', '..', 'attachments')).toThrow(expect.objectContaining({ status: 400 }) as Error);
  });

  it('trims a base of many slashes in linear time', () => {
    const base = `https://cm.example.se${'/'.repeat(100_000)}`;
    const started = performance.now();

    expect(joinUrlSegments(base, 'errands')).toBe('https://cm.example.se/errands');
    expect(performance.now() - started).toBeLessThan(1000);
  });
});
