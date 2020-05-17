import { Visitor, Visitors } from '../../visitor/abstract';
import {
    AbstractFeature,
    AbstractFeatureParseReturn,
    FeatureResult,
    PeekAhead,
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _visitors: Visitors,
        peekFinalizers?: PeekAhead,
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
                    return () => `expected ${char} to be '+', '-', or '0' for a binary number (prefix)`;
                }
            } else {
                return () => `expected ${char} to be '-' or '0' for a binary number (prefix)`;
            }

            char = yield;

            if (char === undefined) {
                return () => 'unexpected end of file';
            }
            if (char !== '0') {
                return () => `expected ${char} to be '0' for a binary number (prefix)`;
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

        if (char !== undefined && peekFinalizers !== undefined) {
            yield peekFinalizers;
        }

        const number = Number.parseInt(numberStr, 2);

        visitor.impl.visitValue(visitor.context, number);
        visitor.impl.setMetadata(visitor.context, 'number.type', 'binary');

        if (char !== undefined && peekFinalizers !== undefined) {
            return FeatureResult.CommitUntilLast;
        }

        return FeatureResult.Commit;
    }
}
