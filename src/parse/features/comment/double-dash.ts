import { Visitor } from '../../visitor/abstract';
import { AbstractFeature, AbstractFeatureParseReturn, FeatureResult } from '../abstract';

interface Settings {}
export {
    Settings as DoubleDashCommentFeatureSettings,
};

export default class DoubleDashCommentFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    public* parse(firstChar: string, visitor: Visitor): AbstractFeatureParseReturn {
        if (firstChar !== '-') {
            return () => `expected '${firstChar}' to be '-' for '-- (comment)'`;
        }

        let char: string | undefined;

        char = yield;

        if (char !== '-') {
            return () => `expected '${char}' to be '-' for '-- (comment)'`;
        }

        let comment = '';

        while (true) {
            char = yield;

            if (char === undefined || char === '\n') {
                visitor.impl.pushInvisible(visitor.context, 'comment.line.double-dash', comment);

                return FeatureResult.Commit;
            }

            comment += char;
        }
    }
}
