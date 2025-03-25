import {getCachedData, setCachedData} from '@/services/cache';
import {list, put} from '@vercel/blob';
// Import test utilities
import {
    commonAfterEach,
    commonBeforeEach,
    mockPhotoFlickr
} from '@/__tests__/utils/testUtils';

// Mock the @vercel/blob module
jest.mock('@vercel/blob', () => ({
    list: jest.fn(),
    put: jest.fn(),
}));

// Mock the sanitizeKey function
jest.mock('@/lib/sanitizer', () => ({
    sanitizeKey: jest.fn((key) => `sanitized-${key}`),
}));

describe('Cache Service', () => {
    beforeEach(() => {
        commonBeforeEach();
    });

    afterEach(() => {
        commonAfterEach();
    });

    describe('getCachedData', () => {
        it('should return cached data when blob exists', async () => {
            // Mock the list function to return a blob
            const mockBlob = {
                pathname: 'sanitized-test-key',
                downloadUrl: 'http://example.com/download',
            };
            (list as jest.Mock).mockResolvedValue({blobs: [mockBlob]});

            // Mock the fetch function
            global.fetch = jest.fn().mockResolvedValue({
                json: jest.fn().mockResolvedValue(mockPhotoFlickr),
            });

            const result = await getCachedData('test-key');

            expect(list).toHaveBeenCalled();
            expect(global.fetch).toHaveBeenCalledWith('http://example.com/download');
            expect(result).toEqual(mockPhotoFlickr);
        });

        it('should return null when blob does not exist', async () => {
            // Mock the list function to return no blobs
            (list as jest.Mock).mockResolvedValue({blobs: []});

            const result = await getCachedData('test-key');

            expect(list).toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it('should handle errors gracefully', async () => {
            // Mock the list function to throw an error
            (list as jest.Mock).mockRejectedValue(new Error('Test error'));

            try {
                await getCachedData('test-key');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toBe('Test error');
            }
        });
    });

    describe('setCachedData', () => {
        it('should call put with correct parameters', async () => {
            // Mock the put function
            (put as jest.Mock).mockResolvedValue({url: 'http://example.com/stored'});

            await setCachedData('test-key', mockPhotoFlickr, 3600);

            expect(put).toHaveBeenCalledWith(
                'sanitized-test-key',
                JSON.stringify(mockPhotoFlickr),
                {
                    contentType: 'application/json',
                    access: 'public',
                    cacheControlMaxAge: 3600,
                    addRandomSuffix: false,
                    multipart: false,
                }
            );
        });

        it('should handle errors gracefully', async () => {
            // Mock the put function to throw an error
            (put as jest.Mock).mockRejectedValue(new Error('Test error'));

            try {
                await setCachedData('test-key', mockPhotoFlickr, 3600);
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toBe('Test error');
            }
        });
    });
});
