import { Visitor, Visitors } from '../../visitor/abstract';
import {
    AbstractFeature, AbstractFeatureParseReturn, FeatureResult, PeekAhead,
} from '../abstract';

const trueChars = 'true'.split('');
const falseChars = 'false'.split('');

interface Settings {}
export {
    Settings as BooleanFeatureSettings,
};

export default class BooleanFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    // We don't use `this` because there are no settings for `BooleanFeature`
    public* parse(
        firstChar: string,
        visitor: Visitor,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _visitors: Visitors,
        peekFinalizers?: PeekAhead,
    ): AbstractFeatureParseReturn {
        let variant: string[];

        if (firstChar === 't') {
            variant = trueChars;
        } else if (firstChar === 'f') {
            variant = falseChars;
        } else {
            return () => `expected '${firstChar}' to be 't' or 'f' for 'true' or 'false'`;
        }

        let char: string | undefined;

        for (let i = 1; i < variant.length; i += 1) {
            // Read next character
            char = yield;

            if (char === undefined) {
                return () => 'unexpected end of file';
            }
            if (char !== variant[i]) {
                return () => `expected '${char}' to be '${variant[i]}' for '${variant.join('')}'`;
            }
        }

        if (peekFinalizers !== undefined) {
            yield peekFinalizers;
        }

        visitor.impl.visitValue(visitor.context, variant === trueChars);

        // Commit all parsed chars
        if (peekFinalizers !== undefined) {
            return FeatureResult.CommitUntilLast;
        } else {
            return FeatureResult.Commit;
        }
    }
}
