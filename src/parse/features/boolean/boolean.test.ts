import { expect } from 'chai';
import { testFeatureWithLog, LogEntry, TestResultErr } from '../../../test/feature';
import BooleanFeature from './boolean';

describe('boolean feature', () => {
    it('parses true', () => {
        // Given
        const feature = new BooleanFeature();
        const input = 'true';
        const log: LogEntry[] = [
            { type: 'visit' },
            { type: 'finalize' },
        ];

        // When
        const result = testFeatureWithLog(feature, input, log);

        // Then
        expect(result).to.deep.equal({
            finished: true,
            value: true,
        });
    });

    it('parses false', () => {
        // Given
        const feature = new BooleanFeature();
        const input = 'false';
        const log: LogEntry[] = [
            { type: 'visit' },
            { type: 'finalize' },
        ];

        // When
        const result = testFeatureWithLog(feature, input, log);

        // Then
        expect(result).to.deep.equal({
            finished: true,
            value: false,
        });
    });

    it('errors on early EOF', () => {
        // Given
        const feature = new BooleanFeature();
        const input = 'fa';
        const log: LogEntry[] = [
            {
                type: 'error',
                message: 'unexpected end of file',
            },
        ];

        // When
        const result = testFeatureWithLog(feature, input, log);

        // Then
        expect(result.finished).to.equal(false);
    });

    it('errors on extra chars', () => {
        // Given
        const feature = new BooleanFeature();
        const input = 'truer';
        const log: LogEntry[] = [
            { type: 'visit' },
            { type: 'finalize' },
        ];

        // When
        const result = testFeatureWithLog(feature, input, log);

        // Then
        expect(result.finished).to.equal(false);
        expect((result as TestResultErr).error.message).to.equal(
            'At 1:5: Completed parsing early, unexpected \'r\'',
        );
    });
});
