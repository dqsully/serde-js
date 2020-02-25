import 'source-map-support/register';

import util from 'util';

import parseString from './parse/source/string';
import noMetadata from './parse/visitor/no-metadata';
import astMetadata from './parse/visitor/ast-metadata';
import BooleanFeature from './parse/features/boolean/boolean';
import DoubleSlashCommentFeature from './parse/features/comment/double-slash';
import DoubleDashCommentFeature from './parse/features/comment/double-dash';
import HashCommentFeature from './parse/features/comment/hash';
import SlashStarCommentFeature from './parse/features/comment/slash-star';
import RootFeature from './parse/features/other/root';
import AnyWhitespaceFeature from './parse/features/whitespace/any';
import DoubleQuotedStringFeature from './parse/features/string/double-quoted';
import SingleQuotedStringFeature from './parse/features/string/single-quoted';
import StrictCommaObjectFeature from './parse/features/object/strict-comma';
import { AbstractFeature } from './parse/features/abstract';
import NullFeature from './parse/features/other/null';
import StrictCommaArrayFeature from './parse/features/array/strict-comma';
import DecimalNumberFeature from './parse/features/number/decimal';

const whitespace: AbstractFeature[] = [
    new AnyWhitespaceFeature(),
    new DoubleSlashCommentFeature(),
    new DoubleDashCommentFeature(),
    new HashCommentFeature(),
    new SlashStarCommentFeature(),
];

const valueFeatures: AbstractFeature[] = [
    new NullFeature(),
    new BooleanFeature(),
    new DoubleQuotedStringFeature(),
    new SingleQuotedStringFeature(),
    new DecimalNumberFeature(),
    // StrictCommaObjectFeature (placeholder)
    // StrictCommaArrayFeature (placeholder)
];
const keyFeatures: AbstractFeature[] = [
    new DoubleQuotedStringFeature(),
    new SingleQuotedStringFeature(),
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

const data = `
{
    // line comment
    "foo" /* in the weird places */ : "bar" /* yup weird */,
    'foo2': "bar2",
    "object": {
        "lol": "it works!!!",

        "bool too": true,
        "and false": false,

        "null": null,

        "array test": [
            // comment here
            'string',
            # comment there
            true
            -- comment everywhere!!!
        ],

        'numbers': [
            0,
            -0,
            5,
            -5,
            60,
            3.14,
            -1.693,
            6.836e5,
            15E-10,
            -4e7
        ]
    }
}
`;
const noMetadataVisitor = {
    context: noMetadata.root.initialize(),
    impl: noMetadata.root,
};
const astMetadataVisitor = {
    context: astMetadata.root.initialize(),
    impl: astMetadata.root,
};
const rootFeatures = [
    new RootFeature({
        whitespace,
        rootFeatures: valueFeatures,
    }),
];

console.log(parseString(data, noMetadataVisitor, rootFeatures, noMetadata));
console.log();

const [value, ast] = parseString(data, astMetadataVisitor, rootFeatures, astMetadata);
console.log(value);
console.log();
console.log(util.inspect(ast, { colors: true, depth: 20 }));
