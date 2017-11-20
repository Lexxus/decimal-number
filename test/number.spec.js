require('mocha');
const assert = require('assert');
const DecimalNumber = require('../src/number');

describe('DecimalNumber', () => {
  it('should be 0', () => {
    const num = new DecimalNumber();

    assert(num);
    assert.strictEqual(num.integer, '0');
    assert.strictEqual(num.fraction, '0');
  });

  it('should be positive 3.1415926', () => {
    const num = new DecimalNumber('3.1415926');

    assert(num);
    assert.strictEqual(num.isNegative, false);
    assert.strictEqual(num.integer, '3');
    assert.strictEqual(num.fraction, '1415926');
  });

  it('should be negative 1.2', () => {
    const num = new DecimalNumber(-1.2);

    assert(num);
    assert.strictEqual(num.isNegative, true);
    assert.strictEqual(num.integer, '1');
    assert.strictEqual(num.fraction, '2');
  });

  describe('splitValue', () => {
    describe('integer', () => {
      it('should return [3]', () => {
        const chunks = DecimalNumber.splitValue('3');

        assert(chunks);
        assert.equal(chunks.length, 1);
        assert.strictEqual(chunks[0], 3);
      });
      it('should return [678901234567890, 12345]', () => {
        const chunks = DecimalNumber.splitValue('12345678901234567890');

        assert(chunks);
        assert.equal(chunks.length, 2);
        assert.strictEqual(chunks[0], 678901234567890);
        assert.strictEqual(chunks[1], 12345);
      });
      it('should return [0, 10000]', () => {
        const chunks = DecimalNumber.splitValue('10000000000000000000');

        assert(chunks);
        assert.equal(chunks.length, 2);
        assert.strictEqual(chunks[0], 0);
        assert.strictEqual(chunks[1], 10000);
      });
      it('should return [0]', () => {
        const chunks = DecimalNumber.splitValue('0');

        assert(chunks);
        assert.equal(chunks.length, 1);
        assert.strictEqual(chunks[0], 0);
      });
    });
    describe('fraction', () => {
      it('should return [0]', () => {
        const chunks = DecimalNumber.splitValue('0', true);

        assert(chunks);
        assert.equal(chunks.length, 1);
        assert.strictEqual(chunks[0], 0);
      });
      it('should return [1000000000000]', () => {
        const chunks = DecimalNumber.splitValue('001', true);

        assert(chunks);
        assert.equal(chunks.length, 1);
        assert.strictEqual(chunks[0], 1000000000000);
      });
      it('should return [1234567890123, 456780000000000]', () => {
        const chunks = DecimalNumber.splitValue('00123456789012345678', true);

        assert(chunks);
        assert.equal(chunks.length, 2);
        assert.strictEqual(chunks[0], 1234567890123);
        assert.strictEqual(chunks[1], 456780000000000);
      });
    });
  });

  describe('add', () => {
    it('should be 0 + 0 = 0', () => {
      const num = new DecimalNumber();

      assert(num);
      num.add(0);

      assert.equal(num.integerChunks.length, 1);
      assert.strictEqual(num.integerChunks[0], 0);
      assert.equal(num.fractionChunks.length, 1);
      assert.strictEqual(num.fractionChunks[0], 0);
      assert.strictEqual(num.toString(), '0');
    });
    it('should be 3.14 + 0 = 3.14', () => {
      const num = new DecimalNumber(3.14);

      num.add(0);

      assert.equal(num.integerChunks.length, 1);
      assert.strictEqual(num.integerChunks[0], 3);
      assert.equal(num.fractionChunks.length, 1);
      assert.strictEqual(num.fractionChunks[0], 140000000000000);
      assert.strictEqual(num.toString(), '3.14');
    });
    it('should be 0 + 3.14 = 3.14', () => {
      const num = new DecimalNumber(0);

      num.add(3.14);

      assert.equal(num.integerChunks.length, 1);
      assert.strictEqual(num.integerChunks[0], 3);
      assert.equal(num.fractionChunks.length, 1);
      assert.strictEqual(num.fractionChunks[0], 140000000000000);
      assert.strictEqual(num.toString(), '3.14');
    });
    it('should be 999999999999999 + 1 = 1000000000000000', () => {
      const num = new DecimalNumber('999999999999999');

      num.add(1);

      assert.equal(num.integerChunks.length, 2);
      assert.strictEqual(num.integerChunks[0], 0);
      assert.strictEqual(num.integerChunks[1], 1);
      assert.equal(num.fractionChunks.length, 1);
      assert.strictEqual(num.fractionChunks[0], 0);
      assert.strictEqual(num.toString(), '1000000000000000');
    });
    it('should be 3.14 + 0.86 = 4', () => {
      const num = new DecimalNumber(3.14);

      num.add(0.86);

      assert.equal(num.integerChunks.length, 1);
      assert.strictEqual(num.integerChunks[0], 4);
      assert.equal(num.fractionChunks.length, 1);
      assert.strictEqual(num.fractionChunks[0], 0);
      assert.strictEqual(num.toString(), '4');
    });
    it('should be -1.23 - 2.3 = -3.53', () => {
      const num = new DecimalNumber(-1.23);

      num.add(-2.3);

      assert.strictEqual(num.isNegative, true);
      assert.equal(num.integerChunks.length, 1);
      assert.strictEqual(num.integerChunks[0], 3);
      assert.equal(num.fractionChunks.length, 1);
      assert.strictEqual(num.fractionChunks[0], 530000000000000);
      assert.strictEqual(num.toString(), '-3.53');
    });
    it('should be 1 + 12345678901234569.01 = 12345678901234570.01', () => {
      const num = new DecimalNumber(1);

      num.add('12345678901234569.01');

      assert.equal(num.integerChunks.length, 2);
      assert.strictEqual(num.integerChunks[0], 345678901234570);
      assert.strictEqual(num.integerChunks[1], 12);
      assert.equal(num.fractionChunks.length, 1);
      assert.strictEqual(num.fractionChunks[0], 10000000000000);
      assert.strictEqual(num.toString(), '12345678901234570.01');
    });
    it('should be 0.000000000000001 + 0.0000000000000001 = 0.0000000000000011', () => {
      const num = new DecimalNumber('0.000000000000001');

      num.add('0.0000000000000001');

      assert.equal(num.integerChunks.length, 1);
      assert.strictEqual(num.integerChunks[0], 0);
      assert.equal(num.fractionChunks.length, 2);
      assert.strictEqual(num.fractionChunks[0], 1);
      assert.strictEqual(num.fractionChunks[1], 100000000000000);
      assert.strictEqual(num.toString(), '0.0000000000000011');
    });
    it('should be 1 - 1.1 = -0.9', () => {
      const num = new DecimalNumber(1);

      num.add(-1.1);

      assert.strictEqual(num.isNegative, true);
      assert.equal(num.integerChunks.length, 1);
      assert.strictEqual(num.integerChunks[0], 0);
      assert.equal(num.fractionChunks.length, 1);
      assert.strictEqual(num.fractionChunks[0], 900000000000000);
      assert.strictEqual(num.toString(), '-0.9');
    });
    it('should be 1100000000000000 - 200000000000000 = 900000000000000', () => {
      const num = new DecimalNumber('1100000000000000');

      num.add('-200000000000000');

      assert.strictEqual(num.isNegative, false);
      assert.equal(num.integerChunks.length, 1);
      assert.strictEqual(num.integerChunks[0], 900000000000000);
      assert.equal(num.fractionChunks.length, 1);
      assert.strictEqual(num.fractionChunks[0], 0);
      assert.strictEqual(num.toString(), '900000000000000');
    });
    it('should be 0.9999999999999999999 + 0.0000000000000000001 = 1', () => {
      const num = new DecimalNumber('0.9999999999999999999');

      num.add('0.0000000000000000001');

      assert.equal(num.integerChunks.length, 1);
      assert.strictEqual(num.integerChunks[0], 1);
      assert.equal(num.fractionChunks.length, 1);
      assert.strictEqual(num.fractionChunks[0], 0);
      assert.strictEqual(num.toString(), '1');
    });
    it('should be 1 - 0.0000000000000000001 = 0.9999999999999999999', () => {
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
    it('should be 0 - 0.0000000000000000001 = -0.9999999999999999999', () => {
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
  
  describe('mul', () => {
    // Check performance
    after(() => {
      var n1 = 0, n2 = new DecimalNumber();
      console.time('native');
      for (let i = 0; i < 10000; i++) {
        n1 += Math.PI * Math.PI;
      }
      console.timeEnd('native');
      
      console.time('decNum');
      for (let i = 0; i < 10000; i++) {
        let pi = new DecimalNumber(Math.PI);
        pi.mul(Math.PI);
        n2.add(pi);
      }
      console.timeEnd('decNum');
      
      console.log(n1);
      console.log(n2.toString());
    });
    
    it('should be 2 * 2 = 4', () => {
      const num = new DecimalNumber('2');
      
      num.mul('2');
      
      assert.strictEqual(num.toString(), '4');
      assert.strictEqual(num.isNegative, false);
      assert.strictEqual(num.hasInteger, true);
      assert.strictEqual(num.hasFraction, false);
      assert.equal(num.integerChunks.length, 1);
      assert.strictEqual(num.integerChunks[0], 4);
      assert.equal(num.fractionChunks.length, 0);
    });

    it('should be 12 * 1.2 = 14.4', () => {
      const num = new DecimalNumber('12');
      
      num.mul('1.2');

      assert.strictEqual(num.toString(), '14.4');
      assert.strictEqual(num.isNegative, false);
      assert.strictEqual(num.hasInteger, true);
      assert.strictEqual(num.hasFraction, true);
      assert.equal(num.integerChunks.length, 1);
      assert.strictEqual(num.integerChunks[0], 14);
      assert.equal(num.fractionChunks.length, 1);
      assert.strictEqual(num.fractionChunks[0], 400000000000000);
    });

    it('should be 1.2 * -1.2 = -1.44', () => {
      const num = new DecimalNumber('1.2');
      
      num.mul('-1.2');

      assert.strictEqual(num.toString(), '-1.44');
      assert.strictEqual(num.isNegative, true);
      assert.strictEqual(num.hasInteger, true);
      assert.strictEqual(num.hasFraction, true);
      assert.equal(num.integerChunks.length, 1);
      assert.strictEqual(num.integerChunks[0], 1);
      assert.equal(num.fractionChunks.length, 1);
      assert.strictEqual(num.fractionChunks[0], 440000000000000);
    });

    it('should be -0.12 * -1.2 = 0.144', () => {
      const num = new DecimalNumber('-0.12');
      
      num.mul('-1.2');

      assert.strictEqual(num.toString(), '0.144');
      assert.strictEqual(num.isNegative, false);
      assert.strictEqual(num.hasInteger, false);
      assert.strictEqual(num.hasFraction, true);
      assert.equal(num.integerChunks.length, 0);
      assert.equal(num.fractionChunks.length, 1);
      assert.strictEqual(num.fractionChunks[0], 144000000000000);
    });

    it('should be -0.12 * 0.12 = -0.0144', () => {
      const num = new DecimalNumber('-0.12');
      
      num.mul('0.12');

      assert.strictEqual(num.toString(), '-0.0144');
      assert.strictEqual(num.isNegative, true);
      assert.strictEqual(num.hasInteger, false);
      assert.strictEqual(num.hasFraction, true);
      assert.equal(num.integerChunks.length, 0);
      assert.equal(num.fractionChunks.length, 1);
      assert.strictEqual(num.fractionChunks[0], 14400000000000);
    });

    it('should be -44.12 * 4.012 = -177.00944', () => {
      const num = new DecimalNumber('-44.12');
      
      num.mul('4.012');

      assert.strictEqual(num.toString(), '-177.00944');
      assert.strictEqual(num.isNegative, true);
      assert.strictEqual(num.hasInteger, true);
      assert.strictEqual(num.hasFraction, true);
      assert.equal(num.integerChunks.length, 1);
      assert.strictEqual(num.integerChunks[0], 177);
      assert.equal(num.fractionChunks.length, 1);
      assert.strictEqual(num.fractionChunks[0], 9440000000000);
    });

    it('should be 498 * 498 = 248004', () => {
      const num = new DecimalNumber('498');
      
      num.mul('498');

      assert.strictEqual(num.toString(), '248004');
      assert.strictEqual(num.isNegative, false);
      assert.strictEqual(num.hasInteger, true);
      assert.strictEqual(num.hasFraction, false);
      assert.equal(num.integerChunks.length, 1);
      assert.strictEqual(num.integerChunks[0], 248004);
      assert.equal(num.fractionChunks.length, 0);
    });

    it('should be 800000000000000 * 8 = 6400000000000000', () => {
      const num = new DecimalNumber('800000000000000');
      
      num.mul('8');

      assert.strictEqual(num.toString(), '6400000000000000');
      assert.strictEqual(num.isNegative, false);
      assert.strictEqual(num.hasInteger, true);
      assert.strictEqual(num.hasFraction, false);
      assert.equal(num.integerChunks.length, 2);
      assert.strictEqual(num.integerChunks[0], 400000000000000);
      assert.strictEqual(num.integerChunks[1], 6);
      assert.equal(num.fractionChunks.length, 0);
    });

    it('should be 0.00000000000000498 * 0.0000000000000498 = 0.000000000000000000000000000248004', () => {
      const num = new DecimalNumber('0.00000000000000498');

      num.mul('0.0000000000000498');

      assert.strictEqual(num.toString(), '0.000000000000000000000000000248004');
      assert.strictEqual(num.isNegative, false);
      assert.strictEqual(num.hasInteger, false);
      assert.strictEqual(num.hasFraction, true);
      assert.equal(num.integerChunks.length, 0);
      assert.equal(num.fractionChunks.length, 3);
      assert.strictEqual(num.fractionChunks[0], 0);
      assert.strictEqual(num.fractionChunks[1], 248);
      assert.strictEqual(num.fractionChunks[2], 4000000000000);
    });

    it('should be 3.141592653589793 * 3.141592653589793 = 9.869604401089357120529513782849', () => {
      const num = new DecimalNumber('3.141592653589793');

      num.mul('3.141592653589793');

      assert.strictEqual(num.toString(), '9.869604401089357120529513782849');
      assert.strictEqual(num.isNegative, false);
      assert.strictEqual(num.hasInteger, true);
      assert.strictEqual(num.hasFraction, true);
      assert.equal(num.integerChunks.length, 1);
      assert.strictEqual(num.integerChunks[0], 9);
      assert.equal(num.fractionChunks.length, 2);
      assert.strictEqual(num.fractionChunks[0], 869604401089357);
      assert.strictEqual(num.fractionChunks[1], 120529513782849);
    });
  });
});
