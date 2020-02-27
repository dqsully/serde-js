import { InvisibleToken } from '../../tokenizer/abstract';

export function doubleSlashCommentDefaultFeature(token: InvisibleToken) {
    if (!token.kind.startsWith('comment.line.')) {
        return undefined;
    }

    return `//${token.data}`;
}

export function doubleSlashCommentFeature(token: InvisibleToken) {
    if (token.kind !== 'comment.line.double-slash') {
        return undefined;
    }

    return doubleSlashCommentDefaultFeature(token);
}
