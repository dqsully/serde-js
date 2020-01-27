// import { Visitor } from '../../visitor/abstract';
import { AbstractFeature, AbstractFeatureParseReturn } from '../abstract';

interface Settings {}
export {
    Settings as SlashStarCommentFeatureSettings,
};

// TODO: store comments in metadata
export default class SlashStarCommentFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    // We don't use `this` because there are no settings for `BooleanFeature`
    // eslint-disable-next-line class-methods-use-this
    public* parse(firstChar: string/* , visitor: Visitor */): AbstractFeatureParseReturn {
        if (firstChar !== '/') {
            return () => `expected '${firstChar}' to be '/' for '/* (comment) */'`;
        }

        let char: string | undefined;
        let lastChar: string | undefined;

        char = yield;

        if (char !== '*') {
            return () => `expected '${char}' to be '*' for '/* (comment) */'`;
        }

        while (true) {
            char = yield;

            if (char === undefined) {
                return true;
            }
            if (lastChar === '*' && char === '/') {
                return true;
            }

            lastChar = char;
        }
    }
}
