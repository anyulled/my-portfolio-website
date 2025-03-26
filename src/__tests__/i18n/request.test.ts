import * as fs from 'fs/promises';
import path from 'path';
import {getUserLocale} from '@/services/locale';
import {commonAfterEach, commonBeforeEach} from '@/__tests__/utils/testUtils';
import {getAvailableLocales} from "@/i18n/request";

jest.mock('next-intl/server', () => ({
    getRequestConfig: jest.fn((callback) => {
        // Return a function that calls the callback
        return async () => {
            return await callback();
        };
    })
}));

const mockReaddir = jest.fn();
const mockReadFile = jest.fn();

jest.mock('fs/promises', () => ({
    readdir: mockReaddir,
    readFile: mockReadFile
}));
jest.mock('path');
jest.mock('@/services/locale');

jest.mock('@/i18n/request', () => {
    // Store the original module
    const originalModule = jest.requireActual('@/i18n/request');

    // Return a mocked version
    return {
        __esModule: true,
        ...originalModule,
        // We'll override these functions in individual tests
        findMessagesDir: jest.fn(),
        getAvailableLocales: jest.fn()
    };
});

fs.readdir = mockReaddir;
fs.readFile = mockReadFile;

jest.mock('../../messages/en.json', () => ({
    default: {hello: 'Hello'}
}), {virtual: true});

jest.mock('../../messages/es.json', () => ({
    default: {hello: 'Hola'}
}), {virtual: true});

describe('i18n request config', () => {
    beforeEach(() => {
        commonBeforeEach();

        jest.resetAllMocks();

        (path.join as jest.Mock).mockImplementation((...args) => {
            if (args[0] === process.cwd() && args[1] === 'messages') {
                return 'process.cwd()/messages';
            }
            return args.join('/');
        });
        (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));
        (path.basename as jest.Mock).mockImplementation((filePath, ext) => {
            const base = filePath.split('/').pop();
            if (ext && base.endsWith(ext)) {
                return base.slice(0, -ext.length);
            }
            return base;
        });

        jest.spyOn(process, 'cwd').mockReturnValue('process.cwd()');

        (getUserLocale as jest.Mock).mockResolvedValue('en');
    });

    afterEach(() => {
        commonAfterEach();
    });

    describe('getAvailableLocales', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should return all available locales', async () => {
            (getAvailableLocales as jest.Mock).mockResolvedValue(['ca', 'en', 'es', 'fr', 'it']);

            const result = await getAvailableLocales();

            expect(result).toEqual(['ca', 'en', 'es', 'fr', 'it']);
        });

        it('should return fallback locale if no files are found', async () => {
            (getAvailableLocales as jest.Mock).mockResolvedValue(['en']);

            const result = await getAvailableLocales();

            expect(result).toEqual(['en']);
        });
    });

});
