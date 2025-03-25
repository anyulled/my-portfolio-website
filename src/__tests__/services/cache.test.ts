import {getCachedData, setCachedData} from '@/services/cache';
import {list, put} from '@vercel/blob';
import {PhotoFlickr} from '@/services/flickr/flickr.types';

// Mock the @vercel/blob module
jest.mock('@vercel/blob', () => ({
    list: jest.fn(),
    put: jest.fn(),
}));

// Mock the sanitizeKey function
jest.mock('@/lib/sanitizer', () => ({
    sanitizeKey: jest.fn((key) => `sanitized-${key}`),
}));

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

describe('Cache Service', () => {
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

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

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