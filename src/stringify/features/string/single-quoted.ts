import { ValueToken } from '../../tokenizer/abstract';
import { escape } from '../../../util/escape';

export function singleQuotedStringDefaultFeature(token: ValueToken) {
    if (typeof token.value !== 'string') {
        return undefined;
    }

    return `'${escape(token.value, "'")}'`;
}

export function singleQuotedStringFeature(token: ValueToken) {
    if (token.meta?.['string.type'] !== 'single-quoted') {
        return undefined;
    }

    return singleQuotedStringDefaultFeature(token);
}
