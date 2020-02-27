import {
    ArrayToken,
    TokenType,
} from '../../tokenizer/abstract';
import { InvisibleFeature, ArrayFeature, runInvisibles } from '../abstract';

export function createStrictCommaArrayDefaultFeature(
    invisibleFeatures: InvisibleFeature[],
): ArrayFeature {
    return function* strictCommaObjectDefaultFeature() {
        let token = yield '[';

        // Chomp invisibles
        while (token.type === TokenType.Invisible) {
            token = yield runInvisibles(invisibleFeatures, token) || '';
        }

        // Allow array end token
        if (token.type === TokenType.ArrayEnd) {
            return ']';
        }

        while (true) {
            // Expect a data token
            if (token.type !== TokenType.DataPlaceholder) {
                throw new Error(`Expected an array end or data placeholder token, got ${TokenType[token.type]}`);
            }

            // Consume data token
            token = yield '';

            // Chomp invisibles
            while (token.type === TokenType.Invisible) {
                token = yield runInvisibles(invisibleFeatures, token) || '';
            }

            // Allow array end token
            if (token.type === TokenType.ArrayEnd) {
                return ']';
            }

            // Expect separator token
            if (token.type !== TokenType.Separator) {
                throw new Error(`Expected an array end or separator token, got ${TokenType[token.type]}`);
            }

            // Print value separator
            token = yield ',';

            // Chomp invisibles
            while (token.type === TokenType.Invisible) {
                token = yield runInvisibles(invisibleFeatures, token) || '';
            }
        }
    };
}

export function createStrictCommaArrayFeature(
    invisibleFeatures: InvisibleFeature[],
): ArrayFeature {
    const defaultFeature = createStrictCommaArrayDefaultFeature(
        invisibleFeatures,
    );

    return (token: ArrayToken) => {
        if (token.meta?.['array.type'] !== 'strict-comma') {
            return undefined;
        }

        return defaultFeature(token);
    };
}
