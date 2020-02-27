import util from 'util';

import intoString from '../stringify/sink/string';
import { doubleQuotedStringDefaultFeature } from '../stringify/features/string/double-quoted';
import { TokenFeatures } from '../stringify/sink/common';
import { createRootFeature } from '../stringify/features/other/root';
import { anyWhitespaceFeature } from '../stringify/features/whitespace/any';
import { createStrictCommaObjectDefaultFeature } from '../stringify/features/object/strict-comma';
import { createStrictCommaArrayDefaultFeature } from '../stringify/features/array/strict-comma';
import noMetadataTokenizer from '../stringify/tokenizer/no-metadata';
import { decimalNumberDefaultFeature } from '../stringify/features/number/decimal';
import { singleQuotedStringDefaultFeature } from '../stringify/features/string/single-quoted';
import { nullDefaultFeature } from '../stringify/features/other/null';
import { booleanDefaultFeature } from '../stringify/features/boolean/boolean';

const invisibleFeatures = [
    anyWhitespaceFeature,
];

const valueFeatures = [
    nullDefaultFeature,
    booleanDefaultFeature,
    doubleQuotedStringDefaultFeature,
    singleQuotedStringDefaultFeature,
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

// eslint-disable-next-line import/prefer-default-export
export function stringifyNoMetadata(data: any): string {
    return intoString(data, noMetadataTokenizer, features);
}
