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
     * Split value to safe integers
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

    DecimalNumber.prototype.toString = function() {
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
            str += '.' + this.fraction;
        }
        return (this.isNegative ? '-' : '') + str;
    }

    if (typeof window === 'object') {
        window.DecimalNumber = DecimalNumber;
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = DecimalNumber;
    }
})();
