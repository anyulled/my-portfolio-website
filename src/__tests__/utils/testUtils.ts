// Console mocking utilities
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

/**
 * Sets up console mocks to prevent noise in test output
 */
export const setupConsoleMocks = () => {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
};

/**
 * Restores original console methods
 */
export const restoreConsoleMocks = () => {
    console.log = originalConsoleLog;
    console.info = originalConsoleInfo;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
};

/**
 * Common beforeEach setup for tests
 */
export const commonBeforeEach = () => {
    jest.clearAllMocks();
    setupConsoleMocks();
};

/**
 * Common afterEach teardown for tests
 */
export const commonAfterEach = () => {
    restoreConsoleMocks();
};

// Common mock data
import {PhotoFlickr} from '@/services/flickr/flickr.types';

/**
 * Mock Flickr photo data for tests
 */
export const mockPhotoFlickr: PhotoFlickr[] = [
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

// Add tests for the utility functions to satisfy Jest's requirement
describe('Test Utilities', () => {
    describe('Console Mocking', () => {
        it('should mock console methods', () => {
            setupConsoleMocks();
            console.log('test');
            expect(console.log).toHaveBeenCalledWith('test');
            restoreConsoleMocks();
        });

        it('should restore console methods', () => {
            setupConsoleMocks();
            restoreConsoleMocks();
            expect(console.log).toBe(originalConsoleLog);
        });
    });

    describe('Common Test Setup', () => {

        it('should provide common afterEach functionality', () => {
            setupConsoleMocks();
            commonAfterEach();
            expect(console.log).toBe(originalConsoleLog);
        });
    });

    describe('Mock Data', () => {
        it('should provide mock Flickr photo data', () => {
            expect(mockPhotoFlickr).toHaveLength(1);
            expect(mockPhotoFlickr[0].id).toBe(123);
            expect(mockPhotoFlickr[0].title).toBe('Test Photo');
        });
    });
});
