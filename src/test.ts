import 'source-map-support/register';

import util from 'util';

import { parseAstMetadata, parseNoMetadata } from './test/parse';
import { stringifyNoMetadata } from './test/stringify';

const stringWithEverything = `
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
const stringWithNoInvisibles = '{"foo":"bar","foo2":"bar2","object":{"lol":"it works!!!","bool too":true,"and false":false,"null":null,"array test":["string",true],"numbers":[0,0,5,-5,60,3.14,-1.693,683600,1.5e-9,-40000000]}}';

const parsedNoMetadata = parseNoMetadata(stringWithEverything);
console.log('Parsed without metadata: ', parsedNoMetadata);

const parsedAstMetadata = parseAstMetadata(stringWithEverything);
console.log('Parsed with metadata: ', parsedAstMetadata[0]);
console.log('Metadata: ', util.inspect(parsedAstMetadata[1], { colors: true, depth: 20 }));

console.log('Testing parsing without invisibles');
parseNoMetadata(stringWithNoInvisibles);
console.log('passed');

const parsedAstBlankMetadata = parseAstMetadata(stringWithNoInvisibles);
console.log('Parsed with metadata, but has no invisibles: ', parsedAstBlankMetadata[0]);
console.log('Metadata: ', util.inspect(parsedAstMetadata[1], { colors: true, depth: 20 }));

const stringifiedWithoutMetadata = stringifyNoMetadata(parsedAstBlankMetadata[0]);

console.log('Stringifier round-trips without metadata: ', stringWithNoInvisibles === stringifiedWithoutMetadata);
