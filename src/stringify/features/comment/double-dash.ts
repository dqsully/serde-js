import { InvisibleToken } from '../../tokenizer/abstract';

export function doubleDashCommentDefaultFeature(token: InvisibleToken) {
    if (!token.kind.startsWith('comment.line.')) {
        return undefined;
    }

    return `--${token.data}`;
}

export function doubleDashCommentFeature(token: InvisibleToken) {
    if (token.kind !== 'comment.line.double-dash') {
        return undefined;
    }

    return doubleDashCommentDefaultFeature(token);
}
