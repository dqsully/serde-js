/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

const got = require('got');
const generateCheckScript = require('./generate-unicode-check');

function* toRanges(iter) {
    let start;
    let end;

    let i;

    for (i of iter) {
        if (
            start === undefined
            || end !== i
            || i === 0x10000
            || i === 0x20000
        ) {
            if (start !== undefined) {
                yield [start, end];
            }

            start = i;
            end = i + 1;
        } else {
            end += 1;
        }
    }

    if (start !== undefined) {
        yield [start, end];
    }
}

const unprintableClasses = [
    'Cc',
    'Cf',
    'Cs',
    'Co',
    'Cn',
    'Zl',
    'Zp',
    'Zs',
];

function* getUnprintableCodepoints(rawTable) {
    let line;
    let i;

    let firstClass;
    let prevCodepoint = 0;

    let codepoint;
    let codepointRaw;
    let charName;
    let charClass;

    const lines = rawTable.split('\n');
    let linesProcessed = 0;
    let nextPercent = 10;
    let nextMark = lines.length / 10;

    for (line of lines) {
        if (linesProcessed > nextMark) {
            console.log(`    ${nextPercent}%`);
            nextPercent += 10;
            nextMark = lines.length * (nextPercent / 100);
        }

        linesProcessed += 1;
        if (line.length === 0) {
            // eslint-disable-next-line no-continue
            continue;
        }

        ([codepointRaw, charName, charClass] = line.split(';'));
        codepoint = parseInt(codepointRaw, 16);

        if (firstClass !== undefined) {
            if (!charName.endsWith('Last>')) {
                throw new Error('Missing "Last" entry after "First"');
            }

            // If the class of this range is unprintable, yield all the extra
            // codepoints in this class
            if (unprintableClasses.includes(firstClass)) {
                for (i = prevCodepoint + 1; i < codepoint; i += 1) {
                    yield i;
                }
            }

            firstClass = undefined;
        } else {
            // If the table skipped over some codepoints, yield them as they are
            // unprintable
            if (codepoint > prevCodepoint + 1) {
                for (i = prevCodepoint + 1; i < codepoint; i += 1) {
                    yield i;
                }
            }

            if (charName.endsWith('First>')) {
                firstClass = charClass;
            }
        }

        // If the current class is unprintable, yield this codepoint
        if (unprintableClasses.includes(charClass) && codepoint !== 0x20) {
            yield codepoint;
        }

        prevCodepoint = codepoint;
    }

    if (firstClass !== undefined) {
        throw new Error('Missing "Last" entry after "First"');
    }
}

(async () => {
    console.log('Downloading table...');

    const rawTable = (await got(
        'http://www.unicode.org/Public/UNIDATA/UnicodeData.txt',
    )).body;

    console.log('    done');

    const rangeIter = toRanges(getUnprintableCodepoints(rawTable));

    generateCheckScript(rangeIter, 'isUnprintable', '../src/util/printable.ts', 'gen/generate-printable.js');
})().catch(console.error);
