import { Visitor, Visitors } from '../../visitor/abstract';
import {
    AbstractFeature,
    AbstractFeatureParseReturn,
    FeatureResult,
    PeekAhead,
} from '../abstract';

interface Settings {}
export {
    Settings as DecimalNumberFeatureSettings,
};

const positiveDigit = /^[1-9]$/;
const anyDigit = /^[0-9]$/;
const anySign = /^[+-]$/;

enum NumberState {
    WholePart,
    DecimalPart,
    ExponentPart,
}

export default class DecimalNumberFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    // We don't use `this` because there are no settings for `DecimalNumberFeature`
    // eslint-disable-next-line class-methods-use-this
    public* parse(
        firstChar: string,
        visitor: Visitor,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _visitors: Visitors,
        peekFinalizers?: PeekAhead,
    ): AbstractFeatureParseReturn {
        let numberStr = '';

        let wholeIsZero = false;
        let foundWholeDigit = false;
        let foundDecimalDigit = false;
        let foundExponentSign = false;
        let foundExponentDigit = false;
        let state = NumberState.WholePart;

        if (firstChar === '-') {
            numberStr += firstChar;
        } else if (firstChar === '0') {
            numberStr += '0';

            wholeIsZero = true;
            foundWholeDigit = true;
        } else if (positiveDigit.test(firstChar)) {
            numberStr += firstChar;

            foundWholeDigit = true;
        } else {
            return () => `expected '${firstChar}' to be a '-' or /[0-9]/ for a decimal number`;
        }

        const finalizeAndVisit = () => {
            const number = parseFloat(numberStr);

            visitor.impl.visitValue(visitor.context, number);
        };

        let char: string | undefined;

        while (state === NumberState.WholePart) {
            char = yield;

            if (char === undefined) {
                finalizeAndVisit();
                return FeatureResult.Commit;
            }

            if (char === '.') {
                if (!foundWholeDigit) {
                    return () => `expected '${char}' to be /[0-9]/ for a decimal number (whole part)`;
                }

                numberStr += '.';

                state = NumberState.DecimalPart;
            } else if (char === 'e' || char === 'E') {
                if (!foundWholeDigit) {
                    return () => `expected '${char}' to be /[0-9]/ for a decimal number (whole part)`;
                }

                numberStr += char;

                state = NumberState.ExponentPart;
            } else if (wholeIsZero) {
                if (peekFinalizers !== undefined) {
                    yield peekFinalizers;
                }

                finalizeAndVisit();
                return FeatureResult.CommitUntilLast;
            } else if (anyDigit.test(char)) {
                if (!foundWholeDigit && char === '0') {
                    wholeIsZero = true;
                }

                numberStr += char;

                foundWholeDigit = true;
            } else {
                if (peekFinalizers !== undefined) {
                    yield peekFinalizers;
                }

                finalizeAndVisit();
                return FeatureResult.CommitUntilLast;
            }
        }

        while (state === NumberState.DecimalPart) {
            char = yield;

            if (char === undefined) {
                if (!foundDecimalDigit) {
                    return () => "unexpected end of file, expected 'e', 'E', or /[0-9]/ for a decimal number (decimal part)";
                }

                finalizeAndVisit();
                return FeatureResult.Commit;
            }

            if (char === 'e' || char === 'E') {
                numberStr += char;

                state = NumberState.ExponentPart;
            } else if (anyDigit.test(char)) {
                numberStr += char;

                foundDecimalDigit = true;
            } else {
                if (peekFinalizers !== undefined) {
                    yield peekFinalizers;
                }

                finalizeAndVisit();
                return FeatureResult.CommitUntilLast;
            }
        }

        while (state === NumberState.ExponentPart) {
            char = yield;

            if (char === undefined) {
                if (!foundExponentDigit) {
                    return () => 'unexpected end of file, expected /[0-9]/ for a decimal number (exponent part)';
                }

                finalizeAndVisit();
                return FeatureResult.Commit;
            }

            if (anySign.test(char) && !foundExponentDigit) {
                if (foundExponentSign) {
                    return () => `expected '${char}' to be /[0-9]/ for decimal number (exponent part)`;
                }

                numberStr += char;

                foundExponentSign = true;
            } else if (anyDigit.test(char)) {
                numberStr += char;

                foundExponentDigit = true;
            } else {
                if (peekFinalizers !== undefined) {
                    yield peekFinalizers;
                }

                finalizeAndVisit();
                return FeatureResult.CommitUntilLast;
            }
        }

        throw new Error('Unreachable statement');
    }
}
