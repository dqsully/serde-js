module.exports = {
    root: true,
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'airbnb-typescript'
    ],
    parserOptions: {
        project: __dirname + '/tsconfig.json',
    },
    settings: {
        // Append 'ts' extensions to Airbnb 'import/resolver' setting
        'import/resolver': {
            node: {
                extensions: ['.mjs', '.js', '.ts', '.json', '.d.ts'],
            },
        },
    },
    rules: {
        // Set indentation to 4
        '@typescript-eslint/indent': [
            'error',
            4,
            {
                // Ignore TypeScript typing brackets on multiple lines
                ignoredNodes: [
                    'TSTypeParameterDeclaration',
                    // 'TSTypeParameter',
                    'TSTypeParameterInstantiation',
                    // 'TSQualifiedName',
                ],

                // Make switch cases indented
                SwitchCase: 1,
            },
        ],

        // There are good reasons to have multiple classes per file sometimes
        'max-classes-per-file': 'off',

        // These can make code harder to read, although I somewhat agree with the premise
        'no-lonely-if': 'off',
        'no-else-return': 'off',

        // I prefer not having a default export
        'import/prefer-default-export': 'off',

        // The DI system relies a lot on classes that don't necessarily use `this`
        'class-methods-use-this': 'off',

        // Modified from Airbnb's style guide
        // Allow for..of, because we are targeting newer JS, and loops are more readable for the imperative style
        'no-restricted-syntax': [
            'error',
            {
                selector: 'ForInStatement',
                message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
            },
            // {
            //     selector: 'ForOfStatement',
            //     message: 'iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.',
            // },
            {
                selector: 'LabeledStatement',
                message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
            },
            {
                selector: 'WithStatement',
                message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
            },
        ],

        // Allow inferred return types
        '@typescript-eslint/explicit-function-return-type': 'off',

        // Prefer as const
        '@typescript-eslint/prefer-as-const': 'warn',

        // Ignore unbound methods, mocking sets it off
        '@typescript-eslint/unbound-method': 'off',

        // Allow async functions that don't contain an await
        '@typescript-eslint/require-await': 'off',

        // Require class members to be explicitly public/protected/private
        // (except the constructor)
        '@typescript-eslint/explicit-member-accessibility': [
            'error',
            {
                accessibility: 'explicit',
                overrides: {
                    constructors: 'no-public',
                    properties: 'explicit',
                },
            },
        ],

        // Trade out blanket default case for type-based exhaustiveness check
        'default-case': 'off',
        '@typescript-eslint/switch-exhaustiveness-check': 'error',

        // TypeScript has the consistent return already implemented better
        'consistent-return': 'off',

        // Much of this code relies on returning functions
        'no-loop-func': 'off',

        // We use empty interfaces for convenience
        '@typescript-eslint/no-empty-interface': 'off',

        // So many `any`s are everywhere, and are important
        '@typescript-eslint/no-explicit-any': 'off',
    }
};
