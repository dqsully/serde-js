import type {} from 'mocha';

import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import parseString from '../../source/string';
import noMetadata from '../../visitor/no-metadata';
import json5ParsePreset from './json5';

function loadAsset(name: string): string {
    return fs.readFileSync(path.join(__dirname, 'json5.test', name), 'utf8');
}

describe('json5 preset', () => {
    it('parses website example', () => {
        // Given
        const input = loadAsset('website-example.json5');
        const rootVisitor = {
            context: noMetadata.root.initialize(),
            impl: noMetadata.root,
        };

        // When
        const result = parseString(
            input,
            rootVisitor,
            json5ParsePreset,
            noMetadata,
        );

        // Then
        expect(result).to.deep.equal({
            unquoted: 'and you can quote me on that',
            singleQuotes: 'I can use "double quotes" here',
            lineBreaks: "Look, Mom! No \\n's!",
            hexadecimal: 0xdecaf,
            leadingDecimalPoint: 0.8675309,
            andTrailing: 8675309,
            positiveSign: 1,
            trailingComma: 'in objects',
            andIn: ['arrays'],
            backwardsCompatible: 'with JSON',

            infinity: Infinity,
            negativeInfinity: -Infinity,
            nan: NaN,
        });
    });
});
