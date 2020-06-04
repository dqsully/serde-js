import type {} from 'mocha';

import { expect } from 'chai';
import { testFeature } from '../../../test/feature';
import BooleanFeature from './boolean';

describe('boolean feature', () => {
    it('parses true', () => {
        const result = testFeature(
            new BooleanFeature(),
            'true',
        );

        expect(result).to.equal(true);
    });

    it('parses false', () => {
        const result = testFeature(
            new BooleanFeature(),
            'false',
        );

        expect(result).to.equal(false);
    });

    it('errors on early EOF', () => {
        expect(() => {
            testFeature(
                new BooleanFeature(),
                'fa',
            );
        }).to.throw();
    });
});
