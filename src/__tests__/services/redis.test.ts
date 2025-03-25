import {getCachedData, setCachedData} from '@/services/redis';
import {Redis} from '@upstash/redis';
import {PhotoFlickr} from '@/services/flickr/flickr.types';

// Mock the @upstash/redis module
jest.mock('@upstash/redis', () => ({
    Redis: {
        fromEnv: jest.fn(),
    },
}));

// Mock the sanitizeKey function
jest.mock('@/lib/sanitizer', () => ({
    sanitizeKey: jest.fn((key) => `sanitized-${key}`),
}));

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

describe('Redis Service', () => {
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

    // Mock Redis client
    const mockRedisClient = {
        get: jest.fn(),
        set: jest.fn(),
    };

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Mock Redis.fromEnv to return our mock client
        (Redis.fromEnv as jest.Mock).mockReturnValue(mockRedisClient);

        // Mock console methods to prevent noise in test output
        console.log = jest.fn();
        console.warn = jest.fn();
    });

    afterEach(() => {
        // Restore console methods
        console.log = originalConsoleLog;
        console.warn = originalConsoleWarn;
    });

    describe('getCachedData', () => {
        it('should return cached data when available', async () => {
            // Mock Redis get to return data
            mockRedisClient.get.mockResolvedValue(mockPhotoFlickr);

            const result = await getCachedData('test-key');

            // Check that Redis client was created
            expect(Redis.fromEnv).toHaveBeenCalled();

            // Check that get was called with the correct key
            expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');

            // Check the result
            expect(result).toEqual(mockPhotoFlickr);
        });

        it('should return null when cache misses', async () => {
            // Mock Redis get to return null (cache miss)
            mockRedisClient.get.mockResolvedValue(null);

            const result = await getCachedData('test-key');

            // Check that Redis client was created
            expect(Redis.fromEnv).toHaveBeenCalled();

            // Check that get was called with the correct key
            expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');

            // Check the result
            expect(result).toBeNull();
        });

        it('should handle errors gracefully', async () => {
            // Mock Redis get to throw an error
            mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

            try {
                await getCachedData('test-key');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toBe('Redis error');
            }
        });
    });

    describe('setCachedData', () => {
        it('should set data in Redis with the correct parameters', async () => {
            // Mock Redis set to return success
            mockRedisClient.set.mockResolvedValue('OK');

            await setCachedData('test-key', mockPhotoFlickr, 3600);

            // Check that Redis client was created
            expect(Redis.fromEnv).toHaveBeenCalled();

            // Check that set was called with the correct parameters
            expect(mockRedisClient.set).toHaveBeenCalledWith(
                'test-key',
                JSON.stringify(mockPhotoFlickr),
                {ex: 3600}
            );
        });

        it('should handle errors gracefully', async () => {
            // Mock Redis set to throw an error
            mockRedisClient.set.mockRejectedValue(new Error('Redis error'));

            try {
                await setCachedData('test-key', mockPhotoFlickr, 3600);
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toBe('Redis error');
            }
        });
    });
});