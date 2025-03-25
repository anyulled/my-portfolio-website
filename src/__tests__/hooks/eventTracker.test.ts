import {renderHook} from '@testing-library/react';
import useAnalyticsEventTracker from '@/hooks/eventTracker';
import * as gtag from '@/lib/gtag';

// Mock the gtag module
jest.mock('@/lib/gtag', () => ({
    event: jest.fn(),
}));

describe('useAnalyticsEventTracker', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a function', () => {
        const {result} = renderHook(() => useAnalyticsEventTracker('test-category'));
        expect(typeof result.current).toBe('function');
    });

    it('should call gtag.event with the correct parameters when the returned function is called', () => {
        const {result} = renderHook(() => useAnalyticsEventTracker('test-category'));

        // Call the returned function with test parameters
        result.current('test-action', 'test-label');

        // Check if gtag.event was called with the correct parameters
        expect(gtag.event).toHaveBeenCalledTimes(1);
        expect(gtag.event).toHaveBeenCalledWith({
            action: 'test-action',
            category: 'test-category',
            label: 'test-label',
            value: undefined,
        });
    });

    it('should pass the value parameter to gtag.event when provided', () => {
        const {result} = renderHook(() => useAnalyticsEventTracker('test-category'));

        // Call the returned function with test parameters including value
        result.current('test-action', 'test-label', 42);

        // Check if gtag.event was called with the correct parameters including value
        expect(gtag.event).toHaveBeenCalledTimes(1);
        expect(gtag.event).toHaveBeenCalledWith({
            action: 'test-action',
            category: 'test-category',
            label: 'test-label',
            value: 42,
        });
    });
});