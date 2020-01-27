import { Visitor } from '../../visitor/abstract';
import { AbstractFeature, AbstractFeatureParseReturn } from '../abstract';
import { unescape } from '../../../util/escape';

interface Settings {}
export {
    Settings as DoubleQuotedStringFeatureSettings,
};

// TODO: store string type in metadata
export default class DoubleQuotedStringFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    // We don't use `this` because there are no settings for `DoubleQuotedStringFeature`
    // eslint-disable-next-line class-methods-use-this
    public* parse(firstChar: string, visitor: Visitor): AbstractFeatureParseReturn {
        if (firstChar !== '"') {
            return () => `expected '${firstChar}' to be '"' for a double-quoted string`;
        }

        const parser = unescape();

        let char: string | undefined;
        let parseResult = parser.next();

        while (true) {
            char = yield;

            if (parseResult.done) {
                throw new Error('Unescape parser completed early');
            }

            if (!parseResult.value && char === '"') {
                // Complete parsing
                const output = parser.next();

                if (!output.done) {
                    throw new Error("Unescape parser didn't complete properly");
                }

                visitor.impl.visitValue(visitor.context, output.value);

                return true;
            }

            if (char === undefined) {
                return () => 'unexpected end of file';
            }

            parseResult = parser.next(char);
        }
    }
}
