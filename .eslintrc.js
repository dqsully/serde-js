module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'airbnb-typescript/base',
    ],
    rules: {
        '@typescript-eslint/indent': [
            'warn',
            4,
            {
                ignoredNodes: [
                    'TSTypeParameterDeclaration',
                    // 'TSTypeParameter',
                    'TSTypeParameterInstantiation',
                    // 'TSQualifiedName',
                ],
                SwitchCase: 1,
            },
        ],
        'max-classes-per-file': 'off',

        // Modified from Airbnb's style guide
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
    },
    overrides: [
        {
            files: [
                'src/parse/features/**/*.ts',
            ],
            rules: {
                'class-methods-use-this': 'off',
                'no-loop-func': 'off',
            },
        },
        {
            files: [
                'src/parse/visitor/*.ts',
            ],
            rules: {
                'no-param-reassign': 'off',
            },
        },
    ]
};
