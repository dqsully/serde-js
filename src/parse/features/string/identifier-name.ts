import { Visitor, Visitors } from '../../visitor/abstract';
import {
    AbstractFeature, AbstractFeatureParseReturn, FeatureResult, PeekAhead,
} from '../abstract';
import isIdStart from '../../../util/id-start';
import isIdContinue from '../../../util/id-continue';
import isHexChar from '../../../util/is-hex';

interface Settings {}
export {
    Settings as IdentifierNameStringFeatureSettings,
};

// See https://tc39.es/ecma262/#prod-IdentifierName
export default class IdentifierNameStringFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    // We don't use `this` because there are no settings for `IdentifierNameStringFeature`
    // eslint-disable-next-line class-methods-use-this
    public* parse(
        firstChar: string,
        visitor: Visitor,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _visitors: Visitors,
        peekFinalizers?: PeekAhead,
    ): AbstractFeatureParseReturn {
        let char: string | undefined = firstChar;
        let output = '';
        let first = true;

        while (true) {
            if (char === '\\') {
                char = yield;
                if (char !== 'u') {
                    return () => `expected '${char}' to be 'u' for a unicode escape`;
                }

                let num;
                let numText;

                char = yield;
                if (char === '{') {
                    numText = '';

                    while (true) {
                        char = yield;

                        if (char === undefined) {
                            return () => 'unexpected end of file in unicode escape';
                        }
                        if (char === '}') {
                            break;
                        }
                        if (!isHexChar(char)) {
                            return () => `expected '${char}' to be a hexadecimal digit for a unicode escape`;
                        }

                        numText += char;

                        if (numText.length > 6) {
                            return () => `expected '${char}' to be '}' to end a unicode escape (6 digits max)`;
                        }
                    }

                    num = Number.parseInt(numText, 16);

                    if (num > 0x10FFFF) {
                        return () => `expected '${numText}' to be less than or equal to 0x10FFFF`;
                    }
                } else if (isHexChar(char)) {
                    numText = char;

                    for (let i = 0; i < 3; i += 1) {
                        char = yield;

                        if (char === undefined) {
                            return () => 'unexpected end of file in unicode escape';
                        }
                        if (!isHexChar(char)) {
                            return () => `expected '${char}' to be a hexadecimal digit`;
                        }

                        numText += char;
                    }

                    num = Number.parseInt(numText, 16);
                } else {
                    return () => `expected '${char}' to be '{' or a hexadecimal digit for a unicode escape`;
                }

                if (first) {
                    if (!isIdStart(num)) {
                        return () => `expected 0x${numText} to be a unicode code point with the property ID_Start`;
                    }
                } else {
                    if (!isIdContinue(num)) {
                        return () => `expected 0x${numText} to be a unicode code point with the property ID_Continue`;
                    }
                }

                output += String.fromCodePoint(num);
            } else if (char === '$' || char === '_') {
                output += char;
            } else {
                const codepoint = char.codePointAt(0);

                if (first && isIdStart(codepoint)) {
                    output += char;
                } else if (
                    !first
                    && (char === '\u200C' || char === '\u200D' || isIdContinue(codepoint))
                ) {
                    output += char;
                } else if (first) {
                    return () => `expected ${char} to be '$', '_', '\\', or a valid unicode ID_Start codepoint`;
                } else {
                    // eslint-disable-next-line max-len
                    // return () => `expected ${char} to be '$', '_', '\\', <ZWNJ>, <ZWJ>, or a valid unicode ID_Continue codepoint`;

                    // There's nothing to tell us when an identifier-name is
                    // over, so we assume it's over on the first error that can
                    // also end it
                    break;
                }
            }

            char = yield;
            first = false;
        }

        if (peekFinalizers !== undefined) {
            yield peekFinalizers;
        }

        visitor.impl.visitValue(visitor.context, output);
        visitor.impl.setMetadata(visitor.context, 'string.type', 'identifier-name');

        if (peekFinalizers !== undefined) {
            return FeatureResult.CommitUntilLast;
        }

        return FeatureResult.Commit;
    }
}