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
    Settings as HexadecimalNumberFeatureSettings,
};

const anyDigit = /^[0-9a-f]$/i;

export default class HexadecimalNumberFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    public* parse(
        firstChar: string,
        visitor: Visitor,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _visitors: Visitors,
        peekFinalizers?: PeekAhead,
    ): AbstractFeatureParseReturn {
        let char: string | undefined;
        let numberStr = '';

        if (firstChar === '0') {
            // Do nothing
        } else {
            if (firstChar === '-') {
                numberStr += '-';
            } else if (this.settings.canStartWithPlus) {
                if (firstChar !== '+') {
                    return () => `expected ${char} to be '+', '-', or '0' for a hexadecimal number (prefix)`;
                }
            } else {
                return () => `expected ${char} to be '-' or '0' for a hexadecimal number (prefix)`;
            }

            char = yield;

            if (char === undefined) {
                return () => 'unexpected end of file';
            }
            if (char !== '0') {
                return () => `expected ${char} to be '0' for a hexadecimal number (prefix)`;
            }
        }

        char = yield;

        if (char === undefined) {
            return () => 'unexpected end of file';
        }
        if (char !== 'x') {
            return () => `expected '${char}' to be 'x' for a hexadecimal number (prefix)`;
        }

        while (true) {
            char = yield;

            if (char === undefined || !anyDigit.test(char)) {
                break;
            } else {
                numberStr += char;
            }
        }

        if (char !== undefined && peekFinalizers !== undefined) {
            yield peekFinalizers;
        }

        const number = Number.parseInt(numberStr, 16);

        visitor.impl.visitValue(visitor.context, number);
        visitor.impl.setMetadata(visitor.context, 'number.type', 'hexadecimal');

        if (char !== undefined && peekFinalizers !== undefined) {
            return FeatureResult.CommitUntilLast;
        }

        return FeatureResult.Commit;
    }
}
