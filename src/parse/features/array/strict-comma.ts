import { Visitor, Visitors } from '../../visitor/abstract';
import { AbstractFeature, AbstractFeatureParseReturn, FeatureResult } from '../abstract';

interface Settings {
    whitespace: AbstractFeature[];
    valueFeatures: AbstractFeature[];
}
export {
    Settings as StrictCommaArrayFeatureSettings,
};

// TODO: store comments in metadata
export default class StrictCommaArrayFeature extends AbstractFeature<Settings> {
    public settings: Settings;

    constructor(settings: Settings) {
        super();
        this.settings = settings;
    }

    public* parse(
        firstChar: string,
        visitor: Visitor,
        visitors: Visitors,
    ): AbstractFeatureParseReturn {
        if (firstChar !== '[') {
            return () => `expected '${firstChar}' to be '[' for an array`;
        }

        const arrContext = visitors.array.initialize(visitor.context);
        const arrVisitor = {
            context: arrContext,
            impl: visitors.array,
        };

        // Parse any whitespace
        yield {
            features: this.settings.whitespace,
            visitor: arrVisitor,
            commitUntilNow: true,
            whitespaceMode: true,
        };

        let char = yield;

        if (char !== ']') {
            while (true) {
                // Parse a value
                yield {
                    features: this.settings.valueFeatures,
                    visitor: arrVisitor,
                    commitUntilNow: false,
                };

                // Parse any whitespace
                char = yield {
                    features: this.settings.whitespace,
                    visitor: arrVisitor,
                    commitUntilNow: false,
                    whitespaceMode: true,
                };

                if (char === ']') {
                    break;
                } else if (char !== ',') {
                    return () => `expected '${char}' to be ',' or ']' for a strict-comma array`;
                }

                visitors.array.markNextValue(arrContext);

                // Parse any whitespace
                yield {
                    features: this.settings.whitespace,
                    visitor: arrVisitor,
                    commitUntilNow: true,
                    whitespaceMode: true,
                };
            }
        }

        const value = visitors.array.finalize(arrContext);
        visitor.impl.visitValue(visitor.context, value);

        return FeatureResult.Commit;
    }
}
