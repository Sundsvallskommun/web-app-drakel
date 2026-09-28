import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useObjectUrl } from './use-object-url';

// jsdom has no object URLs.
const revokeObjectURL = vi.fn();

describe('useObjectUrl', () => {
  beforeEach(() => {
    revokeObjectURL.mockClear();
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('revokes the URL it held when it is handed a new one', () => {
    const { result } = renderHook(() => useObjectUrl());

    act(() => {
      result.current.setObjectUrl('blob:first');
    });
    act(() => {
      result.current.setObjectUrl('blob:second');
    });

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:first');
    expect(revokeObjectURL).not.toHaveBeenCalledWith('blob:second');
    expect(result.current.objectUrl).toBe('blob:second');
  });

  it('revokes the last URL on unmount', () => {
    const { result, unmount } = renderHook(() => useObjectUrl());
    act(() => {
      result.current.setObjectUrl('blob:last');
    });

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:last');
  });

  it('revokes on request and then holds nothing', () => {
    const { result } = renderHook(() => useObjectUrl());
    act(() => {
      result.current.setObjectUrl('blob:shown');
    });

    act(() => {
      result.current.revokeObjectUrl();
    });

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:shown');
    expect(result.current.objectUrl).toBe('');
  });
});
