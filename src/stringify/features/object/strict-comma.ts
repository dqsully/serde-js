import {
    ObjectToken,
    TokenType,
} from '../../tokenizer/abstract';
import { InvisibleFeature, ObjectFeature, runInvisibles } from '../abstract';

export function createStrictCommaObjectDefaultFeature(
    invisibleFeatures: InvisibleFeature[],
): ObjectFeature {
    return function* strictCommaObjectDefaultFeature() {
        let token = yield '{';

        // Chomp invisibles
        while (token.type === TokenType.Invisible) {
            token = yield runInvisibles(invisibleFeatures, token) || '';
        }

        // Allow object end token
        if (token.type === TokenType.ObjectEnd) {
            return '}';
        }

        while (true) {
            // Expect a key token
            if (token.type !== TokenType.KeyPlaceholder) {
                throw new Error(`Expected an object end or key placholder token, got ${TokenType[token.type]}`);
            }

            // Don't print anything before the key
            token = yield '';

            // Chomp invisibles
            while (token.type === TokenType.Invisible) {
                token = yield runInvisibles(invisibleFeatures, token) || '';
            }

            // Expect separator token
            if (token.type !== TokenType.Separator) {
                throw new Error(`Expected a separator token, got ${TokenType[token.type]}`);
            }

            // Print key/value separator
            token = yield ':';

            // Chomp invisibles
            while (token.type === TokenType.Invisible) {
                token = yield runInvisibles(invisibleFeatures, token) || '';
            }

            // Expect data token
            if (token.type !== TokenType.DataPlaceholder) {
                throw new Error(`Expected a data placeholder token, got ${TokenType[token.type]}`);
            }

            // Don't print anything before the value
            token = yield '';

            // Chomp invisibles
            while (token.type === TokenType.Invisible) {
                token = yield runInvisibles(invisibleFeatures, token) || '';
            }

            // Allow object end token
            if (token.type === TokenType.ObjectEnd) {
                return '}';
            }

            // Expect separator token
            if (token.type !== TokenType.Separator) {
                throw new Error(`Expected an object end or separator token, got ${TokenType[token.type]}`);
            }

            // Print property separator
            token = yield ',';

            // Chomp invisibles
            while (token.type === TokenType.Invisible) {
                token = yield runInvisibles(invisibleFeatures, token) || '';
            }
        }
    };
}

export function createStrictCommaObjectFeature(
    invisibleFeatures: InvisibleFeature[],
): ObjectFeature {
    const defaultFeature = createStrictCommaObjectDefaultFeature(
        invisibleFeatures,
    );

    return (token: ObjectToken) => {
        if (token.meta?.['object.type'] !== 'strict-comma') {
            return undefined;
        }

        return defaultFeature(token);
    };
}
