import { ValueToken } from '../../tokenizer/abstract';

export function decimalNumberDefaultFeature(token: ValueToken) {
    if (typeof token.value !== 'number') {
        return undefined;
    }

    return token.value.toString();
}

export function decimalNumberFeature(token: ValueToken) {
    if (token.meta?.['number.type'] !== 'decimal') {
        return undefined;
    }

    return decimalNumberDefaultFeature(token);
}
