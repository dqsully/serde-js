import { Visitor } from '../../visitor/abstract';
import { AbstractFeature, AbstractFeatureParseReturn } from '../abstract';

interface Settings {}
export {
    Settings as DoubleSlashCommentFeatureSettings,
};

export default class DoubleSlashCommentFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    // We don't use `this` because there are no settings for `BooleanFeature`
    // eslint-disable-next-line class-methods-use-this
    public* parse(firstChar: string, visitor: Visitor): AbstractFeatureParseReturn {
        if (firstChar !== '/') {
            return () => `expected '${firstChar}' to be '/' for '// (comment)'`;
        }

        let char: string | undefined;

        char = yield;

        if (char !== '/') {
            return () => `expected '${char}' to be '/' for '// (comment)'`;
        }

        let comment = '';

        while (true) {
            char = yield;

            if (char === undefined || char === '\n') {
                visitor.impl.pushInvisible(visitor.context, 'comment.double-slash', comment);

                return true;
            }

            comment += char;
        }
    }
}
