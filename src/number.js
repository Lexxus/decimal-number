 /**
 * DecimalNumber class to operate with loong decimal numbers without loosing precition
 *
 * @author Oleksij Teterin <altmoc@gmail.com>
 * @version 1.0.0
 * @license MIT http://opensource.org/licenses/MIT
 * @date 2017-11-17
 */

(function() {
  'use strict';
  var PAD_ZERO;

  /**
   * @class
   */
  function DecimalNumber(value) {
    var strValue = String(value || '0');
    var intFrac = strValue.split('.');

    this.isNegative = strValue[0] === '-';
    this.integer = (this.isNegative ? intFrac[0].substr(1) : intFrac[0]) || '0';
    this.fraction = intFrac[1] || '0';
    if (this.integer === '0') {
      this.integerChunks = [0];
      this.hasInteger = false;
    } else {
      this.integerChunks = DecimalNumber.splitValue(this.integer);
      this.hasInteger = true;
    }
    if (this.fraction === '0') {
      this.fractionChunks = [0];
      this.hasFraction = false;
    } else {
      this.fractionChunks = DecimalNumber.splitValue(this.fraction, true);
      this.hasFraction = true;
    }
  }

  Object.defineProperty(DecimalNumber, 'CHUNK_LENGTH', {
    value: String(Number.MAX_SAFE_INTEGER).length - 1
  });

  Object.defineProperty(DecimalNumber, 'CHUNK_LIMIT_VALUE', {
    value: Math.pow(10, DecimalNumber.CHUNK_LENGTH)
  });

  PAD_ZERO = String(DecimalNumber.CHUNK_LIMIT_VALUE).substr(1);

  /**
   * Split value to safe integers (chunks)
   * @param {string} value - stringified integer to get split
   * @param {boolean} alignLeft - if true chunks will be filled from the beginning
   * @returns {Array} of integers
   */
  DecimalNumber.splitValue = function(value, alignLeft) {
    var maxLength = DecimalNumber.CHUNK_LENGTH;
    var len = value.length;
    var chunks = [];
    var i = alignLeft ? 0 : len - maxLength;
    var chunkValue, fullChunksCount, firstChunkLength, zeroLength;

    if (len > maxLength) {
      firstChunkLength = len % maxLength;
      fullChunksCount = (len - firstChunkLength) / maxLength;
      while (fullChunksCount--) {
        chunkValue = value.substr(i, maxLength);
        if (alignLeft) {
          i += maxLength;
        } else {
          i -= maxLength;
        }
        chunks.push(parseInt(chunkValue, 10));
      }
      if (firstChunkLength) {
        if (alignLeft) {
          chunkValue = value.substr(i);
          zeroLength = DecimalNumber.CHUNK_LENGTH - chunkValue.length;
          if (zeroLength) {
            chunkValue += PAD_ZERO.substr(0, zeroLength);
          }
          chunks.push(parseInt(chunkValue, 10));
        } else {
          chunks.push(parseInt(value.substr(0, firstChunkLength), 10));
        }
      }
    } else {
      chunkValue = value;
      if (alignLeft && value !== '0') {
        zeroLength = DecimalNumber.CHUNK_LENGTH - value.length;
        if (zeroLength) {
          chunkValue += PAD_ZERO.substr(0, zeroLength);
        }
      }
      chunks.push(parseInt(chunkValue, 10));
    }
    return chunks;
  }

  /**
   * Add number to the instance.
   * @param {DecimalNumber|Number|String} num - number to add.
   * @return {DecimalNumber} this.
   */
  DecimalNumber.prototype.add = function(num) {
    var that = this;
    var numer = num;
    var chunkLimitValue = DecimalNumber.CHUNK_LIMIT_VALUE;
    var integerChunks = this.integerChunks;
    var fractionChunks = this.fractionChunks;
    var isNegative = this.isNegative;
    var bit = 0;
    var doSub, chunks, sum, i, len;

    function add(val1, val2, loan) {
      var value;

      if (doSub) {
        if (isNegative) {
          value = loan + val2 - val1 - bit;
        } else {
          value = loan + val1 - val2 - bit;
        }
        if (loan === 0 && bit && value < 0) {
          value += bit;
          if (value === 0) {
            that.isNegative = !that.isNegative;
          }
        }
        if (loan && value < loan) {
          bit = 1;
        } else {
          bit = 0;
          value -= loan;
        }
      } else {
        value = val1 + val2 + bit;
        if (value >= chunkLimitValue) {
          bit = 1;
          value -= chunkLimitValue;
        } else {
          bit = 0;
        }
      }
      return value;
    }

    this.isChanged = true;

    if (!(num instanceof DecimalNumber)) {
      numer = new DecimalNumber(num);
    }

    doSub = isNegative !== numer.isNegative;

    // add fraction part
    if (!doSub && !this.hasFraction) {
      // fraction is empty, so just copy if it is
      if (numer.hasFraction) {
        this.fraction = numer.fraction;
        fractionChunks.length = 0;
        // copy chunks
        Array.prototype.push.apply(fractionChunks, numer.fractionChunks);
        this.hasFraction = true;
      }
    } else if (numer.hasFraction) {
      chunks = numer.fractionChunks;
      len = Math.max(chunks.length, fractionChunks.length) - 1;
      for (i = len; i >= 0; i -= 1) {
        sum = add(fractionChunks[i] || 0, chunks[i] || 0, chunkLimitValue);
        // drop the tail empty chunk
        if (i === len && sum === 0 && i > 0) {
          fractionChunks.length -= 1;
          len -= 1;
        } else {
          fractionChunks[i] = sum;
        }
      }
      this.hasFraction = fractionChunks.length > 1 || fractionChunks[0] > 0;
    }

    // add integer part
    len = integerChunks.length;
    if (!this.hasInteger) {
      if (numer.hasInteger) {
        this.integer = numer.integer;
        integerChunks.length = 0;
        Array.prototype.push.apply(integerChunks, numer.integerChunks);
      }
      this.hasInteger = numer.hasInteger || !!bit;
      i = 0;
      while (bit) {
        integerChunks[i] = add(integerChunks[i] || 0, 0, i + 1 < len ? chunkLimitValue : 0);
        i += 1;
      }
    } else if (numer.hasInteger || bit) {
      chunks = numer.integerChunks;
      len = Math.max(chunks.length, len);
      i = 0;
      while (i < len || bit) {
        sum = add(integerChunks[i] || 0, chunks[i] || 0, i + 1 < len ? chunkLimitValue : 0);
        if (sum < 0) {
          this.isNegative = !isNegative;
          sum = -sum;
          bit = 0;
        }
        integerChunks[i] = sum;
        i += 1;
      }
      i = len - 1;
      while (i > 0 && integerChunks[i] === 0) {
        integerChunks.length -= 1;
        i -= 1;
      }
    }

    return this;
  };

  /**
   * Add number to the instance.
   * @param {DecimalNumber|Number|String} num - number to add.
   * @return {DecimalNumber} this.
   */
  DecimalNumber.prototype.sub = function(num) {
    var substractor = num;

    if (!(num instanceof DecimalNumber)) {
      substractor = new DecimalNumber(num);
    }
    substractor.isNegative = !substractor.isNegative;

    this.add(substractor);
    substractor.isNegative = !substractor.isNegative;

    return this;
  };

  /**
   * Multiply current number on the specified parameter.
   * @param {DecimalNumber|Number|String} num - number to multiply.
   * @return {DecimalNumber} this.
   */
  DecimalNumber.prototype.mul = function(num) {
    var numer = num instanceof DecimalNumber ? num : new DecimalNumber(num);
    var numStr1 = this.toString(true);
    var numStr2 = numer.toString(true);
    var frac1Len = this.hasFraction ? this.fraction.length : 0;
    var frac2Len = numer.hasFraction ? numer.fraction.length : 0;
    var fracLen = frac1Len + frac2Len;
    var trailZeros = '';
    var i, n, mulRes, mulResult, integer, intLen;

    function mul1(numStr, digit) {
      var num1 = parseInt(digit, 10);
      var bit = 0;
      var j, nj, res, result, resStr;

      if (numStr === '0') {
        result = '0';
      } else {
        result = '';
        for (j = numStr.length - 1; j >= 0; j--) {
          nj = numStr[j];
          if (nj === '0') {
            res = bit;
            bit = 0;
          } else {
            res = numStr[j] * num1;
            if (bit) {
              res += bit;
            }
            resStr = res.toString();
            if (res > 9) {
              bit = +resStr[0];
              res = resStr[1];
            } else {
              bit = 0;
              res = resStr;
            }
          }
          result = res + result;
        }
      }
      
      if (bit) {
        result = resStr[0] + result;
      }

      return result;
    }

    for (i = numStr2.length - 1; i >= 0; i--) {
      n = numStr2[i];
      if (n !== '0') {
        if (n === '1') {
          mulRes = numStr1;
        } else {
          mulRes = mul1(numStr1, n);
        }
        mulRes += trailZeros;

        if (!mulResult) {
          mulResult = new DecimalNumber(mulRes);
        } else {
          mulResult.add(mulRes);
        }
      }
      trailZeros += '0';
    }
    if (!mulResult) {
      integer = '0';
    } else if (mulResult.isChanged) {
      integer = mulResult.toString(true);
    } else {
      integer = mulResult.integer;
    }
    intLen = integer.length - fracLen;

    if (intLen <= 0) {
      this.integer = '0';
      this.hasInteger = false;
      this.integerChunks.length = 0;
    } else {
      this.hasInteger = true;
      this.integer = integer.substr(0, intLen);
      this.integerChunks = DecimalNumber.splitValue(this.integer);
    }
    if (!fracLen) {
      this.fraction = '0';
      this.hasFraction = false;
      this.fractionChunks.length = 0;
    } else {
      this.hasFraction = true;
      if (intLen > 0) {
        this.fraction = integer.substr(intLen);
      } else {
        this.fraction = integer;
        if (intLen < 0) {
          if (this.fraction.padStart) {
            this.fraction = this.fraction.padStart(fracLen, '0');
          } else {
            this.fraction = '0'.repeat(-intLen) + this.fraction;
          }
        }
      }
      this.fractionChunks = DecimalNumber.splitValue(this.fraction, true);
    }
    this.isNegative = this.isNegative !== numer.isNegative;

    return this;
  };

  /**
   * Convert to decimal string.
   * @param {boolean} pureNum - if true export only digits in to a string.
   * @return {string} string of decimal numbers.
   */
  DecimalNumber.prototype.toString = function(pureNum) {
    var CHUNK_LENGTH = DecimalNumber.CHUNK_LENGTH;
    var integer, fraction, i, len, str, diff;

    if (this.isChanged) {
      integer = fraction = '';
      if (this.hasInteger) {
        len = this.integerChunks.length - 1;
        for (i = len; i >= 0; i -= 1) {
          str = String(this.integerChunks[i]);
          if (i < len && str.length < CHUNK_LENGTH) {
            str = PAD_ZERO.substr(0, CHUNK_LENGTH - str.length) + str;
          }
          integer += str;
        }
      } else {
        integer = '0';
      }
      if (this.hasFraction) {
        for (i = 0, len = this.fractionChunks.length; i < len; i += 1) {
          str = String(this.fractionChunks[i]);
          diff = CHUNK_LENGTH - str.length;
          if (diff > 0) {
            str = PAD_ZERO.substr(0, diff) + str;
          }
          fraction += str;
        }
        len = fraction.length - 1;
        i = len;
        // remove trailing zeros
        while (i > -1) {
          if (fraction[i] !== '0' || i === 0) {
            if (i < len) {
              fraction = fraction.substr(0, i + 1);
            }
            break;
          } else {
            i -= 1;
          }
        }
      } else {
        fraction = '0';
      }
      this.integer = integer;
      this.fraction = fraction;
      this.isChanged = false;
    }
    str = this.integer;
    if (this.hasFraction) {
      str += (!pureNum ? '.' : '') + this.fraction;
    }

    return (this.isNegative && !pureNum ? '-' : '') + str;
  }

  if (typeof window === 'object') {
    window.DecimalNumber = DecimalNumber;
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = DecimalNumber;
  }
})();
