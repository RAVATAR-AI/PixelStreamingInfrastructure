module.exports = {
    preset: 'ts-jest/presets/js-with-ts',
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.jest.json'
            }
        ]
    },
    modulePathIgnorePatterns: ['<rootDir>/dist/'],
    testPathIgnorePatterns: ['<rootDir>/dist/', '/node_modules/'],
    globals: {
        TextDecoder: TextDecoder,
        TextEncoder: TextEncoder
    }
};
