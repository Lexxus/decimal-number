require('mocha');
const assert = require('assert');
const DecimalNumber = require('../src/number');

describe('DecimalNumber', function() {
    it('should be 0', function() {
        const num = new DecimalNumber();

        assert(num);
        assert.strictEqual(num.integer, '0');
        assert.strictEqual(num.fraction, '0');
    });

    it('should be positive 3.1415926', function() {
        const num = new DecimalNumber('3.1415926');

        assert(num);
        assert.strictEqual(num.isNegative, false);
        assert.strictEqual(num.integer, '3');
        assert.strictEqual(num.fraction, '1415926');
    });

    it('should be negative 1.2', function() {
        const num = new DecimalNumber(-1.2);

        assert(num);
        assert.strictEqual(num.isNegative, true);
        assert.strictEqual(num.integer, '1');
        assert.strictEqual(num.fraction, '2');
    });

	describe('splitValue', function() {
        describe('integer', function() {
            it('should return [3]', function() {
                const chunks = DecimalNumber.splitValue('3');

                assert(chunks);
                assert.equal(chunks.length, 1);
                assert.strictEqual(chunks[0], 3);
            });
            it('should return [678901234567890, 12345]', function() {
                const chunks = DecimalNumber.splitValue('12345678901234567890');

                assert(chunks);
                assert.equal(chunks.length, 2);
                assert.strictEqual(chunks[0], 678901234567890);
                assert.strictEqual(chunks[1], 12345);
            });
            it('should return [0, 10000]', function() {
                const chunks = DecimalNumber.splitValue('10000000000000000000');

                assert(chunks);
                assert.equal(chunks.length, 2);
                assert.strictEqual(chunks[0], 0);
                assert.strictEqual(chunks[1], 10000);
            });
            it('should return [0]', function() {
                const chunks = DecimalNumber.splitValue('0');

                assert(chunks);
                assert.equal(chunks.length, 1);
                assert.strictEqual(chunks[0], 0);
            });
        });
        describe('fraction', function() {
            it('should return [0]', function() {
                const chunks = DecimalNumber.splitValue('0', true);

                assert(chunks);
                assert.equal(chunks.length, 1);
                assert.strictEqual(chunks[0], 0);
            });
            it('should return [1000000000000]', function() {
                const chunks = DecimalNumber.splitValue('001', true);

                assert(chunks);
                assert.equal(chunks.length, 1);
                assert.strictEqual(chunks[0], 1000000000000);
            });
            it('should return [1234567890123, 456780000000000]', function() {
                const chunks = DecimalNumber.splitValue('00123456789012345678', true);

                assert(chunks);
                assert.equal(chunks.length, 2);
                assert.strictEqual(chunks[0], 1234567890123);
                assert.strictEqual(chunks[1], 456780000000000);
            });
        });
    });

    describe('add', function() {
        it('should be 0 + 0 = 0', function() {
            const num = new DecimalNumber();

            assert(num);
            num.add(0);

            assert.equal(num.integerChunks.length, 1);
            assert.strictEqual(num.integerChunks[0], 0);
            assert.equal(num.fractionChunks.length, 1);
            assert.strictEqual(num.fractionChunks[0], 0);
            assert.strictEqual(num.toString(), '0');
        });
        it('should be 3.14 + 0 = 3.14', function() {
            const num = new DecimalNumber(3.14);

            num.add(0);

            assert.equal(num.integerChunks.length, 1);
            assert.strictEqual(num.integerChunks[0], 3);
            assert.equal(num.fractionChunks.length, 1);
            assert.strictEqual(num.fractionChunks[0], 140000000000000);
            assert.strictEqual(num.toString(), '3.14');
        });
        it('should be 0 + 3.14 = 3.14', function() {
            const num = new DecimalNumber(0);

            num.add(3.14);

            assert.equal(num.integerChunks.length, 1);
            assert.strictEqual(num.integerChunks[0], 3);
            assert.equal(num.fractionChunks.length, 1);
            assert.strictEqual(num.fractionChunks[0], 140000000000000);
            assert.strictEqual(num.toString(), '3.14');
        });
        it('should be 999999999999999 + 1 = 1000000000000000', function() {
            const num = new DecimalNumber('999999999999999');

            num.add(1);

            assert.equal(num.integerChunks.length, 2);
            assert.strictEqual(num.integerChunks[0], 0);
            assert.strictEqual(num.integerChunks[1], 1);
            assert.equal(num.fractionChunks.length, 1);
            assert.strictEqual(num.fractionChunks[0], 0);
            assert.strictEqual(num.toString(), '1000000000000000');
        });
        it('should be 3.14 + 0.86 = 4', function() {
            const num = new DecimalNumber(3.14);

            num.add(0.86);

            assert.equal(num.integerChunks.length, 1);
            assert.strictEqual(num.integerChunks[0], 4);
            assert.equal(num.fractionChunks.length, 1);
            assert.strictEqual(num.fractionChunks[0], 0);
            assert.strictEqual(num.toString(), '4');
        });
        it('should be -1.23 - 2.3 = -3.53', function() {
            const num = new DecimalNumber(-1.23);

            num.add(-2.3);

            assert.strictEqual(num.isNegative, true);
            assert.equal(num.integerChunks.length, 1);
            assert.strictEqual(num.integerChunks[0], 3);
            assert.equal(num.fractionChunks.length, 1);
            assert.strictEqual(num.fractionChunks[0], 530000000000000);
            assert.strictEqual(num.toString(), '-3.53');
        });
        it('should be 1 + 12345678901234569.01 = 12345678901234570.01', function() {
            const num = new DecimalNumber(1);

            num.add('12345678901234569.01');

            assert.equal(num.integerChunks.length, 2);
            assert.strictEqual(num.integerChunks[0], 345678901234570);
            assert.strictEqual(num.integerChunks[1], 12);
            assert.equal(num.fractionChunks.length, 1);
            assert.strictEqual(num.fractionChunks[0], 10000000000000);
            assert.strictEqual(num.toString(), '12345678901234570.01');
        });
        it('should be 0.000000000000001 + 0.0000000000000001 = 0.0000000000000011', function() {
            const num = new DecimalNumber('0.000000000000001');

            num.add('0.0000000000000001');

            assert.equal(num.integerChunks.length, 1);
            assert.strictEqual(num.integerChunks[0], 0);
            assert.equal(num.fractionChunks.length, 2);
            assert.strictEqual(num.fractionChunks[0], 1);
            assert.strictEqual(num.fractionChunks[1], 100000000000000);
            assert.strictEqual(num.toString(), '0.0000000000000011');
        });
        it('should be 1 - 1.1 = -0.9', function() {
            const num = new DecimalNumber(1);

            num.add(-1.1);

            assert.strictEqual(num.isNegative, true);
            assert.equal(num.integerChunks.length, 1);
            assert.strictEqual(num.integerChunks[0], 0);
            assert.equal(num.fractionChunks.length, 1);
            assert.strictEqual(num.fractionChunks[0], 900000000000000);
            assert.strictEqual(num.toString(), '-0.9');
        });
        it('should be 1100000000000000 - 200000000000000 = 900000000000000', function() {
            const num = new DecimalNumber('1100000000000000');

            num.add('-200000000000000');

            assert.strictEqual(num.isNegative, false);
            assert.equal(num.integerChunks.length, 1);
            assert.strictEqual(num.integerChunks[0], 900000000000000);
            assert.equal(num.fractionChunks.length, 1);
            assert.strictEqual(num.fractionChunks[0], 0);
            assert.strictEqual(num.toString(), '900000000000000');
        });
        it('should be 0.9999999999999999999 + 0.0000000000000000001 = 1', function() {
            const num = new DecimalNumber('0.9999999999999999999');

            num.add('0.0000000000000000001');

            assert.equal(num.integerChunks.length, 1);
            assert.strictEqual(num.integerChunks[0], 1);
            assert.equal(num.fractionChunks.length, 1);
            assert.strictEqual(num.fractionChunks[0], 0);
            assert.strictEqual(num.toString(), '1');
        });
        it('should be 1 - 0.0000000000000000001 = 0.9999999999999999999', function() {
            const num = new DecimalNumber('1');

            num.add('-0.0000000000000000001');

            assert.strictEqual(num.isNegative, false);
            assert.equal(num.integerChunks.length, 1);
            assert.strictEqual(num.integerChunks[0], 0);
            assert.equal(num.fractionChunks.length, 2);
            assert.strictEqual(num.fractionChunks[0], 999999999999999);
            assert.strictEqual(num.fractionChunks[1], 999900000000000);
            assert.strictEqual(num.toString(), '0.9999999999999999999');
        });
        it('should be 0 - 0.0000000000000000001 = -0.9999999999999999999', function() {
            const num = new DecimalNumber('0');

            num.add('-0.0000000000000000001');

            assert.strictEqual(num.isNegative, true);
            assert.equal(num.integerChunks.length, 1);
            assert.strictEqual(num.integerChunks[0], 0);
            assert.equal(num.fractionChunks.length, 2);
            assert.strictEqual(num.fractionChunks[0], 999999999999999);
            assert.strictEqual(num.fractionChunks[1], 999900000000000);
            assert.strictEqual(num.toString(), '-0.9999999999999999999');
        });
    });
});
