import util from 'util';

import intoString from '../stringify/sink/string';
import { TokenizerReturn, TokenType } from '../stringify/tokenizer/abstract';
import { doubleQuotedStringDefaultFeature } from '../stringify/features/string/double-quoted';
import { TokenFeatures } from '../stringify/sink/common';
import { ObjectFeature, ArrayFeature } from '../stringify/features/abstract';

function* fakeTokenizer(data: any): TokenizerReturn {
    yield {
        type: TokenType.Value,
        value: data,
    };
}

function* fakeRootFeature(): Generator<
    string,
    undefined,
    any
> {
    while (true) {
        yield '';
    }
}

const valueFeatures = [
    doubleQuotedStringDefaultFeature,
];
const objectFeatures: ObjectFeature[] = [];
const arrayFeatures: ArrayFeature[] = [];

const features: TokenFeatures = {
    value: valueFeatures,
    object: objectFeatures,
    array: arrayFeatures,
    root: fakeRootFeature,
};

const data = 'test string\nwith\tescapes, emoji (\ud83d\udc0e\ud83d\udc71\u2764🏳️‍🌈), unprintables(\uFFFF, \x1f) and others: \uD835\uDC68 Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘';

console.log(util.inspect(data, { colors: true }));
console.log(intoString(data, fakeTokenizer, features));
