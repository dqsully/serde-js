import { Visitor, Visitors } from '../../visitor/abstract';
import {
    AbstractFeature, AbstractFeatureParseReturn, FeatureResult, PeekAhead,
} from '../abstract';

const nanChars = 'NaN'.split('');

interface Settings {}
export {
    Settings as NanFeatureSettings,
};

export default class NanFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    // We don't use `this` because there are no settings for `NanFeature`
    public* parse(
        firstChar: string,
        visitor: Visitor,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _visitors: Visitors,
        peekFinalizers?: PeekAhead,
    ): AbstractFeatureParseReturn {
        if (firstChar !== 'N') {
            return () => `expected '${firstChar}' to be 'N' for 'NaN'`;
        }

        let char: string | undefined;

        for (let i = 1; i < nanChars.length; i += 1) {
            // Read next character
            char = yield;

            if (char === undefined) {
                return () => 'unexpected end of file';
            }
            if (char !== nanChars[i]) {
                return () => `expected '${char}' to be '${nanChars[i]}' for 'NaN'`;
            }
        }

        if (peekFinalizers !== undefined) {
            yield peekFinalizers;
        }

        visitor.impl.visitValue(visitor.context, NaN);

        // Commit all parsed chars
        if (peekFinalizers !== undefined) {
            return FeatureResult.CommitUntilLast;
        }

        return FeatureResult.Commit;
    }
}
