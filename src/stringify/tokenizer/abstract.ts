import { MetadataValue, MetadataMap } from '../../types/metadata';

export enum TokenType {
    Invisible,
    Value,
    Object,
    Array,

    ObjectEnd,
    ArrayEnd,
    Separator,

    KeyPlaceholder,
    DataPlaceholder,
}

export interface InvisibleToken {
    type: TokenType.Invisible;

    kind: string;
    data: MetadataValue;
}

export interface TokenMetadata {
    meta?: MetadataMap;
}

export interface ValueToken extends TokenMetadata {
    type: TokenType.Value;

    value: any;
}

export interface ObjectToken extends TokenMetadata {
    type: TokenType.Object;
}

export interface ArrayToken extends TokenMetadata {
    type: TokenType.Array;
}

export type DataToken = ValueToken | ObjectToken | ArrayToken;

export interface ObjectEndToken {
    type: TokenType.ObjectEnd;
}

export interface ArrayEndToken {
    type: TokenType.ArrayEnd;
}

export interface SeparatorToken {
    type: TokenType.Separator;
}

export interface KeyPlaceholderToken {
    type: TokenType.KeyPlaceholder;
}

export interface DataPlaceholderToken {
    type: TokenType.DataPlaceholder;
}

export type AnyToken =
    | InvisibleToken
    | DataToken
    | ObjectEndToken
    | ArrayEndToken
    | SeparatorToken;

export type TokenizerReturn = Generator<
    AnyToken,
    void,
    void
>;

export type Tokenizer = (data: any) => TokenizerReturn;
