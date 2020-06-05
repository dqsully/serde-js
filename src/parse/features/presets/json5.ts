import { AbstractFeature } from '../abstract';
import AnyWhitespaceFeature from '../whitespace/any';
import DoubleSlashCommentFeature from '../comment/double-slash';
import SlashStarCommentFeature from '../comment/slash-star';
import NullFeature from '../other/null';
import BooleanFeature from '../boolean/boolean';
import DoubleQuotedStringFeature from '../string/double-quoted';
import DecimalNumberFeature from '../number/decimal';
import IdentifierNameStringFeature from '../string/identifier-name';
import SingleQuotedStringFeature from '../string/single-quoted';
import LaxCommaObjectFeature from '../object/lax-comma';
import LaxCommaArrayFeature from '../array/lax-comma';
import RootFeature from '../other/root';
import InfinityFeature from '../number/infinity';
import NanFeature from '../number/nan';
import HexadecimalNumberFeature from '../number/hexadecimal';

const whitespace: AbstractFeature[] = [
    new AnyWhitespaceFeature(),
    new DoubleSlashCommentFeature(),
    new SlashStarCommentFeature(),
];

const valueFeatures: AbstractFeature[] = [
    new NullFeature(),
    new InfinityFeature(),
    new NanFeature(),
    new BooleanFeature(),
    new DoubleQuotedStringFeature(),
    new SingleQuotedStringFeature(),
    new HexadecimalNumberFeature(),
    new DecimalNumberFeature({
        canStartWithPlus: true,
        laxDecimal: true,
    }),
    // StrictCommaObjectFeature (placeholder)
    // StrictCommaArrayFeature (placeholder)
];

const keyFeatures: AbstractFeature[] = [
    new DoubleQuotedStringFeature(),
    new SingleQuotedStringFeature(),
    new IdentifierNameStringFeature(),
];

valueFeatures.push(
    new LaxCommaObjectFeature({
        keyFeatures,
        valueFeatures,
        whitespace,
    }),
);

valueFeatures.push(
    new LaxCommaArrayFeature({
        valueFeatures,
        whitespace,
    }),
);

const json5ParsePreset = [
    new RootFeature({
        whitespace,
        rootFeatures: valueFeatures,
    }),
];

export default json5ParsePreset;
