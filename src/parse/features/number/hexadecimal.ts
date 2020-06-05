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
    Settings as HexadecimalNumberFeatureSettings,
};

const anyDigit = /^[0-9a-f]$/i;

export default class HexadecimalNumberFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    public* parse(
        firstChar: string,
        visitor: Visitor,
        _visitors: Visitors,
        peekers?: Peekers,
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
                    return () => `expected '${firstChar}' to be '+', '-', or '0' for a hexadecimal number (prefix)`;
                }
            } else {
                return () => `expected '${firstChar}' to be '-' or '0' for a hexadecimal number (prefix)`;
            }

            char = yield;

            if (char === undefined) {
                return () => 'unexpected end of file';
            }
            if (char !== '0') {
                return () => `expected '${char}' to be '0' for a hexadecimal number (prefix)`;
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

        if (char !== undefined && peekers !== undefined) {
            yield {
                action: FeatureAction.PeekAhead,
                peekers,
            };
        }

        const number = Number.parseInt(numberStr, 16);

        visitor.impl.visitValue(visitor.context, number);
        visitor.impl.setMetadata(visitor.context, 'number.type', 'hexadecimal');

        if (char !== undefined) {
            return FeatureResult.CommitUntilLast;
        }

        return FeatureResult.Commit;
    }
}
