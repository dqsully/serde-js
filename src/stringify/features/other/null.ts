import { ValueToken } from '../../tokenizer/abstract';

export function nullDefaultFeature(token: ValueToken) {
    if (token.value !== null) {
        return undefined;
    }

    return 'null';
}

export function nullFeature(token: ValueToken) {
    if (token.meta?.['null'] !== true) {
        return undefined;
    }

    return nullDefaultFeature(token);
}
