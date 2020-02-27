import { InvisibleToken } from '../../tokenizer/abstract';

export function hashCommentDefaultFeature(token: InvisibleToken) {
    if (!token.kind.startsWith('comment.line.')) {
        return undefined;
    }

    return `#${token.data}`;
}

export function hashCommentFeature(token: InvisibleToken) {
    if (token.kind !== 'comment.line.hash') {
        return undefined;
    }

    return hashCommentDefaultFeature(token);
}
