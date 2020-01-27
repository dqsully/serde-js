import { Visitor } from '../../visitor/abstract';
import { AbstractFeature, AbstractFeatureParseReturn } from '../abstract';

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

    // We don't use `this` because there are no settings for `BooleanFeature`
    // eslint-disable-next-line class-methods-use-this
    public* parse(_firstChar: string, visitor: Visitor): AbstractFeatureParseReturn {
        if (this.settings.whitespace.length > 0) {
            // Try and parse whitespace first
            yield {
                features: this.settings.whitespace,
                visitor,
                commitUntilNow: false,
                whitespaceMode: true,
            };
        }

        // Parse the root feature
        let char = yield {
            features: this.settings.rootFeatures,
            visitor,
            commitUntilNow: false,
        };

        if (char !== undefined && this.settings.whitespace.length > 0) {
            // Try and finish with whitespace
            char = yield {
                features: this.settings.whitespace,
                visitor,
                commitUntilNow: false,
                whitespaceMode: true,
            };
        }

        if (char !== undefined) {
            return () => `expected '${char}' to be end of file `;
        }

        return false;
    }
}
