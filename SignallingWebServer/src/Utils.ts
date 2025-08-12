// Copyright Epic Games, Inc. All Rights Reserved.
import { jsonc } from 'jsonc';

// A simple interface to describe the options from commander.js
export interface IProgramOptions {
    [key: string]: any;
    // Authentication options
    use_authentication?: boolean;
    api_domain?: string;
    license_id?: string;
    system_user?: string;
    session_secret?: string;
}

/**
 * Cirular reference safe version of JSON.stringify
 */
export function stringify(obj: any): string {
    return jsonc.stringify(obj);
}

/**
 * Circular reference save version of JSON.stringify with extra formatting.
 */
export function beautify(obj: any): string {
    return jsonc.stringify(obj, undefined, '\t');
}
