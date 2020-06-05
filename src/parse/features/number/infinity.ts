import { Visitor, Visitors } from '../../visitor/abstract';
import {
    AbstractFeature, AbstractFeatureParseReturn, FeatureResult, Peekers, FeatureAction,
} from '../abstract';

const infinityChars = 'Infinity'.split('');

interface Settings {
    canStartWithPlus?: boolean;
}
export {
    Settings as InfinityFeatureSettings,
};

export default class InfinityFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    public* parse(
        firstChar: string,
        visitor: Visitor,
        _visitors: Visitors,
        peekers?: Peekers,
    ): AbstractFeatureParseReturn {
        let char: string | undefined = firstChar;
        let negative = false;

        if (firstChar === 'I') {
            // Do nothing
        } else {
            if (firstChar === '-') {
                negative = true;
            } else if (this.settings.canStartWithPlus) {
                if (firstChar !== '+') {
                    return () => `expected '${char}' to be '+', '-', or 'I' for infinity (prefix)`;
                }
            } else {
                return () => `expected '${char}' to be '-' or 'I' for infinity (prefix)`;
            }

            char = yield;

            if (char === undefined) {
                return () => 'unexpected end of file';
            }
            if (char !== 'I') {
                return () => `expected '${char}' to be 'I' for infinity (prefix)`;
            }
        }

        for (let i = 1; i < infinityChars.length; i += 1) {
            // Read next character
            char = yield;

            if (char === undefined) {
                return () => 'unexpected end of file';
            }
            if (char !== infinityChars[i]) {
                return () => `expected ''${char}'' to be '${infinityChars[i]}' for infinity`;
            }
        }

        if (peekers !== undefined) {
            yield {
                action: FeatureAction.PeekAhead,
                peekers,
            };
        }

        if (negative) {
            visitor.impl.visitValue(visitor.context, Number.NEGATIVE_INFINITY);
        } else {
            visitor.impl.visitValue(visitor.context, Number.POSITIVE_INFINITY);
        }

        // Commit all parsed chars
        if (peekers !== undefined) {
            return FeatureResult.CommitUntilLast;
        }

        return FeatureResult.Commit;
    }
}
