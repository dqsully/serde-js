import {
    InvisibleToken,
    ValueToken,
    ObjectToken,
    ObjectEndToken,
    SeparatorToken,
    ArrayEndToken,
    ArrayToken,
    DataPlaceholderToken,
    KeyPlaceholderToken,
} from '../tokenizer/abstract';

export type RootFeature = () => Generator<
    string,
    undefined,
    InvisibleToken | DataPlaceholderToken
>;

export type InvisibleFeature = (token: InvisibleToken) => string | undefined;

export type ValueFeature = (token: ValueToken) => string | undefined;

export type ObjectFeature = (token: ObjectToken) => Generator<
    string,
    string | undefined,
    InvisibleToken | KeyPlaceholderToken | DataPlaceholderToken | ObjectEndToken | SeparatorToken
> | undefined;

export type ArrayFeature = (token: ArrayToken) => Generator<
    string,
    string | undefined,
    InvisibleToken | DataPlaceholderToken | ArrayEndToken | SeparatorToken
> | undefined;

export function runInvisibles(
    features: InvisibleFeature[],
    token: InvisibleToken,
): string | undefined {
    let feature;
    let result;

    for (feature of features) {
        result = feature(token);

        if (result !== undefined) {
            return result;
        }
    }

    return undefined;
}
