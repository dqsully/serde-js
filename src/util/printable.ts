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

    let passing = false;
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

            passing = !passing;
        } else if ((n & 0x80) !== 0) {
            v = (n & 0xff) << 8;
        } else {
            c -= n;
            if (c < 0) {
                break;
            }

            passing = !passing;
        }
    }

    return passing;
}

export default function isUnprintable(x: number): boolean {
    const lower = x & 0xffff;

    if (x < 0x10000) {
        return check(lower, SINGLETONS0U, SINGLETONS0L, NORMAL0);
    }

    if (x < 0x20000) {
        return check(lower, SINGLETONS1U, SINGLETONS1L, NORMAL1);
    }

    if (x >= 0x2a6d7 && x < 0x2a700) {
        return false;
    }
    if (x >= 0x2b735 && x < 0x2b740) {
        return false;
    }
    if (x >= 0x2b81e && x < 0x2b820) {
        return false;
    }
    if (x >= 0x2cea2 && x < 0x2ceb0) {
        return false;
    }
    if (x >= 0x2ebe1 && x < 0x2f800) {
        return false;
    }
    if (x >= 0x2fa1e && x < 0xe0100) {
        return false;
    }
    if (x >= 0xe01f0 && x < 0x10fffe) {
        return false;
    }

    return true;
}

const SINGLETONS0U = Uint16Array.from([
    0x0001,
    0x0305,
    0x0506,
    0x0603,
    0x0706,
    0x0808,
    0x0911,
    0x0a1c,
    0x0b19,
    0x0c14,
    0x0d12,
    0x0e0d,
    0x0f04,
    0x1003,
    0x1212,
    0x1309,
    0x1601,
    0x1705,
    0x1802,
    0x1903,
    0x1a07,
    0x1c02,
    0x1d01,
    0x1f16,
    0x2003,
    0x2b04,
    0x2c02,
    0x2d0b,
    0x2e01,
    0x3003,
    0x3102,
    0x3201,
    0xa702,
    0xa902,
    0xaa04,
    0xab08,
    0xfa02,
    0xfb05,
    0xfd04,
    0xfe03,
    0xff09,
]);
const SINGLETONS0L = Uint8Array.from([
    0xad, 0x78, 0x79, 0x8b, 0x8d, 0xa2, 0x30, 0x57,
    0x58, 0x8b, 0x8c, 0x90, 0x1c, 0x1d, 0xdd, 0x0e,
    0x0f, 0x4b, 0x4c, 0xfb, 0xfc, 0x2e, 0x2f, 0x3f,
    0x5c, 0x5d, 0x5f, 0xb5, 0xe2, 0x84, 0x8d, 0x8e,
    0x91, 0x92, 0xa9, 0xb1, 0xba, 0xbb, 0xc5, 0xc6,
    0xc9, 0xca, 0xde, 0xe4, 0xe5, 0xff, 0x00, 0x04,
    0x11, 0x12, 0x29, 0x31, 0x34, 0x37, 0x3a, 0x3b,
    0x3d, 0x49, 0x4a, 0x5d, 0x84, 0x8e, 0x92, 0xa9,
    0xb1, 0xb4, 0xba, 0xbb, 0xc6, 0xca, 0xce, 0xcf,
    0xe4, 0xe5, 0x00, 0x04, 0x0d, 0x0e, 0x11, 0x12,
    0x29, 0x31, 0x34, 0x3a, 0x3b, 0x45, 0x46, 0x49,
    0x4a, 0x5e, 0x64, 0x65, 0x84, 0x91, 0x9b, 0x9d,
    0xc9, 0xce, 0xcf, 0x0d, 0x11, 0x29, 0x45, 0x49,
    0x57, 0x64, 0x65, 0x8d, 0x91, 0xa9, 0xb4, 0xba,
    0xbb, 0xc5, 0xc9, 0xdf, 0xe4, 0xe5, 0xf0, 0x04,
    0x0d, 0x11, 0x45, 0x49, 0x64, 0x65, 0x80, 0x81,
    0x84, 0xb2, 0xbc, 0xbe, 0xbf, 0xd5, 0xd7, 0xf0,
    0xf1, 0x83, 0x85, 0x8b, 0xa4, 0xa6, 0xbe, 0xbf,
    0xc5, 0xc7, 0xce, 0xcf, 0xda, 0xdb, 0x48, 0x98,
    0xbd, 0xcd, 0xc6, 0xce, 0xcf, 0x49, 0x4e, 0x4f,
    0x57, 0x59, 0x5e, 0x5f, 0x89, 0x8e, 0x8f, 0xb1,
    0xb6, 0xb7, 0xbf, 0xc1, 0xc6, 0xc7, 0xd7, 0x11,
    0x16, 0x17, 0x5b, 0x5c, 0xf6, 0xf7, 0xfe, 0xff,
    0x80, 0x0d, 0x6d, 0x71, 0xde, 0xdf, 0x0e, 0x0f,
    0x1f, 0x6e, 0x6f, 0x1c, 0x1d, 0x5f, 0x7d, 0x7e,
    0xae, 0xaf, 0xbb, 0xbc, 0xfa, 0x16, 0x17, 0x1e,
    0x1f, 0x46, 0x47, 0x4e, 0x4f, 0x58, 0x5a, 0x5c,
    0x5e, 0x7e, 0x7f, 0xb5, 0xc5, 0xd4, 0xd5, 0xdc,
    0xf0, 0xf1, 0xf5, 0x72, 0x73, 0x8f, 0x74, 0x75,
    0x96, 0x97, 0x2f, 0x5f, 0x26, 0x2e, 0x2f, 0xa7,
    0xaf, 0xb7, 0xbf, 0xc7, 0xcf, 0xd7, 0xdf, 0x9a,
    0x40, 0x97, 0x98, 0x30, 0x8f, 0x1f, 0xc0, 0xc1,
    0xce, 0xff, 0x4e, 0x4f, 0x5a, 0x5b, 0x07, 0x08,
    0x0f, 0x10, 0x27, 0x2f, 0xee, 0xef, 0x6e, 0x6f,
    0x37, 0x3d, 0x3f, 0x42, 0x45, 0x90, 0x91, 0xfe,
    0xff, 0x53, 0x67, 0x75, 0xc8, 0xc9, 0xd0, 0xd1,
    0xd8, 0xd9, 0xe7, 0xfe, 0xff,
]);

const SINGLETONS1U = Uint16Array.from([
    0x0006,
    0x0101,
    0x0301,
    0x0402,
    0x0808,
    0x0902,
    0x0a05,
    0x0b02,
    0x1001,
    0x1104,
    0x1205,
    0x1311,
    0x1402,
    0x1502,
    0x1702,
    0x1904,
    0x1c05,
    0x1d08,
    0x2401,
    0x6a03,
    0x6b02,
    0xbc02,
    0xd102,
    0xd40c,
    0xd509,
    0xd602,
    0xd702,
    0xda01,
    0xe005,
    0xe102,
    0xe802,
    0xee20,
    0xf004,
    0xf906,
    0xfa02,
]);
const SINGLETONS1L = Uint8Array.from([
    0x0c, 0x27, 0x3b, 0x3e, 0x4e, 0x4f, 0x8f, 0x9e,
    0x9e, 0x9f, 0x06, 0x07, 0x09, 0x36, 0x3d, 0x3e,
    0x56, 0xf3, 0xd0, 0xd1, 0x04, 0x14, 0x18, 0x36,
    0x37, 0x56, 0x57, 0xbd, 0x35, 0xce, 0xcf, 0xe0,
    0x12, 0x87, 0x89, 0x8e, 0x9e, 0x04, 0x0d, 0x0e,
    0x11, 0x12, 0x29, 0x31, 0x34, 0x3a, 0x45, 0x46,
    0x49, 0x4a, 0x4e, 0x4f, 0x64, 0x65, 0x5a, 0x5c,
    0xb6, 0xb7, 0x1b, 0x1c, 0xa8, 0xa9, 0xd8, 0xd9,
    0x09, 0x37, 0x90, 0x91, 0xa8, 0x07, 0x0a, 0x3b,
    0x3e, 0x66, 0x69, 0x8f, 0x92, 0x6f, 0x5f, 0xee,
    0xef, 0x5a, 0x62, 0x9a, 0x9b, 0x27, 0x28, 0x55,
    0x9d, 0xa0, 0xa1, 0xa3, 0xa4, 0xa7, 0xa8, 0xad,
    0xba, 0xbc, 0xc4, 0x06, 0x0b, 0x0c, 0x15, 0x1d,
    0x3a, 0x3f, 0x45, 0x51, 0xa6, 0xa7, 0xcc, 0xcd,
    0xa0, 0x07, 0x19, 0x1a, 0x22, 0x25, 0x3e, 0x3f,
    0xc5, 0xc6, 0x04, 0x20, 0x23, 0x25, 0x26, 0x28,
    0x33, 0x38, 0x3a, 0x48, 0x4a, 0x4c, 0x50, 0x53,
    0x55, 0x56, 0x58, 0x5a, 0x5c, 0x5e, 0x60, 0x63,
    0x65, 0x66, 0x6b, 0x73, 0x78, 0x7d, 0x7f, 0x8a,
    0xa4, 0xaa, 0xaf, 0xb0, 0xc0, 0xd0, 0x0c, 0x72,
    0xa3, 0xa4, 0xcb, 0xcc, 0x6e, 0x6f,
]);

const NORMAL0 = Uint8Array.from([
    0x00, 0x20,
    0x5f, 0x22,
    0x82, 0xdf, 0x04,
    0x82, 0x44, 0x08,
    0x1b, 0x04,
    0x06, 0x11,
    0x81, 0xac, 0x0e,
    0x80, 0xab, 0x35,
    0x1e, 0x15,
    0x80, 0xe0, 0x03,
    0x19, 0x08,
    0x01, 0x04,
    0x2f, 0x04,
    0x34, 0x04,
    0x07, 0x03,
    0x01, 0x07,
    0x06, 0x07,
    0x11, 0x0a,
    0x50, 0x0f,
    0x12, 0x07,
    0x55, 0x08,
    0x02, 0x04,
    0x1c, 0x0a,
    0x09, 0x03,
    0x08, 0x03,
    0x07, 0x03,
    0x02, 0x03,
    0x03, 0x03,
    0x0c, 0x04,
    0x05, 0x03,
    0x0b, 0x06,
    0x01, 0x0e,
    0x15, 0x05,
    0x3a, 0x03,
    0x11, 0x07,
    0x06, 0x05,
    0x10, 0x07,
    0x57, 0x07,
    0x02, 0x07,
    0x15, 0x0d,
    0x50, 0x04,
    0x43, 0x03,
    0x2d, 0x03,
    0x01, 0x04,
    0x11, 0x06,
    0x0f, 0x0c,
    0x3a, 0x04,
    0x1d, 0x25,
    0x5f, 0x20,
    0x6d, 0x04,
    0x6a, 0x25,
    0x80, 0xc8, 0x05,
    0x82, 0xb0, 0x03,
    0x1a, 0x06,
    0x82, 0xfd, 0x03,
    0x59, 0x07,
    0x15, 0x0b,
    0x17, 0x09,
    0x14, 0x0c,
    0x14, 0x0c,
    0x6a, 0x06,
    0x0a, 0x06,
    0x1a, 0x06,
    0x59, 0x07,
    0x2b, 0x05,
    0x46, 0x0a,
    0x2c, 0x04,
    0x0c, 0x04,
    0x01, 0x03,
    0x31, 0x0b,
    0x2c, 0x04,
    0x1a, 0x06,
    0x0b, 0x03,
    0x80, 0xac, 0x06,
    0x0a, 0x06,
    0x1f, 0x41,
    0x4c, 0x04,
    0x2d, 0x03,
    0x74, 0x08,
    0x3c, 0x03,
    0x0f, 0x03,
    0x3c, 0x07,
    0x38, 0x08,
    0x2b, 0x05,
    0x82, 0xff, 0x11,
    0x18, 0x08,
    0x2f, 0x11,
    0x2d, 0x03,
    0x20, 0x10,
    0x21, 0x0f,
    0x80, 0x8c, 0x04,
    0x82, 0x97, 0x19,
    0x0b, 0x15,
    0x88, 0x94, 0x05,
    0x2f, 0x05,
    0x3b, 0x07,
    0x02, 0x0e,
    0x18, 0x09,
    0x80, 0xb0, 0x30,
    0x74, 0x0c,
    0x80, 0xd6, 0x1a,
    0x0c, 0x05,
    0x80, 0xff, 0x05,
    0x80, 0xb6, 0x05,
    0x24, 0x0c,
    0x9b, 0xc6, 0x0a,
    0xd2, 0x30, 0x10,
    0x84, 0x8d, 0x03,
    0x37, 0x09,
    0x81, 0x5c, 0x14,
    0x80, 0xb8, 0x08,
    0x80, 0xc7, 0x30,
    0x35, 0x04,
    0x0a, 0x06,
    0x38, 0x08,
    0x46, 0x08,
    0x0c, 0x06,
    0x74, 0x0b,
    0x1e, 0x03,
    0x5a, 0x04,
    0x59, 0x09,
    0x80, 0x83, 0x18,
    0x1c, 0x0a,
    0x16, 0x09,
    0x48, 0x08,
    0x80, 0x8a, 0x06,
    0xab, 0xa4, 0x0c,
    0x17, 0x04,
    0x31, 0xa1, 0x04,
    0x81, 0xda, 0x26,
    0x07, 0x0c,
    0x05, 0x05,
    0x80, 0xa5, 0x11,
    0x81, 0x6d, 0x10,
    0x78, 0x28,
    0x2a, 0x06,
    0x4c, 0x04,
    0x80, 0x8d, 0x04,
    0x80, 0xbe, 0x03,
    0x1b, 0x03,
    0x0f, 0x0d,
]);

const NORMAL1 = Uint8Array.from([
    0x5e, 0x22,
    0x7b, 0x05,
    0x03, 0x04,
    0x2d, 0x03,
    0x65, 0x04,
    0x01, 0x2f,
    0x2e, 0x80, 0x82,
    0x1d, 0x03,
    0x31, 0x0f,
    0x1c, 0x04,
    0x24, 0x09,
    0x1e, 0x05,
    0x2b, 0x05,
    0x44, 0x04,
    0x0e, 0x2a,
    0x80, 0xaa, 0x06,
    0x24, 0x04,
    0x24, 0x04,
    0x28, 0x08,
    0x34, 0x0b,
    0x01, 0x80, 0x90,
    0x81, 0x37, 0x09,
    0x16, 0x0a,
    0x08, 0x80, 0x98,
    0x39, 0x03,
    0x63, 0x08,
    0x09, 0x30,
    0x16, 0x05,
    0x21, 0x03,
    0x1b, 0x05,
    0x01, 0x40,
    0x38, 0x04,
    0x4b, 0x05,
    0x2f, 0x04,
    0x0a, 0x07,
    0x09, 0x07,
    0x40, 0x20,
    0x27, 0x04,
    0x0c, 0x09,
    0x36, 0x03,
    0x3a, 0x05,
    0x1a, 0x07,
    0x04, 0x0c,
    0x07, 0x50,
    0x49, 0x37,
    0x33, 0x0d,
    0x33, 0x07,
    0x2e, 0x08,
    0x0a, 0x81, 0x26,
    0x1f, 0x80, 0x81,
    0x28, 0x08,
    0x2a, 0x80, 0x86,
    0x17, 0x09,
    0x4e, 0x04,
    0x1e, 0x0f,
    0x43, 0x0e,
    0x19, 0x07,
    0x0a, 0x06,
    0x47, 0x09,
    0x27, 0x09,
    0x75, 0x0b,
    0x3f, 0x41,
    0x2a, 0x06,
    0x3b, 0x05,
    0x0a, 0x06,
    0x51, 0x06,
    0x01, 0x05,
    0x10, 0x03,
    0x05, 0x80, 0x8b,
    0x60, 0x20,
    0x48, 0x08,
    0x0a, 0x80, 0xa6,
    0x5e, 0x22,
    0x45, 0x0b,
    0x0a, 0x06,
    0x0d, 0x13,
    0x39, 0x07,
    0x0a, 0x36,
    0x2c, 0x04,
    0x10, 0x80, 0xc0,
    0x3c, 0x64,
    0x53, 0x0c,
    0x01, 0x80, 0xa0,
    0x45, 0x1b,
    0x48, 0x08,
    0x53, 0x1d,
    0x39, 0x81, 0x07,
    0x46, 0x0a,
    0x1d, 0x03,
    0x47, 0x49,
    0x37, 0x03,
    0x0e, 0x08,
    0x0a, 0x06,
    0x39, 0x07,
    0x0a, 0x81, 0x36,
    0x19, 0x80, 0xc7,
    0x32, 0x0d,
    0x83, 0x9b, 0x66,
    0x75, 0x0b,
    0x80, 0xc4, 0x8a, 0xbc,
    0x84, 0x2f, 0x8f, 0xd1,
    0x82, 0x47, 0xa1, 0xb9,
    0x82, 0x39, 0x07,
    0x2a, 0x04,
    0x02, 0x60,
    0x26, 0x0a,
    0x46, 0x0a,
    0x28, 0x05,
    0x13, 0x82, 0xb0,
    0x5b, 0x65,
    0x4b, 0x04,
    0x39, 0x07,
    0x11, 0x40,
    0x04, 0x1c,
    0x97, 0xf8, 0x08,
    0x82, 0xf3, 0xa5, 0x0d,
    0x81, 0x1f, 0x31,
    0x03, 0x11,
    0x04, 0x08,
    0x81, 0x8c, 0x89, 0x04,
    0x6b, 0x05,
    0x0d, 0x03,
    0x09, 0x07,
    0x10, 0x93, 0x60,
    0x80, 0xf6, 0x0a,
    0x73, 0x08,
    0x6e, 0x17,
    0x46, 0x80, 0x9a,
    0x14, 0x0c,
    0x57, 0x09,
    0x19, 0x80, 0x87,
    0x81, 0x47, 0x03,
    0x85, 0x42, 0x0f,
    0x15, 0x85, 0x50,
    0x2b, 0x80, 0xd5,
    0x2d, 0x03,
    0x1a, 0x04,
    0x02, 0x81, 0x70,
    0x3a, 0x05,
    0x01, 0x85, 0x00,
    0x80, 0xd7, 0x29,
    0x4c, 0x04,
    0x0a, 0x04,
    0x02, 0x83, 0x11,
    0x44, 0x4c,
    0x3d, 0x80, 0xc2,
    0x3c, 0x06,
    0x01, 0x04,
    0x55, 0x05,
    0x1b, 0x34,
    0x02, 0x81, 0x0e,
    0x2c, 0x04,
    0x64, 0x0c,
    0x56, 0x0a,
    0x0d, 0x03,
    0x5d, 0x03,
    0x3d, 0x39,
    0x1d, 0x0d,
    0x2c, 0x04,
    0x09, 0x07,
    0x02, 0x0e,
    0x06, 0x80, 0x9a,
    0x83, 0xd6, 0x0a,
    0x0d, 0x03,
    0x0b, 0x05,
    0x74, 0x0c,
    0x59, 0x07,
    0x0c, 0x14,
    0x0c, 0x04,
    0x38, 0x08,
    0x0a, 0x06,
    0x28, 0x08,
    0x1e, 0x52,
    0x77, 0x03,
    0x31, 0x03,
    0x80, 0xa6, 0x0c,
    0x14, 0x04,
    0x03, 0x05,
    0x03, 0x0d,
    0x06, 0x85, 0x6a,
]);