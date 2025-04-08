import {Redis} from '@upstash/redis';
import {getCachedData, setCachedData} from '@/services/redis';
import {PhotoFlickr} from '@/services/flickr/flickr.types';
import {sanitizeKey} from '@/lib/sanitizer';
import {commonAfterEach, commonBeforeEach} from '@/__tests__/utils/testUtils';

// Mock the dependencies
jest.mock('@upstash/redis');
jest.mock('@/lib/sanitizer');

describe('Redis Service', () => {
    // Mock data
    const mockKey = 'test-key';
    const mockSanitizedKey = 'test_key';
    const mockPhotoFlickr: PhotoFlickr[] = [
        {
            id: 123,
            title: 'Test Photo',
            description: {_content: 'Test Description'},
            datetaken: '2023-01-01 12:00:00',
            dateupload: '1672531200',
            tags: 'test',
            views: '100',
            url_s: 'http://example.com/small.jpg',
            url_m: 'http://example.com/medium.jpg',
            url_n: 'http://example.com/normal.jpg',
            url_l: 'http://example.com/large.jpg',
            url_o: 'http://example.com/original.jpg',
            url_t: 'http://example.com/thumbnail.jpg',
            url_z: 'http://example.com/zoom.jpg',
            url_c: 'http://example.com/crop.jpg',
            width_s: '240',
            width_m: '500',
            width_n: '320',
            width_l: '1024',
            width_o: '2048',
            width_t: '100',
            width_z: '640',
            width_c: '800',
            height_s: '180',
            height_m: '375',
            height_n: '240',
            height_l: '768',
            height_o: '1536',
            height_t: '75',
            height_z: '480',
            height_c: '600',
        },
    ];

    const mockRedisGet = jest.fn();
    const mockRedisSet = jest.fn();
    const mockRedis = {
        get: mockRedisGet,
        set: mockRedisSet,
    };

    beforeEach(() => {
        commonBeforeEach();

        // Reset all mocks
        jest.resetAllMocks();

        // Mock Redis.fromEnv to return our mock Redis client
        (Redis.fromEnv as jest.Mock).mockReturnValue(mockRedis);

        // Mock sanitizeKey to return a predictable value
        (sanitizeKey as jest.Mock).mockReturnValue(mockSanitizedKey);
    });

    afterEach(() => {
        commonAfterEach();
    });

    describe('getCachedData', () => {
        it('should return cached data when available', async () => {
            // Mock Redis.get to return data
            mockRedisGet.mockResolvedValue(mockPhotoFlickr);

            // Call the function
            const result = await getCachedData(mockKey);

            // Check that Redis.fromEnv was called
            expect(Redis.fromEnv).toHaveBeenCalled();

            // Check that sanitizeKey was called with the correct key
            expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

            // Check that Redis.get was called with the correct key
            expect(mockRedisGet).toHaveBeenCalledWith(mockKey);

            expect(result).toEqual(mockPhotoFlickr);
        });

        it('should return null when cache is empty', async () => {
            // Mock Redis.get to return null
            mockRedisGet.mockResolvedValue(null);

            // Call the function
            const result = await getCachedData(mockKey);

            // Check that Redis.fromEnv was called
            expect(Redis.fromEnv).toHaveBeenCalled();

            // Check that sanitizeKey was called with the correct key
            expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

            // Check that Redis.get was called with the correct key
            expect(mockRedisGet).toHaveBeenCalledWith(mockKey);

            expect(result).toBeNull();
        });

        it('should handle errors from Redis', async () => {
            // Mock Redis.get to throw an error
            mockRedisGet.mockRejectedValue(new Error('Redis error'));

            // Call the function and expect it to throw
            await expect(getCachedData(mockKey)).rejects.toThrow('Redis error');

            // Check that Redis.fromEnv was called
            expect(Redis.fromEnv).toHaveBeenCalled();

            // Check that sanitizeKey was called with the correct key
            expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

            // Check that Redis.get was called with the correct key
            expect(mockRedisGet).toHaveBeenCalledWith(mockKey);
        });
    });

    describe('setCachedData', () => {
        it('should set data in Redis with the correct expiry', async () => {
            // Mock Redis.set to return OK
            mockRedisSet.mockResolvedValue('OK');

            // Call the function
            await setCachedData(mockKey, mockPhotoFlickr, 3600);

            // Check that Redis.fromEnv was called
            expect(Redis.fromEnv).toHaveBeenCalled();

            // Check that sanitizeKey was called with the correct key
            expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

            // Check that Redis.set was called with the correct parameters
            expect(mockRedisSet).toHaveBeenCalledWith(
                mockKey,
                JSON.stringify(mockPhotoFlickr),
                {ex: 3600}
            );
        });

        it('should handle errors from Redis', async () => {
            // Mock Redis.set to throw an error
            mockRedisSet.mockRejectedValue(new Error('Redis error'));

            // Call the function and expect it to throw
            await expect(setCachedData(mockKey, mockPhotoFlickr, 3600)).rejects.toThrow('Redis error');

            // Check that Redis.fromEnv was called
            expect(Redis.fromEnv).toHaveBeenCalled();

            // Check that sanitizeKey was called with the correct key
            expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

            // Check that Redis.set was called with the correct parameters
            expect(mockRedisSet).toHaveBeenCalledWith(
                mockKey,
                JSON.stringify(mockPhotoFlickr),
                {ex: 3600}
            );
        });
    });
});
