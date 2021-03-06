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
    laxDecimal?: boolean;
}
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
    public settings: Settings;

    constructor(settings: Settings) {
        super();

        this.settings = settings;
    }

    public* parse(
        firstChar: string,
        visitor: Visitor,
        _visitors: Visitors,
        peekers?: Peekers,
    ): AbstractFeatureParseReturn {
        let numberStr = '';

        let wholeIsZero = false;
        let foundWholeDigit = false;
        let foundDecimalDigit = false;
        let foundExponentSign = false;
        let foundExponentDigit = false;
        let skippedWholePart = false;
        let state = NumberState.WholePart;

        if (this.settings.canStartWithPlus && firstChar === '+') {
            // Do nothing...
        } else if (this.settings.laxDecimal && firstChar === '.') {
            numberStr += '0.';
            state = NumberState.DecimalPart;
        } else if (firstChar === '-') {
            numberStr += firstChar;
        } else if (firstChar === '0') {
            numberStr += '0';

            wholeIsZero = true;
            foundWholeDigit = true;
        } else if (positiveDigit.test(firstChar)) {
            numberStr += firstChar;

            foundWholeDigit = true;
        } else if (this.settings.canStartWithPlus) {
            return () => `expected '${firstChar}' to be a '+', '-', or a digit (0-9) for a decimal number`;
        } else {
            return () => `expected '${firstChar}' to be a '-' or a digit (0-9) for a decimal number`;
        }

        const finalizeAndVisit = () => {
            const number = parseFloat(numberStr);

            visitor.impl.visitValue(visitor.context, number);
            visitor.impl.setMetadata(visitor.context, 'number.type', 'decimal');
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
                    if (this.settings.laxDecimal) {
                        skippedWholePart = true;
                    } else {
                        return () => `expected '${char}' to be a digit (0-9) for a decimal number (whole part)`;
                    }
                }

                numberStr += '.';

                state = NumberState.DecimalPart;
            } else if (char === 'e' || char === 'E') {
                if (!foundWholeDigit) {
                    return () => `expected '${char}' to be a digit (0-9) for a decimal number (whole part)`;
                }

                numberStr += char;

                state = NumberState.ExponentPart;
            } else if (wholeIsZero) {
                if (peekers !== undefined) {
                    yield {
                        action: FeatureAction.PeekAhead,
                        peekers,
                    };
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
                if (peekers !== undefined) {
                    yield {
                        action: FeatureAction.PeekAhead,
                        peekers,
                    };
                }

                finalizeAndVisit();
                return FeatureResult.CommitUntilLast;
            }
        }

        while (state === NumberState.DecimalPart) {
            char = yield;

            if (char === undefined) {
                if (!foundDecimalDigit && (!this.settings.laxDecimal || skippedWholePart)) {
                    return () => 'unexpected end of file, expected a digit (0-9) for a decimal number (decimal part)';
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
                if (peekers !== undefined) {
                    yield {
                        action: FeatureAction.PeekAhead,
                        peekers,
                    };
                }

                finalizeAndVisit();
                return FeatureResult.CommitUntilLast;
            }
        }

        while (state === NumberState.ExponentPart) {
            char = yield;

            if (char === undefined) {
                if (!foundExponentDigit) {
                    return () => 'unexpected end of file, expected a digit (0-9) for a decimal number (exponent part)';
                }

                finalizeAndVisit();
                return FeatureResult.Commit;
            }

            if (anySign.test(char) && !foundExponentDigit) {
                if (foundExponentSign) {
                    return () => `expected '${char}' to be a digit (0-9) for decimal number (exponent part)`;
                }

                numberStr += char;

                foundExponentSign = true;
            } else if (anyDigit.test(char)) {
                numberStr += char;

                foundExponentDigit = true;
            } else {
                if (peekers !== undefined) {
                    yield {
                        action: FeatureAction.PeekAhead,
                        peekers,
                    };
                }

                finalizeAndVisit();
                return FeatureResult.CommitUntilLast;
            }
        }

        throw new Error('Unreachable statement');
    }
}
