// Copyright Epic Games, Inc. All Rights Reserved.
import fs from 'fs';
import path from 'path';
import { Logger } from '../../Logger';

export interface User {
    id: string;
    username: string;
    email?: string;
    profile?: any;
}

const usersFilePath = path.join(__dirname, 'users.json');

let users: User[] = [];

function loadUsers(): void {
    try {
        if (fs.existsSync(usersFilePath)) {
            const data = fs.readFileSync(usersFilePath, 'utf8');
            users = JSON.parse(data) as User[];
        } else {
            // Create default users file
            users = [
                {
                    id: '1',
                    username: 'rava'
                }
            ];
            saveUsers();
        }
    } catch (error) {
        Logger.error(`Error loading users: ${error as string}`);
        users = [];
    }
}

function saveUsers(): void {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
        Logger.error(`Error saving users: ${error as string}`);
    }
}

export function findUserByUsername(username: string): Promise<User | null> {
    return new Promise((resolve) => {
        loadUsers();
        const user = users.find((u) => u.username === username);
        resolve(user || null);
    });
}

export function findUserById(id: string): Promise<User | null> {
    return new Promise((resolve) => {
        loadUsers();
        const user = users.find((u) => u.id === id);
        resolve(user || null);
    });
}

export function addUser(user: User): Promise<User> {
    return new Promise((resolve) => {
        loadUsers();

        // Check if user already exists
        const existingUser = users.find((u) => u.username === user.username);
        if (existingUser) {
            resolve(existingUser);
            return;
        }

        users.push(user);
        saveUsers();
        resolve(user);
    });
}

export function updateUser(user: User): Promise<User> {
    return new Promise((resolve) => {
        loadUsers();
        const index = users.findIndex((u) => u.id === user.id);
        if (index !== -1) {
            users[index] = user;
            saveUsers();
        }
        resolve(user);
    });
}

// Initialize users on module load
loadUsers();
