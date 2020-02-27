import { Visitor, Visitors } from '../../visitor/abstract';
import {
    AbstractFeature, AbstractFeatureParseReturn, FeatureResult, FeatureAction,
} from '../abstract';

interface Settings {
    whitespace: AbstractFeature[];
    keyFeatures: AbstractFeature[];
    valueFeatures: AbstractFeature[];
}
export {
    Settings as StrictCommaObjectFeatureSettings,
};

// TODO: store comments in metadata
export default class StrictCommaObjectFeature extends AbstractFeature<Settings> {
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
        if (firstChar !== '{') {
            return () => `expected '${firstChar}' to be '{' for an object`;
        }

        const objContext = visitors.object.initialize(visitor.context);
        const objVisitor = {
            context: objContext,
            impl: visitors.object,
        };

        let keyVisitor;
        let char: string | undefined;

        while (true) {
            keyVisitor = visitors.object.seedKey(objContext);

            // Parse any whitespace
            char = yield {
                action: FeatureAction.ParseChild,
                features: this.settings.whitespace,
                visitor: keyVisitor,
                commitUntilNow: true,
                whitespaceMode: true,
            };

            if (char === '}') {
                keyVisitor.impl.abort(keyVisitor.context);
                break;
            }

            // Parse a key
            yield {
                action: FeatureAction.ParseChild,
                features: this.settings.keyFeatures,
                visitor: keyVisitor,
                commitUntilNow: false,
            };

            // Parse any whitespace
            char = yield {
                action: FeatureAction.ParseChild,
                features: this.settings.whitespace,
                visitor: keyVisitor,
                commitUntilNow: false,
                whitespaceMode: true,
            };

            // Finalize the key
            keyVisitor.impl.finalize(keyVisitor.context);

            // Parse the colon
            if (char !== ':') {
                return () => `expected '${char}' to be ':' for a strict-comma object`;
            }

            // Parse any whitespace
            yield {
                action: FeatureAction.ParseChild,
                features: this.settings.whitespace,
                visitor: objVisitor,
                commitUntilNow: true,
                whitespaceMode: true,
            };

            // Parse a value
            yield {
                action: FeatureAction.ParseChild,
                features: this.settings.valueFeatures,
                visitor: objVisitor,
                commitUntilNow: false,
            };

            // Parse any whitespace
            char = yield {
                action: FeatureAction.ParseChild,
                features: this.settings.whitespace,
                visitor: objVisitor,
                commitUntilNow: false,
                whitespaceMode: true,
            };

            if (char === '}') {
                break;
            } else if (char !== ',') {
                return () => `expected '${char}' to be ',' or '}' for a strict-comma object`;
            }
        }

        const value = visitors.object.finalize(objContext);
        visitor.impl.setMetadata(visitor.context, 'object.type', 'strict-comma');
        visitor.impl.visitValue(visitor.context, value);

        return FeatureResult.Commit;
    }
}
