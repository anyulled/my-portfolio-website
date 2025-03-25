import {sendEMail} from '@/services/mailer';
import nodemailer from 'nodemailer';
// Import test utilities
import {commonAfterEach, commonBeforeEach} from '@/__tests__/utils/testUtils';

// Mock nodemailer
jest.mock('nodemailer', () => {
    // Create a mock for sendMail that can be configured in each test
    const mockSendMail = jest.fn();

    // Create a mock transporter object with the sendMail mock
    const mockTransporter = {
        sendMail: mockSendMail,
    };

    // Create a mock for createTransport that returns the mock transporter
    const mockCreateTransport = jest.fn().mockImplementation(() => {
        return mockTransporter;
    });

    return {
        createTransport: mockCreateTransport,
    };
});

// Mock environment variables
const originalEnv = process.env;

describe('Mailer Service', () => {
    beforeEach(() => {
        commonBeforeEach();

        // Mock environment variables
        process.env = {
            ...originalEnv,
            EMAIL_USER: 'test@example.com',
            EMAIL_PASS: 'password123',
        };
    });

    afterEach(() => {
        commonAfterEach();

        // Restore environment variables
        process.env = originalEnv;
    });

    describe('sendEMail', () => {
        it('should send an email with the correct parameters', async () => {
            // Get the mock transporter
            const mockTransporter = nodemailer.createTransport();

            // Mock successful email sending
            mockTransporter.sendMail.mockResolvedValue({messageId: 'test-id'});

            const result = await sendEMail(
                'Test message',
                'sender@example.com',
                'Test User'
            );

            // Since we're testing a module that uses nodemailer at the top level,
            // we can't directly test the createTransport call.
            // Instead, we'll just verify that sendMail was called with the correct parameters.

            // Check that sendMail was called with the correct parameters
            expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from: 'test@example.com',
                to: 'test@example.com',
                cc: 'sender@example.com',
                subject: 'Boudoir Barcelona - New Message from Test User',
                text: 'Test message',
            });

            // Check the result
            expect(result).toEqual({messageId: 'test-id'});
        });

        it('should return null when email sending fails', async () => {
            // Get the mock transporter
            const mockTransporter = nodemailer.createTransport();

            // Mock failed email sending
            mockTransporter.sendMail.mockRejectedValue(new Error('Failed to send email'));

            const result = await sendEMail(
                'Test message',
                'sender@example.com',
                'Test User'
            );

            // Check that sendMail was called
            expect(mockTransporter.sendMail).toHaveBeenCalled();

            // Check that the error was logged
            expect(console.error).toHaveBeenCalled();

            // Check the result
            expect(result).toBeNull();
        });
    });
});
