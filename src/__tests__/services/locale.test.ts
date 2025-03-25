import {getUserLocale, setUserLocale} from '@/services/locale';
import {cookies, headers} from 'next/headers';
import {defaultLocale} from '@/i18n/config';

// Mock next/headers
jest.mock('next/headers', () => ({
    cookies: jest.fn(),
    headers: jest.fn(),
}));

// Mock @/i18n/config
jest.mock('@/i18n/config', () => ({
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr'],
    Locale: {
        EN: 'en',
        ES: 'es',
        FR: 'fr',
    },
}));

describe('Locale Service', () => {
    // Mock cookies implementation
    const mockCookies = {
        get: jest.fn(),
        set: jest.fn(),
    };

    // Mock headers implementation
    const mockHeaders = {
        get: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mocks for each test
        (cookies as jest.Mock).mockReturnValue(mockCookies);
        (headers as jest.Mock).mockResolvedValue(mockHeaders);
    });

    describe('getUserLocale', () => {
        it('should return locale from cookies if available', async () => {
            // Mock cookie value
            mockCookies.get.mockReturnValue({value: 'fr'});

            const result = await getUserLocale();

            expect(cookies).toHaveBeenCalled();
            expect(mockCookies.get).toHaveBeenCalledWith('NEXT_LOCALE');
            expect(result).toBe('fr');
        });

        it('should return locale from headers if cookie not available', async () => {
            // Mock cookie not found
            mockCookies.get.mockReturnValue(undefined);

            // Mock header value
            mockHeaders.get.mockReturnValue('en-US,es;q=0.9');

            const result = await getUserLocale();

            expect(cookies).toHaveBeenCalled();
            expect(mockCookies.get).toHaveBeenCalledWith('NEXT_LOCALE');
            expect(headers).toHaveBeenCalled();
            expect(mockHeaders.get).toHaveBeenCalledWith('accept-language');
            expect(result).toBe('es');
        });

        it('should return default locale if neither cookie nor header is available', async () => {
            // Mock cookie not found
            mockCookies.get.mockReturnValue(undefined);

            // Mock header not found
            mockHeaders.get.mockReturnValue(undefined);

            const result = await getUserLocale();

            expect(cookies).toHaveBeenCalled();
            expect(mockCookies.get).toHaveBeenCalledWith('NEXT_LOCALE');
            expect(headers).toHaveBeenCalled();
            expect(mockHeaders.get).toHaveBeenCalledWith('accept-language');
            expect(result).toBe(defaultLocale);
        });
    });

    describe('setUserLocale', () => {
        it('should set locale in cookies', async () => {
            await setUserLocale('es');

            expect(cookies).toHaveBeenCalled();
            expect(mockCookies.set).toHaveBeenCalledWith('NEXT_LOCALE', 'es');
        });
    });
});