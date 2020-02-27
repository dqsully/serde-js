/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

const got = require('got');
const generateCheckScript = require('./generate-unicode-check');

function* getGraphemeExtendRanges(rawTable) {
    let line;
    let hashIndex;

    let codeRange;
    let property;
    let codeStart;
    let codeEnd;

    const lines = rawTable.split('\n');

    for (line of lines) {
        hashIndex = line.indexOf('#');

        if (hashIndex !== -1) {
            line = line.slice(0, hashIndex);
        }

        if (line.length === 0) {
            // eslint-disable-next-line no-continue
            continue;
        }

        ([codeRange, property] = line.split(';').map((s) => s.trim()));

        if (property.trim() !== 'Grapheme_Extend') {
            // eslint-disable-next-line no-continue
            continue;
        }

        if (codeRange.includes('..')) {
            ([codeStart, codeEnd] = codeRange.split('..').map((s) => parseInt(s, 16)));

            yield [codeStart, codeEnd + 1];
        } else {
            codeStart = parseInt(codeRange, 16);

            yield [codeStart, codeStart + 1];
        }
    }
}

(async () => {
    console.log('Donwloading table...');

    const rawTable = (await got(
        'https://www.unicode.org/Public/UCD/latest/ucd/DerivedCoreProperties.txt',
    )).body;

    console.log('    done');

    const rangeIter = getGraphemeExtendRanges(rawTable);

    generateCheckScript(rangeIter, 'isGraphemeExtend', '../src/util/grapheme-extend.ts', 'gen/generate-derived-props.js');
})().catch(console.error);
