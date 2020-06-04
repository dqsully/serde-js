import parseString from '../parse/source/string';
import noMetadata from '../parse/visitor/no-metadata';
import astMetadata from '../parse/visitor/ast-metadata';
import wrappedMetadata, { WrappedAny } from '../parse/visitor/wrapped-metadata';
import BooleanFeature from '../parse/features/boolean/boolean';
import DoubleSlashCommentFeature from '../parse/features/comment/double-slash';
import DoubleDashCommentFeature from '../parse/features/comment/double-dash';
import HashCommentFeature from '../parse/features/comment/hash';
import SlashStarCommentFeature from '../parse/features/comment/slash-star';
import RootFeature from '../parse/features/other/root';
import AnyWhitespaceFeature from '../parse/features/whitespace/any';
import DoubleQuotedStringFeature from '../parse/features/string/double-quoted';
import SingleQuotedStringFeature from '../parse/features/string/single-quoted';
import StrictCommaObjectFeature from '../parse/features/object/strict-comma';
import { AbstractFeature } from '../parse/features/abstract';
import NullFeature from '../parse/features/other/null';
import StrictCommaArrayFeature from '../parse/features/array/strict-comma';
import DecimalNumberFeature from '../parse/features/number/decimal';


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
    new DecimalNumberFeature({}),
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

const rootFeatures = [
    new RootFeature({
        whitespace,
        rootFeatures: valueFeatures,
    }),
];

export function parseNoMetadata(data: string): any {
    const noMetadataVisitor = {
        context: noMetadata.root.initialize(),
        impl: noMetadata.root,
    };

    return parseString(data, noMetadataVisitor, rootFeatures, noMetadata);
}

export function parseAstMetadata(data: string): any {
    const astMetadataVisitor = {
        context: astMetadata.root.initialize(),
        impl: astMetadata.root,
    };

    return parseString(data, astMetadataVisitor, rootFeatures, astMetadata);
}

export function parseWrappedMetadata(data: string): WrappedAny {
    const wrappedMetadataVisitor = {
        context: wrappedMetadata.root.initialize(),
        impl: wrappedMetadata.root,
    };

    return parseString(data, wrappedMetadataVisitor, rootFeatures, wrappedMetadata);
}
