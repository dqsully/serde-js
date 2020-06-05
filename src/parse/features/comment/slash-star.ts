import { Visitor } from '../../visitor/abstract';
import { AbstractFeature, AbstractFeatureParseReturn, FeatureResult } from '../abstract';

interface Settings {}
export {
    Settings as SlashStarCommentFeatureSettings,
};

export default class SlashStarCommentFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

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

                visitor.impl.pushInvisible(visitor.context, 'comment.block.slash-star', comment);

                return FeatureResult.Commit;
            }
            if (lastChar === '*' && char === '/') {
                visitor.impl.pushInvisible(visitor.context, 'comment.block.slash-star', comment);

                return FeatureResult.Commit;
            }

            if (lastChar !== undefined) {
                comment += lastChar;
            }

            lastChar = char;
        }
    }
}
