import { anyWhitespaceFeature } from '../whitespace/any';
import { nullDefaultFeature } from '../other/null';
import { booleanDefaultFeature } from '../boolean/boolean';
import { doubleQuotedStringDefaultFeature } from '../string/double-quoted';
import { singleQuotedStringFeature } from '../string/single-quoted';
import { decimalNumberDefaultFeature } from '../number/decimal';
import { createStrictCommaObjectDefaultFeature } from '../object/strict-comma';
import { createStrictCommaArrayDefaultFeature } from '../array/strict-comma';
import { TokenFeatures } from '../../sink/common';
import { createRootFeature } from '../other/root';
import { doubleSlashCommentDefaultFeature } from '../comment/double-slash';
import { slashStarCommentDefaultFeature } from '../comment/slash-star';

const invisibleFeatures = [
    anyWhitespaceFeature,
    doubleSlashCommentDefaultFeature,
    slashStarCommentDefaultFeature,
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

const jsonCStringifyPreset: TokenFeatures = {
    value: valueFeatures,
    object: objectFeatures,
    array: arrayFeatures,
    root: createRootFeature(invisibleFeatures),
};

export default jsonCStringifyPreset;
