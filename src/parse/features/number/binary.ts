import { Visitor, Visitors } from '../../visitor/abstract';
import {
    AbstractFeature,
    AbstractFeatureParseReturn,
    FeatureResult,
    Peekers,
    FeatureAction,
} from '../abstract';

interface Settings {
    canStartWithPlus?: boolean;
}
export {
    Settings as BinaryNumberFeatureSettings,
};

export default class BinaryNumberFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    public* parse(
        firstChar: string,
        visitor: Visitor,
        _visitors: Visitors,
        peekers?: Peekers,
    ): AbstractFeatureParseReturn {
        let char: string | undefined = firstChar;
        let numberStr = '';

        if (firstChar === '0') {
            // Do nothing
        } else {
            if (firstChar === '-') {
                numberStr += '-';
            } else if (this.settings.canStartWithPlus) {
                if (firstChar !== '+') {
                    return () => `expected '${firstChar}' to be '+', '-', or '0' for a binary number (prefix)`;
                }
            } else {
                return () => `expected '${firstChar}' to be '-' or '0' for a binary number (prefix)`;
            }

            char = yield;

            if (char === undefined) {
                return () => 'unexpected end of file';
            }
            if (char !== '0') {
                return () => `expected '${char}' to be '0' for a binary number (prefix)`;
            }
        }

        char = yield;

        if (char === undefined) {
            return () => 'unexpected end of file';
        }
        if (char !== 'b') {
            return () => `expected '${char}' to be 'b' for a binary number (prefix)`;
        }

        while (true) {
            char = yield;

            if (char !== '0' && char !== '1') {
                break;
            } else {
                numberStr += char;
            }
        }

        if (char !== undefined && peekers !== undefined) {
            yield {
                action: FeatureAction.PeekAhead,
                peekers,
            };
        }

        const number = Number.parseInt(numberStr, 2);

        visitor.impl.visitValue(visitor.context, number);
        visitor.impl.setMetadata(visitor.context, 'number.type', 'binary');

        if (char !== undefined) {
            return FeatureResult.CommitUntilLast;
        }

        return FeatureResult.Commit;
    }
}
