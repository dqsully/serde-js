import { Visitor, Visitors } from '../../visitor/abstract';
import {
    AbstractFeature, AbstractFeatureParseReturn, FeatureResult, FeatureAction,
} from '../abstract';

interface Settings {
    whitespace: AbstractFeature[];
    valueFeatures: AbstractFeature[];
}
export {
    Settings as LaxCommaArrayFeatureSettings,
};

export default class LaxCommaArrayFeature extends AbstractFeature<Settings> {
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

        let char: string | undefined;

        // Parse any whitespace
        char = yield {
            action: FeatureAction.ParseChild,
            features: this.settings.whitespace,
            visitor: arrVisitor,
            commitUntilNow: true,
            whitespaceMode: true,
        };

        if (char !== ']') {
            while (true) {
                // Parse a value
                yield {
                    action: FeatureAction.ParseChild,
                    features: this.settings.valueFeatures,
                    visitor: arrVisitor,
                    commitUntilNow: false,
                };

                // Parse any whitespace
                char = yield {
                    action: FeatureAction.ParseChild,
                    features: this.settings.whitespace,
                    visitor: arrVisitor,
                    commitUntilNow: false,
                    whitespaceMode: true,
                };

                if (char === ']') {
                    break;
                } else if (char !== ',') {
                    return () => `expected '${char}' to be ',' or ']' for a lax-comma array`;
                }

                visitors.array.markNextValue(arrContext);

                // Parse any whitespace
                char = yield {
                    action: FeatureAction.ParseChild,
                    features: this.settings.whitespace,
                    visitor: arrVisitor,
                    commitUntilNow: true,
                    whitespaceMode: true,
                };

                if (char === ']') {
                    break;
                }
            }
        }

        const value = visitors.array.finalize(arrContext);
        visitor.impl.setMetadata(visitor.context, 'array.type', 'lax-comma');
        visitor.impl.visitValue(visitor.context, value);

        return FeatureResult.Commit;
    }
}
