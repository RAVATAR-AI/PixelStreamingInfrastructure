import tseslint from 'typescript-eslint';
import baseConfig from '../../../eslint.config.mjs'

export default tseslint.config(
    baseConfig,
    {
        ignores: ["src/__test__/**/*.ts", "**/*.test.ts"],
    },
    {
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: 'tsconfig.json',
            },
        },
        files: ["src/**/*.ts"],
        rules: {
            "copyright/copyright": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    "argsIgnorePattern": "^_",
                    "varsIgnorePattern": "^_",
                    "caughtErrorsIgnorePattern": "^_"
                }
            ]
        }
    }
);
