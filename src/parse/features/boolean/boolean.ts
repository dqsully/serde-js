import { Visitor } from '../../visitor/abstract';
import { AbstractFeature, AbstractFeatureParseReturn } from '../abstract';

const trueChars = 'true'.split('');
const falseChars = 'false'.split('');

interface Settings {}
export {
    Settings as BooleanFeatureSettings,
};

export default class BooleanFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    // We don't use `this` because there are no settings for `BooleanFeature`
    public* parse(firstChar: string, visitor: Visitor): AbstractFeatureParseReturn {
        let variant: string[];

        if (firstChar === 't') {
            variant = trueChars;
        } else if (firstChar === 'f') {
            variant = falseChars;
        } else {
            return () => `expected '${firstChar}' to be 't' or 'f' for 'true' or 'false'`;
        }

        let nextCharIndex = 1;
        let char: string | undefined;

        while (nextCharIndex < variant.length) {
            // Read next character
            char = yield;

            if (char === undefined) {
                return () => 'unexpected end of file';
            }
            if (char !== variant[nextCharIndex]) {
                return () => `expected '${char}' to be '${variant[nextCharIndex]}' for '${variant.join('')}'`;
            }

            nextCharIndex += 1;
        }

        visitor.impl.visitValue(visitor.context, variant === trueChars);

        // Commit all parsed chars
        return true;
    }
}
