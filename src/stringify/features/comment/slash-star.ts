import { InvisibleToken } from '../../tokenizer/abstract';

export function slashStarCommentDefaultFeature(token: InvisibleToken) {
    if (!token.kind.startsWith('comment.block.')) {
        return undefined;
    }

    return `/*${token.data}*/`;
}

export function slashStarCommentFeature(token: InvisibleToken) {
    if (token.kind !== 'comment.block.slash-star') {
        return undefined;
    }

    return slashStarCommentDefaultFeature(token);
}
