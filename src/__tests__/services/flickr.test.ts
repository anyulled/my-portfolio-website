import {
  fetchTransport,
  getFlickrPhotos,
  processFlickrPhotos
} from '@/services/flickr/flickr';
import {PhotoFlickr} from '@/services/flickr/flickr.types';
// Import the mocked functions
import {getCachedData, setCachedData} from '@/services/redis';

// Mock the redis module
jest.mock('@/services/redis', () => {
    return {
        getCachedData: jest.fn(),
        setCachedData: jest.fn(),
    };
});

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
    captureException: jest.fn(),
}));

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

describe('Flickr Service', () => {
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

    // Mock Flickr API client
    const mockFlickr = jest.fn();

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Mock console methods to prevent noise in test output
        console.log = jest.fn();
        console.info = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        // Restore console methods
        console.log = originalConsoleLog;
        console.info = originalConsoleInfo;
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
    });

    describe('processFlickrPhotos', () => {
        it('should process Flickr photos correctly', () => {
            const result = processFlickrPhotos(mockPhotoFlickr);

            expect(result.success).toBe(true);
            expect(result.reason).toBeNull();
            expect(result.photos).toHaveLength(1);

            const processedPhoto = result.photos![0];
            expect(processedPhoto.id).toBe(123);
            expect(processedPhoto.title).toBe('Test Photo');
            expect(processedPhoto.description).toBe('Test Description');
            expect(processedPhoto.dateTaken).toBeInstanceOf(Date);
            expect(processedPhoto.dateUpload).toBeInstanceOf(Date);
            expect(processedPhoto.views).toBe(100);
            expect(processedPhoto.tags).toBe('test');
            expect(processedPhoto.urlSmall).toBe('http://example.com/small.jpg');
            expect(processedPhoto.urlMedium).toBe('http://example.com/medium.jpg');
            expect(processedPhoto.srcSet).toHaveLength(8); // 8 different sizes
        });
    });

    describe('getFlickrPhotos', () => {
        it('should fetch photos from Flickr API and cache them', async () => {
            // Mock the Flickr API response
            mockFlickr.mockResolvedValue({
                photos: {
                    photo: mockPhotoFlickr,
                },
            });

            // setCachedData is already imported at the top of the file

            const result = await getFlickrPhotos(mockFlickr, 'test', 5);

            // Check that the Flickr API was called with the correct parameters
            expect(mockFlickr).toHaveBeenCalledWith(
                'flickr.photos.search',
                expect.objectContaining({
                    tags: 'test',
                    user_id: '76279599@N00',
                })
            );

            // Check that the photos were cached
            expect(setCachedData).toHaveBeenCalledWith(
                'test',
                mockPhotoFlickr,
                expect.any(Number)
            );

            // Check the result
            expect(result.success).toBe(true);
            expect(result.photos).toHaveLength(1);
        });

        it('should return photos from cache when API fails', async () => {
            // Mock the Flickr API to fail
            mockFlickr.mockRejectedValue(new Error('API error'));

            // Mock the cache to return photos
            getCachedData.mockResolvedValue(mockPhotoFlickr);

            const result = await getFlickrPhotos(mockFlickr, 'test', 5);

            // Check that the Flickr API was called
            expect(mockFlickr).toHaveBeenCalled();

            // Check that the cache was checked
            expect(getCachedData).toHaveBeenCalledWith('test');

            // Check the result
            expect(result.success).toBe(true);
            expect(result.photos).toHaveLength(1);
        });

        it('should return error when both API and cache fail', async () => {
            // Mock the Flickr API to fail
            mockFlickr.mockRejectedValue(new Error('API error'));

            // Mock the cache to fail
            getCachedData.mockResolvedValue(null);

            const result = await getFlickrPhotos(mockFlickr, 'test', 5);

            // Check that the Flickr API was called
            expect(mockFlickr).toHaveBeenCalled();

            // Check that the cache was checked
            expect(getCachedData).toHaveBeenCalledWith('test');

            // Check the result
            expect(result.success).toBe(false);
            expect(result.photos).toBeNull();
            expect(result.reason).toBe('Failed to get photos from both Flickr API and cache');
        });

        it('should sort photos by date when orderByDate is true', async () => {
            // Create photos with different dates
            const photosWithDates = [
                {...mockPhotoFlickr[0], datetaken: '2023-01-01 12:00:00'},
                {
                    ...mockPhotoFlickr[0],
                    id: 456,
                    datetaken: '2023-02-01 12:00:00'
                },
                {
                    ...mockPhotoFlickr[0],
                    id: 789,
                    datetaken: '2023-03-01 12:00:00'
                },
            ];

            // Mock the Flickr API response
            mockFlickr.mockResolvedValue({
                photos: {
                    photo: photosWithDates,
                },
            });

            const result = await getFlickrPhotos(mockFlickr, 'test', 5, true, false);

            // Check the result is sorted by date (newest first)
            expect(result.success).toBe(true);
            expect(result.photos).toHaveLength(3);
            expect(result.photos![0].id).toBe(789); // Most recent
            expect(result.photos![1].id).toBe(456);
            expect(result.photos![2].id).toBe(123); // Oldest
        });

        it('should sort photos by views when orderByViews is true', async () => {
            // Create photos with different view counts
            const photosWithViews = [
                {...mockPhotoFlickr[0], id: 123, views: '100'},
                {...mockPhotoFlickr[0], id: 456, views: '200'},
                {...mockPhotoFlickr[0], id: 789, views: '300'},
            ];

            // Mock the Flickr API response
            mockFlickr.mockResolvedValue({
                photos: {
                    photo: photosWithViews,
                },
            });

            const result = await getFlickrPhotos(mockFlickr, 'test', 5, false, true);

            // Check the result is sorted by views (most views first)
            expect(result.success).toBe(true);
            expect(result.photos).toHaveLength(3);
            expect(result.photos![0].id).toBe(789); // Most views
            expect(result.photos![1].id).toBe(456);
            expect(result.photos![2].id).toBe(123); // Least views
        });

        it('should limit the number of photos returned', async () => {
            // Create multiple photos
            const multiplePhotos = [
                {...mockPhotoFlickr[0], id: 123},
                {...mockPhotoFlickr[0], id: 456},
                {...mockPhotoFlickr[0], id: 789},
                {...mockPhotoFlickr[0], id: 101},
                {...mockPhotoFlickr[0], id: 102},
            ];

            // Mock the Flickr API response
            mockFlickr.mockResolvedValue({
                photos: {
                    photo: multiplePhotos,
                },
            });

            const result = await getFlickrPhotos(mockFlickr, 'test', 3);

            // Check that only the requested number of photos is returned
            expect(result.success).toBe(true);
            expect(result.photos).toHaveLength(3);
        });

        it('should exclude photos with excluded tags', async () => {
            // Create photos with different tags
            const photosWithTags = [
                {...mockPhotoFlickr[0], id: 123, tags: 'test good'},
                {...mockPhotoFlickr[0], id: 456, tags: 'test bad'},
                {...mockPhotoFlickr[0], id: 789, tags: 'test exclude'},
            ];

            // Mock the Flickr API response
            mockFlickr.mockResolvedValue({
                photos: {
                    photo: photosWithTags,
                },
            });

            const result = await getFlickrPhotos(mockFlickr, 'test,-bad,-exclude', 5);

            // Check that photos with excluded tags are filtered out
            expect(result.success).toBe(true);
            expect(result.photos).toHaveLength(1);
            expect(result.photos![0].id).toBe(123);
        });
    });

    describe('fetchTransport', () => {
        it('should have the correct headers', () => {
            // FetchTransport has an init property that contains the headers
            expect(fetchTransport).toHaveProperty('init');
            expect(fetchTransport.init).toHaveProperty('headers');
            expect(fetchTransport.init.headers).toHaveProperty('next');
            expect(fetchTransport.init.headers.next).toBe('{ revalidate: 10 }');
        });
    });
});
