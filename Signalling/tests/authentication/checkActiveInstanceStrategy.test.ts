// Copyright Epic Games, Inc. All Rights Reserved.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { createCheckActiveInstanceStrategy, AuthConfig } from '../../src/authentication/strategies/checkActiveInstanceStrategy';
import { findUserByUsername } from '../../src/authentication/db';

// Mock dependencies
vi.mock('axios');
vi.mock('../../src/authentication/db');
vi.mock('../../src/Logger', () => ({
    Logger: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

// Create typed mocks
const mockedAxios = {
    post: vi.fn(),
    isAxiosError: vi.fn()
};

// Assign mocks to the actual axios functions
(axios.post as any) = mockedAxios.post;
(axios.isAxiosError as any) = mockedAxios.isAxiosError;

const mockedFindUserByUsername = vi.mocked(findUserByUsername);

// Helper function to simulate strategy authentication
async function authenticateStrategy(strategy: any, request: any): Promise<any> {
    return new Promise((resolve) => {
        const mockDone = (error: any, user?: any, info?: any) => {
            resolve({ error, user, info });
        };

        // Call the strategy's verify callback directly
        strategy._verify(request, mockDone);
    });
}

describe('checkActiveInstanceStrategy', () => {
    let mockRequest: any;
    let authConfig: AuthConfig;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock request object
        mockRequest = {
            get: vi.fn(),
            query: {}
        };

        // Default auth config
        authConfig = {
            api_domain: 'api.example.com',
            license_id: 'test-license-id',
            system_user_name: 'system-user',
            payload: { key: 'value' }
        };

        // Setup axios mocks
        mockedAxios.isAxiosError.mockReturnValue(false);
        mockedAxios.post.mockClear();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('Token Extraction', () => {
        it('should extract token from Authorization header', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);
            const token = 'valid-bearer-token';
            
            mockRequest.get.mockReturnValue(`Bearer ${token}`);
            
            // Mock successful API response
            mockedAxios.post.mockResolvedValue({
                status: 200,
                data: {}
            });
            
            // Mock user found
            const mockUser = { id: '1', username: 'system-user' };
            mockedFindUserByUsername.mockResolvedValue(mockUser);

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(mockRequest.get).toHaveBeenCalledWith('Authorization');
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.example.com/checkActiveInstance',
                { key: 'value', licenseId: 'test-license-id' },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                }
            );
            expect(result.error).toBeNull();
            expect(result.user).toEqual(mockUser);
        });

        it('should fallback to query parameter for token', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);
            const token = 'query-token';
            
            mockRequest.get.mockReturnValue(null);
            mockRequest.query = { token };
            
            // Mock successful API response
            mockedAxios.post.mockResolvedValue({
                status: 200,
                data: {}
            });
            
            // Mock user found
            const mockUser = { id: '1', username: 'system-user' };
            mockedFindUserByUsername.mockResolvedValue(mockUser);

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.example.com/checkActiveInstance',
                { key: 'value', licenseId: 'test-license-id' },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                }
            );
            expect(result.error).toBeNull();
            expect(result.user).toEqual(mockUser);
        });

        it('should handle Authorization header without Bearer prefix', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);
            
            mockRequest.get.mockReturnValue('InvalidAuthHeader');
            mockRequest.query = {};

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(result).toEqual({ error: false, user: false, info: undefined });
        });

        it('should fail when no token is provided', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);
            
            mockRequest.get.mockReturnValue(null);
            mockRequest.query = {};

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(result).toEqual({ error: false, user: false, info: undefined });
        });
    });

    describe('Configuration Validation', () => {
        it('should fail when api_domain is not configured', async () => {
            const invalidConfig = { ...authConfig, api_domain: '' };
            const strategy = createCheckActiveInstanceStrategy(invalidConfig);
            
            mockRequest.get.mockReturnValue('Bearer valid-token');

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(result).toEqual({ error: 'No api_domain configured', user: false, info: undefined });
        });

        it('should handle missing license_id gracefully', async () => {
            const { license_id, ...configWithoutLicense } = authConfig;
            const strategy = createCheckActiveInstanceStrategy(configWithoutLicense as AuthConfig);
            
            mockRequest.get.mockReturnValue('Bearer valid-token');
            
            // Mock successful API response
            mockedAxios.post.mockResolvedValue({
                status: 200,
                data: {}
            });
            
            // Mock user found
            const mockUser = { id: '1', username: 'system-user' };
            mockedFindUserByUsername.mockResolvedValue(mockUser);

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.example.com/checkActiveInstance',
                { key: 'value' },
                expect.objectContaining({
                    headers: {
                        Authorization: 'Bearer valid-token',
                        'Content-Type': 'application/json'
                    }
                })
            );
            expect(result.error).toBeNull();
            expect(result.user).toEqual(mockUser);
        });

        it('should handle undefined payload', async () => {
            const { payload, ...configWithoutPayload } = authConfig;
            const strategy = createCheckActiveInstanceStrategy(configWithoutPayload as AuthConfig);
            
            mockRequest.get.mockReturnValue('Bearer valid-token');
            
            // Mock successful API response
            mockedAxios.post.mockResolvedValue({
                status: 200,
                data: {}
            });
            
            // Mock user found
            const mockUser = { id: '1', username: 'system-user' };
            mockedFindUserByUsername.mockResolvedValue(mockUser);

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.example.com/checkActiveInstance',
                { licenseId: 'test-license-id' },
                expect.any(Object)
            );
            expect(result.error).toBeNull();
            expect(result.user).toEqual(mockUser);
        });
    });

    describe('Successful Authentication', () => {
        beforeEach(() => {
            mockRequest.get.mockReturnValue('Bearer valid-token');
        });

        it('should authenticate successfully with valid token and user', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);
            
            // Mock successful API response
            mockedAxios.post.mockResolvedValue({
                status: 200,
                data: {}
            });
            
            // Mock user found
            const mockUser = { id: '1', username: 'system-user' };
            mockedFindUserByUsername.mockResolvedValue(mockUser);

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(mockedFindUserByUsername).toHaveBeenCalledWith('system-user');
            expect(result).toEqual({ error: null, user: mockUser, info: undefined });
        });

        it('should fail when API returns 200 but user is not found', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);
            
            // Mock successful API response
            mockedAxios.post.mockResolvedValue({
                status: 200,
                data: {}
            });
            
            // Mock user not found
            mockedFindUserByUsername.mockResolvedValue(null);

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(result).toEqual({ error: false, user: false, info: undefined });
        });
    });

    describe('API Response Handling', () => {
        beforeEach(() => {
            mockRequest.get.mockReturnValue('Bearer valid-token');
        });

        it('should handle non-200 status codes', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);
            
            // Mock non-200 API response
            mockedAxios.post.mockResolvedValue({
                status: 401,
                data: { error: 'Unauthorized' }
            });

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(result).toEqual({ error: null, user: false, info: undefined });
        });

        it('should handle 403 status code', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);
            
            // Mock 403 API response
            mockedAxios.post.mockResolvedValue({
                status: 403,
                data: { error: 'Forbidden' }
            });

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(result).toEqual({ error: null, user: false, info: undefined });
        });

        it('should handle 500 status code', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);
            
            // Mock 500 API response
            mockedAxios.post.mockResolvedValue({
                status: 500,
                data: { error: 'Internal Server Error' }
            });

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(result).toEqual({ error: null, user: false, info: undefined });
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            mockRequest.get.mockReturnValue('Bearer valid-token');
        });

        it('should handle axios response errors', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);
            
            const axiosError = {
                response: {
                    status: 401,
                    statusText: 'Unauthorized'
                },
                message: 'Request failed with status code 401'
            };
            
            mockedAxios.post.mockRejectedValue(axiosError);
            mockedAxios.isAxiosError.mockReturnValue(true);

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(result).toEqual({ error: null, user: false, info: undefined });
        });

        it('should handle axios request errors', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);
            
            const axiosError = {
                request: {},
                message: 'Network Error'
            };
            
            mockedAxios.post.mockRejectedValue(axiosError);
            mockedAxios.isAxiosError.mockReturnValue(true);

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(result).toEqual({ error: null, user: false, info: undefined });
        });

        it('should handle axios setup errors', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);
            
            const axiosError = {
                message: 'Request setup error'
            };
            
            mockedAxios.post.mockRejectedValue(axiosError);
            mockedAxios.isAxiosError.mockReturnValue(true);

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(result).toEqual({ error: null, user: false, info: undefined });
        });

        it('should handle non-axios errors', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);
            
            const genericError = new Error('Generic error');
            
            mockedAxios.post.mockRejectedValue(genericError);
            mockedAxios.isAxiosError.mockReturnValue(false);

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(result).toEqual({ error: null, user: false, info: undefined });
        });

        it('should handle timeout errors', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);
            
            const timeoutError = {
                code: 'ECONNABORTED',
                message: 'timeout of 5000ms exceeded'
            };
            
            mockedAxios.post.mockRejectedValue(timeoutError);
            mockedAxios.isAxiosError.mockReturnValue(true);

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(result).toEqual({ error: null, user: false, info: undefined });
        });

        it('should handle database errors when finding user', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);
            
            // Mock successful API response
            mockedAxios.post.mockResolvedValue({
                status: 200,
                data: {}
            });
            
            // Mock database error
            const dbError = new Error('Database connection failed');
            mockedFindUserByUsername.mockRejectedValue(dbError);

            // The database error should be caught and result in authentication failure
            const result = await authenticateStrategy(strategy, mockRequest);
            
            expect(result).toEqual({ error: null, user: false, info: undefined });
        });
    });

    describe('Request Configuration', () => {
        beforeEach(() => {
            mockRequest.get.mockReturnValue('Bearer test-token');
            mockedAxios.post.mockResolvedValue({
                status: 200,
                data: {}
            });
            const mockUser = { id: '1', username: 'system-user' };
            mockedFindUserByUsername.mockResolvedValue(mockUser);
        });

        it('should set correct request headers', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);

            await authenticateStrategy(strategy, mockRequest);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.example.com/checkActiveInstance',
                expect.any(Object),
                {
                    headers: {
                        Authorization: 'Bearer test-token',
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                }
            );
        });

        it('should construct correct API URL', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);

            await authenticateStrategy(strategy, mockRequest);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.example.com/checkActiveInstance',
                expect.any(Object),
                expect.any(Object)
            );
        });

        it('should include license_id in payload when provided', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);

            await authenticateStrategy(strategy, mockRequest);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                { key: 'value', licenseId: 'test-license-id' },
                expect.any(Object)
            );
        });

        it('should set 5 second timeout', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);

            await authenticateStrategy(strategy, mockRequest);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                expect.objectContaining({
                    timeout: 5000
                })
            );
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty Bearer token', async () => {
            const strategy = createCheckActiveInstanceStrategy(authConfig);
            
            mockRequest.get.mockReturnValue('Bearer ');
            mockRequest.query = {};

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(result).toEqual({ error: false, user: false, info: undefined });
        });

        it('should handle empty string api_domain', async () => {
            const invalidConfig = { ...authConfig, api_domain: '' };
            const strategy = createCheckActiveInstanceStrategy(invalidConfig);
            
            mockRequest.get.mockReturnValue('Bearer valid-token');

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(result).toEqual({ error: 'No api_domain configured', user: false, info: undefined });
        });

        it('should handle complex payload objects', async () => {
            const complexConfig = {
                ...authConfig,
                payload: {
                    nested: { key: 'value' },
                    array: [1, 2, 3],
                    string: 'test',
                    number: 42,
                    boolean: true
                } as any
            };
            
            const strategy = createCheckActiveInstanceStrategy(complexConfig);
            
            mockRequest.get.mockReturnValue('Bearer valid-token');
            mockedAxios.post.mockResolvedValue({ status: 200 });
            const mockUser = { id: '1', username: 'system-user' };
            mockedFindUserByUsername.mockResolvedValue(mockUser);

            const result = await authenticateStrategy(strategy, mockRequest);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                {
                    nested: { key: 'value' },
                    array: [1, 2, 3],
                    string: 'test',
                    number: 42,
                    boolean: true,
                    licenseId: 'test-license-id'
                },
                expect.any(Object)
            );
            expect(result.error).toBeNull();
            expect(result.user).toEqual(mockUser);
        });

        it('should not mutate original payload object', async () => {
            const originalPayload = { key: 'value' };
            const configWithPayload = { ...authConfig, payload: originalPayload };
            
            const strategy = createCheckActiveInstanceStrategy(configWithPayload);
            
            mockRequest.get.mockReturnValue('Bearer valid-token');
            mockedAxios.post.mockResolvedValue({ status: 200 });
            const mockUser = { id: '1', username: 'system-user' };
            mockedFindUserByUsername.mockResolvedValue(mockUser);

            await authenticateStrategy(strategy, mockRequest);

            // Original payload should not have licenseId added
            expect(originalPayload).toEqual({ key: 'value' });
            expect('licenseId' in originalPayload).toBe(false);
        });
    });
});
