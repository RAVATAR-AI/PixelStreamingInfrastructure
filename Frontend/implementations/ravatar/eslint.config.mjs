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
            // The base rule mis-reports parameters of TypeScript function types and
            // catch bindings; @typescript-eslint/no-unused-vars below replaces it.
            "no-unused-vars": "off",
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
