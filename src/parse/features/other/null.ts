import { Visitor } from '../../visitor/abstract';
import { AbstractFeature, AbstractFeatureParseReturn } from '../abstract';

const nullChars = 'null'.split('');

interface Settings{}
export {
    Settings as NullFeatureSettings,
};

export default class NullFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    // We don't use `this` because there are no settings for `NullFeature`
    public* parse(firstChar: string, visitor: Visitor): AbstractFeatureParseReturn {
        if (firstChar !== 'n') {
            return () => `expected '${firstChar}' to be 'n' for 'null'`;
        }

        let char: string | undefined;

        for (let i = 1; i < nullChars.length; i += 1) {
            // Read next character
            char = yield;

            if (char === undefined) {
                return () => 'unexpected end of file';
            }
            if (char !== nullChars[i]) {
                return () => `expected '${char}' to be '${nullChars[i]}' for 'null'`;
            }
        }

        visitor.impl.visitValue(visitor.context, null);

        // Commit all parsed chars
        return true;
    }
}
