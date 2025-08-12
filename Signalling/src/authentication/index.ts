// Copyright Epic Games, Inc. All Rights Reserved.
import passport from 'passport';
import session from 'express-session';
import { Express } from 'express';
import { Logger } from '../Logger';
import { createCheckActiveInstanceStrategy, AuthConfig } from './strategies/checkActiveInstanceStrategy';
import { findUserById } from './db';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface SessionConfig {
    session_secret: string;
}

export interface WebServerAuthConfig extends AuthConfig {
    session_secret?: string;
}

export function initAuthentication(app: Express, config: WebServerAuthConfig): typeof passport {
    // Generate or load session secret
    let sessionConfig: SessionConfig = { session_secret: '' };
    const configPath = path.join(__dirname, 'config.json');

    if (fs.existsSync(configPath)) {
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            sessionConfig = JSON.parse(content) as SessionConfig;
        } catch (e) {
            Logger.error(`Error with auth config file '${configPath}': ${e as string}`);
        }
    }

    if (!sessionConfig.session_secret) {
        sessionConfig.session_secret = config.session_secret || crypto.randomBytes(32).toString('hex');
        const content = JSON.stringify(sessionConfig, null, 2);
        fs.writeFileSync(configPath, content);
    }

    // Session configuration
    app.use(
        session({
            secret: sessionConfig.session_secret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: true,
                sameSite: 'none',
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            }
        })
    );

    app.use(passport.initialize());
    app.use(passport.session());

    // Passport serialization
    passport.serializeUser((user: any, done) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await findUserById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });

    // Configure strategies
    Logger.info('Setting up authentication');
    Logger.info('Using custom auth strategy (checkActiveInstance)');
    passport.use('custom', createCheckActiveInstanceStrategy(config));

    return passport;
}

export function requireAuthentication(redirectUrl: string = '/login', forceAuth: boolean = false) {
    return (req: any, res: any, next: any) => {
        /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */

        // If forceAuth is true, skip the isAuthenticated check and always authenticate
        if (!forceAuth && req.isAuthenticated()) {
            return next();
        }

        Logger.info('User not authenticated, redirecting to login');
        req.session.redirectTo = req.originalUrl;

        return passport.authenticate('custom', { failureRedirect: redirectUrl })(req, res, next);
        /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
    };
}

// Export types and configuration interfaces
export type { AuthConfig as AuthenticationConfig } from './strategies/checkActiveInstanceStrategy';
export { User } from './db';
