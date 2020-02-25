import { Visitor } from '../../visitor/abstract';
import { AbstractFeature, AbstractFeatureParseReturn } from '../abstract';

interface Settings {}
export {
    Settings as SlashStarCommentFeatureSettings,
};

export default class SlashStarCommentFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    // We don't use `this` because there are no settings for `BooleanFeature`
    // eslint-disable-next-line class-methods-use-this
    public* parse(firstChar: string, visitor: Visitor): AbstractFeatureParseReturn {
        if (firstChar !== '/') {
            return () => `expected '${firstChar}' to be '/' for '/* (comment) */'`;
        }

        let char: string | undefined;
        let lastChar: string | undefined;

        char = yield;

        if (char !== '*') {
            return () => `expected '${char}' to be '*' for '/* (comment) */'`;
        }

        let comment = '';

        while (true) {
            char = yield;

            if (char === undefined) {
                if (lastChar !== undefined) {
                    comment += lastChar;
                }

                visitor.impl.pushInvisible(visitor.context, 'comment.slash-star', comment);

                return true;
            }
            if (lastChar === '*' && char === '/') {
                visitor.impl.pushInvisible(visitor.context, 'comment.slash-star', comment);

                return true;
            }

            if (lastChar !== undefined) {
                comment += lastChar;
            }

            lastChar = char;
        }
    }
}
