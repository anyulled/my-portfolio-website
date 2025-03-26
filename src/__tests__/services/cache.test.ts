import {getCachedData, setCachedData} from '@/services/cache';
import {PhotoFlickr} from '@/services/flickr/flickr.types';
import {sanitizeKey} from '@/lib/sanitizer';
import {commonAfterEach, commonBeforeEach} from '@/__tests__/utils/testUtils';
// Import the mocked functions after mocking
import {list, put} from '@vercel/blob';

// Mock the dependencies
jest.mock('@vercel/blob', () => ({
    list: jest.fn(),
    put: jest.fn()
}));
jest.mock('@/lib/sanitizer');

describe('Cache Service', () => {
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

    // Mock Vercel Blob response
    const mockBlob = {
        pathname: mockSanitizedKey,
        downloadUrl: 'https://example.com/download',
        contentType: 'application/json',
        contentLength: 1000,
        uploadedAt: new Date().toISOString(),
    };

    // Mock put response
    const mockPutResponse = {
        url: 'https://example.com/upload',
        pathname: mockSanitizedKey,
    };

    beforeEach(() => {
        commonBeforeEach();

        // Reset all mocks
        jest.resetAllMocks();

        // Mock sanitizeKey to return a predictable value
        (sanitizeKey as jest.Mock).mockReturnValue(mockSanitizedKey);

        // Mock global fetch
        global.fetch = jest.fn().mockImplementation(() =>
            Promise.resolve({
                json: () => Promise.resolve(mockPhotoFlickr),
            })
        );
    });

    afterEach(() => {
        commonAfterEach();
        jest.restoreAllMocks();
    });

    describe('getCachedData', () => {
        it('should return cached data when available', async () => {
            // Mock list to return a blob that matches our key
            (list as jest.Mock).mockResolvedValue({
                blobs: [mockBlob],
            });

            // Call the function
            const result = await getCachedData(mockKey);

            // Check that list was called
            expect(list).toHaveBeenCalled();

            // Check that sanitizeKey was called with the correct key
            expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

            // Check that fetch was called with the correct URL
            expect(global.fetch).toHaveBeenCalledWith(mockBlob.downloadUrl);

            // Check the result
            expect(result).toEqual(mockPhotoFlickr);
        });

        it('should return null when no matching blob is found', async () => {
            // Mock list to return no matching blobs
            (list as jest.Mock).mockResolvedValue({
                blobs: [
                    {
                        ...mockBlob,
                        pathname: 'different-key',
                    },
                ],
            });

            // Call the function
            const result = await getCachedData(mockKey);

            // Check that list was called
            expect(list).toHaveBeenCalled();

            // Check that sanitizeKey was called with the correct key
            expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

            // Check that fetch was not called
            expect(global.fetch).not.toHaveBeenCalled();

            // Check the result
            expect(result).toBeNull();
        });

        it('should return null when list returns empty array', async () => {
            // Mock list to return empty array
            (list as jest.Mock).mockResolvedValue({
                blobs: [],
            });

            // Call the function
            const result = await getCachedData(mockKey);

            // Check that list was called
            expect(list).toHaveBeenCalled();

            // Check that sanitizeKey was called with the correct key
            expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

            // Check that fetch was not called
            expect(global.fetch).not.toHaveBeenCalled();

            // Check the result
            expect(result).toBeNull();
        });

        it('should handle errors from list', async () => {
            // Mock list to throw an error
            (list as jest.Mock).mockRejectedValue(new Error('List error'));

            // Call the function and expect it to throw
            await expect(getCachedData(mockKey)).rejects.toThrow('List error');

            // Check that list was called
            expect(list).toHaveBeenCalled();

            // Check that sanitizeKey was called with the correct key
            expect(sanitizeKey).toHaveBeenCalledWith(mockKey);
        });

        it('should handle errors from fetch', async () => {
            // Mock list to return a blob that matches our key
            (list as jest.Mock).mockResolvedValue({
                blobs: [mockBlob],
            });

            // Mock fetch to throw an error
            global.fetch = jest.fn().mockRejectedValue(new Error('Fetch error'));

            // Call the function and expect it to throw
            await expect(getCachedData(mockKey)).rejects.toThrow('Fetch error');

            // Check that list was called
            expect(list).toHaveBeenCalled();

            // Check that sanitizeKey was called with the correct key
            expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

            // Check that fetch was called with the correct URL
            expect(global.fetch).toHaveBeenCalledWith(mockBlob.downloadUrl);
        });
    });

    describe('setCachedData', () => {
        it('should set data in Vercel Blob with the correct parameters', async () => {
            // Mock put to return a success response
            (put as jest.Mock).mockResolvedValue(mockPutResponse);

            // Call the function
            await setCachedData(mockKey, mockPhotoFlickr, 3600);

            // Check that sanitizeKey was called with the correct key
            expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

            // Check that put was called with the correct parameters
            expect(put).toHaveBeenCalledWith(
                mockSanitizedKey,
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

        it('should handle errors from put', async () => {
            // Mock put to throw an error
            (put as jest.Mock).mockRejectedValue(new Error('Put error'));

            // Call the function and expect it to throw
            await expect(setCachedData(mockKey, mockPhotoFlickr, 3600)).rejects.toThrow('Put error');

            // Check that sanitizeKey was called with the correct key
            expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

            // Check that put was called with the correct parameters
            expect(put).toHaveBeenCalledWith(
                mockSanitizedKey,
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
    });
});
