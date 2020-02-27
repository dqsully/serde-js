import { InvisibleToken } from '../../tokenizer/abstract';

// eslint-disable-next-line import/prefer-default-export
export function anyWhitespaceFeature(token: InvisibleToken) {
    if (token.kind !== 'whitespace') {
        return undefined;
    }

    if (typeof token.data !== 'string') {
        return undefined;
    }

    return token.data;
}
