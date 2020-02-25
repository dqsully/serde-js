import { Visitor } from '../../visitor/abstract';
import { AbstractFeature, AbstractFeatureParseReturn } from '../abstract';

interface Settings {}
export {
    Settings as AnyWhitespaceFeatureSettings,
};

export default class AnyWhitespaceFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    // We don't use `this` because there are no settings for `BooleanFeature`
    // eslint-disable-next-line class-methods-use-this
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

                return false;
            }

            whitespace += char;
        }
    }
}
