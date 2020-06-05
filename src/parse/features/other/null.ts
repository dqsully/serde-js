import { Visitor, Visitors } from '../../visitor/abstract';
import {
    AbstractFeature, AbstractFeatureParseReturn, FeatureResult, FeatureAction, Peekers,
} from '../abstract';

const nullChars = 'null'.split('');

interface Settings{}
export {
    Settings as NullFeatureSettings,
};

export default class NullFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    // We don't use `this` because there are no settings for `NullFeature`
    public* parse(
        firstChar: string,
        visitor: Visitor,
        _visitors: Visitors,
        peekers?: Peekers,
    ): AbstractFeatureParseReturn {
        if (firstChar !== 'n') {
            return () => `expected '${firstChar}' to be 'n' for 'null'`;
        }

        let char: string | undefined;

        for (let i = 1; i < nullChars.length; i += 1) {
            // Read next character
            char = yield;

            if (char === undefined) {
                return () => 'unexpected end of file';
            }
            if (char !== nullChars[i]) {
                return () => `expected '${char}' to be '${nullChars[i]}' for 'null'`;
            }
        }

        if (peekers !== undefined) {
            yield {
                action: FeatureAction.PeekAhead,
                peekers,
            };
        }

        visitor.impl.visitValue(visitor.context, null);

        // Commit all parsed chars
        if (peekers !== undefined) {
            return FeatureResult.CommitUntilLast;
        }

        // Commit all parsed chars
        return FeatureResult.Commit;
    }
}
