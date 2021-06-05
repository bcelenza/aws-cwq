import { expect } from 'chai';
import * as time from '../src/time';

describe('time', () => {
    describe('parseAsTimeOrDuration', () => {
        it('parses `now`', () => {
            const expectedLow = new Date().getTime();
            const expectedHigh = expectedLow + 1000;
            let result = time.parseTimeOrDuration('now');
            // compare within one second
            expect(result).to.be.greaterThanOrEqual(expectedLow);
            expect(result).to.be.lessThanOrEqual(expectedHigh);
        });

        it('parses times in ISO 8601 format', () => {
            const expected = 1620345600000;

            let result = time.parseTimeOrDuration('2021-05-07T00:00:00Z');
            expect(result).to.equal(expected);

            result = time.parseTimeOrDuration('2021-05-06T17:00:00-07:00');
            expect(result).to.equal(expected);
        });

        it('throws an error when an invalid ISO 8061 format is given', () => {
            expect(() => time.parseTimeOrDuration('2021-05-06T00:00:00invalidstring')).to.throw(/Unable to parse time as ISO 8601 format/);
        });

        it('parses times as durations', () => {
            const oneHourAgo = new Date();
            oneHourAgo.setHours(oneHourAgo.getHours() - 1);
            const expectedLow = oneHourAgo.getTime();
            const expectedHigh = expectedLow + 1000;
            let result = time.parseTimeOrDuration('1h');

            // compare within one second
            expect(result).to.be.greaterThanOrEqual(expectedLow);
            expect(result).to.be.lessThanOrEqual(expectedHigh);
        });

        it('throws an error when an invalid duration is given', () => {
            expect(() => time.parseTimeOrDuration('1what')).to.throw(/Unable to parse time as a duration/);
        });
    });
});