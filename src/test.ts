import 'source-map-support/register';

import parseString from './parse/source/string';
import noMetadata from './parse/visitor/no-metadata';
import BooleanFeature from './parse/features/boolean/boolean';
import DoubleSlashCommentFeature from './parse/features/comment/double-slash';
import DoubleDashCommentFeature from './parse/features/comment/double-dash';
import HashCommentFeature from './parse/features/comment/hash';
import SlashStarCommentFeature from './parse/features/comment/slash-star';
import RootFeature from './parse/features/other/root';
import AnyWhitespaceFeature from './parse/features/whitespace/any';
import DoubleQuotedStringFeature from './parse/features/string/double-quoted';
import StrictCommaObjectFeature from './parse/features/object/strict-comma';
import { AbstractFeature } from './parse/features/abstract';

const whitespace: AbstractFeature[] = [
    new AnyWhitespaceFeature(),
    new DoubleSlashCommentFeature(),
    new DoubleDashCommentFeature(),
    new HashCommentFeature(),
    new SlashStarCommentFeature(),
];

const valueFeatures: AbstractFeature[] = [
    new BooleanFeature(),
    new DoubleQuotedStringFeature(),
    // StrictCommaObjectFeature
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

const data = `
{
    // line comment
    "foo" /* in the weird places */ : "bar" /* yup weird */,
    "foo2": "bar2",
    "object": {
        "lol": "it works!!!",
        "bool too": true,
        "and false": false
    }
}
`;
const visitor = {
    context: noMetadata.value.initialize(),
    impl: noMetadata.value,
};
const rootFeatures = [
    new RootFeature({
        whitespace,
        rootFeatures: valueFeatures,
    }),
];

console.log(parseString(data, visitor, rootFeatures, noMetadata));
