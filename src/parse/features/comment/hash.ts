import { Visitor } from '../../visitor/abstract';
import { AbstractFeature, AbstractFeatureParseReturn, FeatureResult } from '../abstract';

interface Settings {}
export {
    Settings as HashCommentFeatureSettings,
};

export default class HashCommentFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    // We don't use `this` because there are no settings for `BooleanFeature`
    // eslint-disable-next-line class-methods-use-this
    public* parse(firstChar: string, visitor: Visitor): AbstractFeatureParseReturn {
        if (firstChar !== '#') {
            return () => `expected '${firstChar}' to be '#' for '# (comment)'`;
        }

        let char: string | undefined;
        let comment = '';

        while (true) {
            char = yield;

            if (char === undefined || char === '\n') {
                visitor.impl.pushInvisible(visitor.context, 'comment.line.hash', comment);

                return FeatureResult.Commit;
            }

            comment += char;
        }
    }
}
