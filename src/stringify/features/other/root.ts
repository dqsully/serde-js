import { TokenType } from '../../tokenizer/abstract';
import { InvisibleFeature, RootFeature, runInvisibles } from '../abstract';

// eslint-disable-next-line import/prefer-default-export
export function createRootFeature(
    invisibleFeatures: InvisibleFeature[],
): RootFeature {
    return function* rootFeature() {
        let token = yield '';

        // Chomp invisibles
        while (token.type === TokenType.Invisible) {
            token = yield runInvisibles(invisibleFeatures, token) || '';
        }

        // Token must be a data token, consume it
        token = yield '';

        // Chomp invisibles
        while (token.type === TokenType.Invisible) {
            token = yield runInvisibles(invisibleFeatures, token) || '';
        }

        return undefined;
    };
}
