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
    undefined,
    InvisibleToken | KeyPlaceholderToken | DataPlaceholderToken | ObjectEndToken | SeparatorToken
>;

export type ArrayFeature = (token: ArrayToken) => Generator<
    string,
    undefined,
    InvisibleToken | DataPlaceholderToken | ArrayEndToken | SeparatorToken
>;
