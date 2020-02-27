/* eslint-disable no-bitwise */
/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

// Very heavily inspired by https://github.com/rust-lang/rust/blob/master/src/libcore/unicode/printable.py

const got = require('got');
const fs = require('fs');
const path = require('path');

function hex(n, len) {
    return `0x${n.toString(16).padStart(len, '0')}`;
}

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

function compressSingletons(singletons) {
    const uppers = []; // 0xaabb where a is upper, b is # in lowers
    const lowers = [];

    let currentUpperByte;
    let currentUpperCount;

    let i;
    let upper;
    let lower;

    for (i of singletons) {
        upper = i >> 8;
        lower = i & 0xff;

        if (upper !== currentUpperByte) {
            if (currentUpperByte !== undefined) {
                uppers.push((currentUpperByte << 8) | currentUpperCount);
            }

            currentUpperByte = upper;
            currentUpperCount = 1;
        } else {
            currentUpperCount += 1;
        }

        lowers.push(lower);
    }

    if (currentUpperByte !== undefined) {
        uppers.push((currentUpperByte << 8) | currentUpperCount);
    }

    return [uppers, lowers];
}

function compressNormal(ranges) {
    // lengths 0x00..0x7f are encoded as 00, 01, ..., 7e, 7f
    // lengths 0x80..0x7fff are encoded as 80 80, 80 81, ..., ff fe, ff ff
    const compressed = []; // [trueLen (, trueLen2), falseLen (, falseLen2)][]

    let prevStart = 0;

    let start;
    let count;
    let trueLen;
    let falseLen;
    let entry;

    for ([start, count] of ranges) {
        trueLen = start - prevStart;
        falseLen = count;
        prevStart = start + count;

        if (trueLen > 0x8000 || falseLen > 0x8000) {
            throw new Error('Range lengths are too large for normal encoding');
        }

        entry = [];

        if (trueLen > 0x7f) {
            entry.push(
                0x80 | (trueLen >> 8),
                trueLen & 0xff,
            );
        } else {
            entry.push(trueLen);
        }

        if (falseLen > 0x7f) {
            entry.push(
                0x80 | (falseLen >> 8),
                falseLen & 0xff,
            );
        } else {
            entry.push(falseLen);
        }

        compressed.push(entry);
    }

    return compressed;
}

function codifySingletons(uppers, lowers, uppersName, lowersName) {
    const lines = [];

    let n;

    lines.push(`const ${uppersName} = Uint16Array.from([`);
    for (n of uppers) {
        lines.push(`    ${hex(n, 4)},`);
    }
    lines.push(']);');

    lines.push(`const ${lowersName} = Uint8Array.from([`);
    for (let i = 0; i < lowers.length; i += 8) {
        lines.push(`    ${lowers.slice(i, i + 8).map((j) => hex(j, 2)).join(', ')},`);
    }
    lines.push(']);');

    return lines.join('\n');
}

function codifyNormal(normal, normalName) {
    const lines = [];

    let values;

    lines.push(`const ${normalName} = Uint8Array.from([`);
    for (values of normal) {
        lines.push(`    ${values.map((j) => hex(j, 2)).join(', ')},`);
    }
    lines.push(']);');

    return lines.join('\n');
}

(async () => {
    console.log('Downloading table...');

    const rawTable = (await got(
        'http://www.unicode.org/Public/UNIDATA/UnicodeData.txt',
    )).body;

    console.log('    done');

    const CUTOFF = 0x10000;

    // Lone, unprintable codepoints
    const singletonsRaw0 = [];
    const singletonsRaw1 = [];

    // Ranges ([start, len]) of unprintable codepoints
    const normalRaw0 = [];
    const normalRaw1 = [];

    // Extra ranges ([start, len]) of unprintable codepoints (> CUTOFF)
    const extra = [];

    let a;
    let b;

    console.log('Processing table...');

    for ([a, b] of toRanges(getUnprintableCodepoints(rawTable))) {
        if (a > 2 * CUTOFF) {
            extra.push([a, b - a]);
        } else if (a === b - 1) {
            if (a & CUTOFF) {
                singletonsRaw1.push(a & ~CUTOFF);
            } else {
                singletonsRaw0.push(a);
            }
        } else if (a === b - 2) {
            if (a & CUTOFF) {
                singletonsRaw1.push(a & ~CUTOFF, (a + 1) & ~CUTOFF);
            } else {
                singletonsRaw0.push(a, a + 1);
            }
        } else if (a >= 2 * CUTOFF) {
            extra.push([a, b - a]);
        } else if (a & CUTOFF) {
            normalRaw1.push([a & ~CUTOFF, b - a]);
        } else {
            normalRaw0.push([a, b - a]);
        }
    }

    console.log('    done');

    console.log('Compressing data...');

    const [singletons0u, singletons0l] = compressSingletons(singletonsRaw0);
    const [singletons1u, singletons1l] = compressSingletons(singletonsRaw1);
    const normal0 = compressNormal(normalRaw0);
    const normal1 = compressNormal(normalRaw1);

    console.log('    done');

    console.log('Generating source code');

    const text = `\
// NOTE: The following code was generated by "gen/generate-printable.js",
//       do not edit directly!

/* eslint-disable no-bitwise */
/* eslint-disable @typescript-eslint/no-use-before-define */

function check(
    x: number,
    singletonUppers: Uint16Array,
    singletonLowers: Uint8Array,
    normal: Uint8Array,
): boolean {
    const xUpper = x >> 8;
    const xLower = x & 0xff;

    let lowerStart = 0;

    let n;
    let upper;
    let lower;
    let lowerCount;
    let lowerEnd;

    // Test all the singletons first
    for (n of singletonUppers) {
        upper = n >> 8;
        lowerCount = n & 0xff;

        lowerEnd = lowerStart + lowerCount;

        if (xUpper === upper) {
            for (lower of singletonLowers.subarray(lowerStart, lowerEnd)) {
                if (xLower === lower) {
                    return false;
                }
            }
        } else if (xUpper < upper) {
            break;
        }

        lowerStart = lowerEnd;
    }

    let printable = true;
    let v = 0;
    let c = x;

    // Test all the normal ranges, assuming no range is 0 in length
    for (n of normal) {
        if ((v & 0x8000) !== 0) {
            v |= n;

            c -= v & ~0x8000;
            if (c < 0) {
                break;
            }

            v = 0;

            printable = !printable;
        } else if ((n & 0x80) !== 0) {
            v = (n & 0xff) << 8;
        } else {
            c -= n;
            if (c < 0) {
                break;
            }

            printable = !printable;
        }
    }

    return printable;
}

export default function isPrintable(x: number): boolean {
    const lower = x & 0xffff;

    if (x < 0x10000) {
        return check(lower, SINGLETONS0U, SINGLETONS0L, NORMAL0);
    }

    if (x < 0x20000) {
        return check(lower, SINGLETONS1U, SINGLETONS1L, NORMAL1);
    }
\
${(() => {
        const lines = [];

        for (const [start, len] of extra) {
            lines.push(`    if (x >= 0x${start.toString(16)} && x < 0x${(start + len).toString(16)}) {`);
            lines.push('        return false;');
            lines.push('    }');
        }

        if (lines.length > 0) {
            return `\n${lines.join('\n')}\n`;
        }

        return '';
    })()}
    return true;
}

${codifySingletons(singletons0u, singletons0l, 'SINGLETONS0U', 'SINGLETONS0L')}

${codifySingletons(singletons1u, singletons1l, 'SINGLETONS1U', 'SINGLETONS1L')}

${codifyNormal(normal0, 'NORMAL0')}

${codifyNormal(normal1, 'NORMAL1')}
`;

    console.log('    done');

    console.log('Saving source code');

    fs.writeFileSync(path.join(__dirname, '../src/util/printable.ts'), text);

    console.log('    done');
})().catch(console.error);
