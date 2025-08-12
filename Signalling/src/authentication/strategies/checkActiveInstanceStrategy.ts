// Copyright Epic Games, Inc. All Rights Reserved.
import { Strategy as CustomStrategy } from 'passport-custom';
import axios from 'axios';
import { Logger } from '../../Logger';
import { findUserByUsername } from '../db';

export interface AuthConfig {
    api_domain: string;
    license_id: string;
    system_user_name: string;
    payload?: Record<string, string>;
}

type PassportDone = (error: any, user?: any, info?: any) => void;

export function createCheckActiveInstanceStrategy(config: AuthConfig): CustomStrategy {
    return new CustomStrategy(async (req, done) => {
        Logger.info('Checking active instance authentication');

        let externalApiUrl;

        if (!config.api_domain) {
            Logger.error('No api_domain configured');
            return done('No api_domain configured', false);
        } else {
            externalApiUrl = `https://${config.api_domain}/checkActiveInstance`;
        }

        // Extract Bearer token from Authorization header
        const authHeader = req.get('Authorization');
        let token: string | undefined;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        // Fallback to query parameter for backward compatibility
        if (!token) {
            token = req.query['token'] as string;
        }

        if (!token) {
            Logger.info('Authentication failed. No token provided');
            return done(false, false);
        }

        // Handle authentication request
        return await handleAuthentication(externalApiUrl, token, config, done);
    });
}

async function handleAuthentication(
    apiUrl: string,
    token: string,
    config: AuthConfig,
    done: PassportDone
): Promise<void> {
    try {
        Logger.info(`Making authentication request to: ${apiUrl}`);

        const requestConfig = {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 5000
        };

        const payload =
            typeof config.payload === 'object' && config.payload !== null ? { ...config.payload } : {};

        if (config.license_id) {
            payload['licenseId'] = config.license_id;
        }

        const response = await axios.post(apiUrl, payload, requestConfig);

        if (response.status === 200) {
            Logger.info('Authentication successful');

            const user = await findUserByUsername(config.system_user_name);

            if (!user) {
                Logger.info('Authentication failed. System user not found.');
                return done(false, false);
            }

            return done(null, user);
        } else {
            Logger.info(`Authentication failed. API returned status: ${response.status}`);
            return done(null, false);
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                Logger.error(
                    `Authentication API error: ${error.response.status} - ${error.response.statusText}`
                );
            } else if (error.request) {
                Logger.error(`Authentication API request failed: ${error.message}`);
            } else {
                Logger.error(`Authentication error: ${error.message}`);
            }
        } else {
            Logger.error(`Unexpected authentication error: ${error as string}`);
        }
        return done(null, false);
    }
}

export { AuthConfig as AuthenticationConfig };
