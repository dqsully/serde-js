import AnyWhitespaceFeature from '../whitespace/any';
import { AbstractFeature } from '../abstract';
import NullFeature from '../other/null';
import BooleanFeature from '../boolean/boolean';
import DoubleQuotedStringFeature from '../string/double-quoted';
import StrictCommaObjectFeature from '../object/strict-comma';
import StrictCommaArrayFeature from '../array/strict-comma';
import RootFeature from '../other/root';
import DecimalNumberFeature from '../number/decimal';

const whitespace: AbstractFeature[] = [
    new AnyWhitespaceFeature(),
];

const valueFeatures: AbstractFeature[] = [
    new NullFeature(),
    new BooleanFeature(),
    new DoubleQuotedStringFeature(),
    new DecimalNumberFeature({}),
    // StrictCommaObjectFeature (placeholder)
    // StrictCommaArrayFeature (placeholder)
];

const keyFeatures: AbstractFeature[] = [
    new DoubleQuotedStringFeature(),
];

valueFeatures.push(
    new StrictCommaObjectFeature({
        keyFeatures,
        valueFeatures,
        whitespace,
    }),
);

valueFeatures.push(
    new StrictCommaArrayFeature({
        valueFeatures,
        whitespace,
    }),
);

const jsonParsePreset = [
    new RootFeature({
        whitespace,
        rootFeatures: valueFeatures,
    }),
];

export default jsonParsePreset;
