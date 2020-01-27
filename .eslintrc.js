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
        'max-classes-per-file': 'off'
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
