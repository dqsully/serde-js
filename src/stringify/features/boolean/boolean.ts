import { ValueToken } from '../../tokenizer/abstract';

// eslint-disable-next-line import/prefer-default-export
export function booleanDefaultFeature(token: ValueToken) {
    if (typeof token.value !== 'boolean') {
        return undefined;
    }

    return token.value.toString();
}
