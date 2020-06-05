import { Visitor } from '../../visitor/abstract';
import { AbstractFeature, AbstractFeatureParseReturn, FeatureResult } from '../abstract';

interface Settings {}
export {
    Settings as AnyWhitespaceFeatureSettings,
};

export default class AnyWhitespaceFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    public* parse(firstChar: string, visitor: Visitor): AbstractFeatureParseReturn {
        if (
            firstChar !== ' '
            && firstChar !== '\t'
            && firstChar !== '\n'
            && firstChar !== '\r'
        ) {
            return () => `expected '${firstChar}' to be whitespace`;
        }

        let char: string | undefined;
        let whitespace = firstChar;

        while (true) {
            char = yield true;

            if (
                char !== ' '
                && char !== '\t'
                && char !== '\n'
                && char !== '\r'
            ) {
                visitor.impl.pushInvisible(visitor.context, 'whitespace', whitespace);

                return FeatureResult.Ignore;
            }

            whitespace += char;
        }
    }
}
