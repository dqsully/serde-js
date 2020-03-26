import intoString from '../stringify/sink/string';
import { doubleQuotedStringDefaultFeature } from '../stringify/features/string/double-quoted';
import { TokenFeatures } from '../stringify/sink/common';
import { createRootFeature } from '../stringify/features/other/root';
import { anyWhitespaceFeature } from '../stringify/features/whitespace/any';
import { createStrictCommaObjectDefaultFeature } from '../stringify/features/object/strict-comma';
import { createStrictCommaArrayDefaultFeature } from '../stringify/features/array/strict-comma';
import noMetadataTokenizer from '../stringify/tokenizer/no-metadata';
import { decimalNumberDefaultFeature } from '../stringify/features/number/decimal';
import { singleQuotedStringFeature } from '../stringify/features/string/single-quoted';
import { nullDefaultFeature } from '../stringify/features/other/null';
import { booleanDefaultFeature } from '../stringify/features/boolean/boolean';
import wrappedMetadataTokenizer from '../stringify/tokenizer/wrapped-metadata';
import { WrappedAny } from '../parse/visitor/wrapped-metadata';
import { doubleSlashCommentFeature } from '../stringify/features/comment/double-slash';
import { doubleDashCommentFeature } from '../stringify/features/comment/double-dash';
import { hashCommentFeature } from '../stringify/features/comment/hash';
import { slashStarCommentFeature } from '../stringify/features/comment/slash-star';

const invisibleFeatures = [
    anyWhitespaceFeature,
    doubleSlashCommentFeature,
    doubleDashCommentFeature,
    hashCommentFeature,
    slashStarCommentFeature,
];

const valueFeatures = [
    nullDefaultFeature,
    booleanDefaultFeature,
    singleQuotedStringFeature,
    doubleQuotedStringDefaultFeature,
    decimalNumberDefaultFeature,
];
const objectFeatures = [
    createStrictCommaObjectDefaultFeature(invisibleFeatures),
];
const arrayFeatures = [
    createStrictCommaArrayDefaultFeature(invisibleFeatures),
];

const features: TokenFeatures = {
    value: valueFeatures,
    object: objectFeatures,
    array: arrayFeatures,
    root: createRootFeature(invisibleFeatures),
};

export function stringifyNoMetadata(data: any): string {
    return intoString(data, noMetadataTokenizer, features);
}

export function stringifyWrappedMetadata(data: WrappedAny): string {
    return intoString(data, wrappedMetadataTokenizer, features);
}
