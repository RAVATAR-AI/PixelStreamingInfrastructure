// Copyright Epic Games, Inc. All Rights Reserved.
import express, { NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import helmet from 'helmet';
import { Logger } from './Logger';
import RateLimit from 'express-rate-limit';
import { requireAuthentication, WebServerAuthConfig } from './authentication';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const hsts = require('hsts');

/**
 * An interface that describes the possible options to pass to
 * WebServer.
 */
export interface IWebServerConfig {
    // The port to run the webserver on. 80 by default.
    httpPort: number;

    // The root of the serve directory. Current working directory by default.
    root: string;

    // The filename to direct connections to if none suppllied in the url. player.html by default.
    homepageFile: string;

    // An optional rate limit to prevent overloading.
    perMinuteRateLimit?: number;

    // When set an https server will be created
    httpsPort?: number;

    // The ssl key data for https
    ssl_key?: Buffer;

    // The ssl cert data for https
    ssl_cert?: Buffer;

    // If true, connections to http will be redirected to https.
    https_redirect?: boolean;

    // Authentication configuration (optional)
    authentication?: WebServerAuthConfig;
}

/**
 * An object to manage the initialization of a web server. Used to serve the
 * pixel streaming frontend.
 */
export class WebServer {
    httpServer: http.Server | undefined;
    httpsServer: https.Server | undefined;
    private authenticationEnabled: boolean = false;

    constructor(app: express.Express, config: IWebServerConfig) {
        Logger.debug('Starting WebServer with config: %s', config);

        // only listen on the http port if we're not using https or if we want to redirect
        if (!config.httpsPort || config.https_redirect) {
            this.httpServer = http.createServer(app);
            this.httpServer.listen(config.httpPort, () => {
                Logger.info(`Http server listening on port ${config.httpPort}`);
            });
        }

        /* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access */

        // if using https listen on the given ports and setup some details
        if (config.httpsPort) {
            const options = { key: config.ssl_key, cert: config.ssl_cert };
            this.httpsServer = https.createServer(options, app);
            this.httpsServer.listen(config.httpsPort, () => {
                Logger.info(`Https server listening on port ${config.httpsPort}`);
            });

            app.use(
                helmet({
                    contentSecurityPolicy: false,
                    xFrameOptions: false
                    /*contentSecurityPolicy: {
                        directives: {
                            'connect-src': ['*', "'self'"]
                        }
                    }*/
                })
            );

            app.use(
                hsts({
                    maxAge: 15552000 // 180 days in seconds
                })
            );

            // Setup http -> https redirect if requested
            if (config.https_redirect) {
                app.use((req: any, res: any, next: any) => {
                    if (!req.secure) {
                        if (req.get('Host')) {
                            const hostAddressParts: string[] = req.get('Host').split(':') as string[];
                            let hostAddress = hostAddressParts[0];
                            if (config.httpsPort != 443) {
                                hostAddress = `${hostAddress}:${config.httpsPort}`;
                            }
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                            return res.redirect(['https://', hostAddress, req.originalUrl].join(''));
                        } else {
                            Logger.error(
                                `Unable to get host name from header. Requestor ${req.ip}, url path: '${req.originalUrl}', available headers ${JSON.stringify(req.headers)}`
                            );
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                            return res.status(400).send('Bad Request');
                        }
                    }
                    next();
                });
            }
        }

        //If not using authetication then just move on to the next function/middleware
        let isAuthenticated = (_redirectUrl: string, _forceAuth: boolean = false) =>
            function (_req: any, _res: any, next: NextFunction) {
                return next();
            };

        // Initialize authentication if configured
        if (config.authentication) {
            const { initAuthentication } = require('./authentication') as typeof import('./authentication');
            const authConfig: WebServerAuthConfig = {
                ...config.authentication,
                payload: config.authentication.payload || {}
            };
            initAuthentication(app, authConfig);
            this.authenticationEnabled = true;

            isAuthenticated = requireAuthentication;
            Logger.info('Authentication initialized');
        }

        const limiter = RateLimit({
            windowMs: 60 * 1000, // 1 minute
            max: config.perMinuteRateLimit ? config.perMinuteRateLimit : 3000
        });

        // apply rate limiter to all requests
        app.use(limiter);

        // Define HTML files that don't require authentication (public access)
        const publicHtmlFiles = ['/login.html', '/forbidden.html'];

        const serveHtmlFile = (filePath: string, res: any) => {
            const resolvedPath = path.resolve(filePath);
            if (fs.existsSync(resolvedPath)) {
                res.sendFile(resolvedPath);
            } else {
                const error = `Unable to locate file ${path.basename(filePath)}`;
                Logger.error(error);
                res.status(404).send(error);
            }
        };

        app.get('*.html', function (req: any, res: any, next: any) {
            const requestedFile: string = req.path as string;

            // Skip authentication for public HTML files
            if (publicHtmlFiles.includes(requestedFile)) {
                next();
                return;
            }

            // Apply authentication for other HTML files
            isAuthenticated('/login')(req, res, () => {
                const filePath = path.join(config.root, requestedFile);
                serveHtmlFile(filePath, res);
            });
        });

        // Static file serving (handles non-HTML files and public HTML files)
        app.use(express.static(config.root));

        // Request has been sent to site root, send the homepage file
        app.get('/', function (req: any, res: any, _next: any) {
            // Always authenticate the user before serving the homepage for token-based auth
            isAuthenticated('/login', !!config.authentication?.api_domain)(req, res, () => {
                const homepageFilePath = path.join(config.root, config.homepageFile);
                serveHtmlFile(homepageFilePath, res);
            });
        });

        // Authentication-related routes
        app.get(['/login', '/login.html'], function (_req, res) {
            if (config.authentication?.api_domain) {
                return res.redirect('/forbidden');
            }
            serveHtmlFile(path.join(config.root, 'login.html'), res);
        });

        app.get(['/forbidden', '/forbidden.html'], function (_req, res) {
            serveHtmlFile(path.join(config.root, 'forbidden.html'), res);
        });

        // Catch-all 404 handler - serve forbidden.html for any unmatched routes
        app.use(function (_req, res) {
            res.status(404);
            serveHtmlFile(path.join(config.root, 'forbidden.html'), res);
        });
    }
}
