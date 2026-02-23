/** @jest-environment node */
import { getPhotosFromStorage } from '@/services/storage/photos-cached';

// Unmock the module we are testing (it's mocked in jest.setup.js)
jest.unmock('@/services/storage/photos-cached');

// Mock getPhotosFromStorageUncached
jest.mock('@/services/storage/photos', () => ({
  getPhotosFromStorage: jest.fn().mockResolvedValue([]),
}));

const mockUnstableCache = jest.fn((fn, _keyParts, _options) => {
  return jest.fn((...args) => fn(...args));
});

jest.mock('next/cache', () => ({
  unstable_cache: (...args: any[]) => mockUnstableCache(...args),
}));

describe('getPhotosFromStorage (cached)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include prefix and limit in the cache key to prevent collisions', async () => {
    await getPhotosFromStorage('hero', 6);

    expect(mockUnstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      expect.arrayContaining([
        expect.stringContaining('photos-storage'),
        expect.stringContaining('hero'),
        expect.stringContaining('6'),
      ]),
      expect.any(Object)
    );

    await getPhotosFromStorage('', 12);

    expect(mockUnstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      expect.arrayContaining([
        expect.stringContaining('photos-storage'),
        expect.stringContaining('12'),
      ]),
      expect.any(Object)
    );
  });
});
