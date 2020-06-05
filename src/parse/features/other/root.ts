import { Visitor } from '../../visitor/abstract';
import {
    AbstractFeature, AbstractFeatureParseReturn, FeatureResult, FeatureAction,
} from '../abstract';

interface Settings {
    whitespace: AbstractFeature[];
    rootFeatures: AbstractFeature[];
}
export {
    Settings as RootFeatureSettings,
};

export default class RootFeature extends AbstractFeature<Settings> {
    public settings: Settings;

    constructor(settings: Settings) {
        super();
        this.settings = settings;
    }

    public* parse(_firstChar: string, visitor: Visitor): AbstractFeatureParseReturn {
        if (this.settings.whitespace.length > 0) {
            // Try and parse whitespace first
            yield {
                action: FeatureAction.ParseChild,
                features: this.settings.whitespace,
                visitor,
                commitUntilNow: false,
                whitespaceMode: true,
            };
        }

        // Parse the root feature
        let char = yield {
            action: FeatureAction.ParseChild,
            features: this.settings.rootFeatures,
            visitor,
            commitUntilNow: false,
        };

        if (char !== undefined && this.settings.whitespace.length > 0) {
            // Try and finish with whitespace
            char = yield {
                action: FeatureAction.ParseChild,
                features: this.settings.whitespace,
                visitor,
                commitUntilNow: false,
                whitespaceMode: true,
            };
        }

        if (char !== undefined) {
            return () => `expected '${char}' to be end of file `;
        }

        return FeatureResult.Ignore;
    }
}
