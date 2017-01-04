;(function() {
    /**
     * @class
     */
    function DecimalNumber(value) {
        var strValue = (value || '0') + '';
        var intFrac = strValue.split('.');

        this.isNegative = strValue[0] === '-';
        this.integer = this.isNegative ? intFrac[0].substr(1) : intFrac[0];
        this.fraction = intFrac[1] || '0';
        this.integerChunks = DecimalNumber.splitValue(integer);
        this.fractionChunks = DecimalNumber.splitValue(fraction, true);
    }

    Object.defineProperty(DecimalNumber, 'CHUNK_LENGTH', {
        value: (Number.MAX_SAFE_INTEGER + '').length - 1
    });

    Object.defineProperty(DecimalNumber, 'CHUNK_LIMIT_VALUE', {
        value: Math.pow(10, DecimalNumber.CHUNK_LENGTH)
    });

    /**
     * Split value to safe integers
     * @param {string} value - stringified integer to get split
     * @param {boolean} alignFirst - if true chunks will be filled from the beginning
     * @returns {Array} of integers
     */
    DecimalNumber.splitValue = function(value, alignFirst) {
        var maxLength = DecimalNumber.CHUNK_LENGTH;
        var len = value.length;
        var chunks = [];
        var i = alignFirst ? 0 : len - maxLength;
        var fullChunksCount, firstChunkLength;

        if (len > maxLength) {
            firstChunkLength = len % maxLength;
            fullChunksCount = (len - firstChunkLength) / maxLength;
            while (fullChunksCount--) {
                chunks.push(parseInt(value.substr(i, maxLength), 10));
                if (alignFirst) {
                    i += maxLength;
                } else {
                    i -= maxLength;
                }
            }
            if (firstChunkLength) {
                if (alignFirst) {
                    chunks.push(parseInt(value.substr(i), 10));
                } else {
                    chunks.push(parseInt(value.substr(0, firstChunkLength), 10));
                }
            }
        } else {
            chunks.push(parseInt(value, 10));
        }
        return chunks;
    }

    DecimalNumber.prototype.add = function(num) {
        var numer = num;
        var chunkLimitValue = DecimalNumber.CHUNK_LIMIT_VALUE;
        var integerChunks = this.integerChunks;
        var fractionChunks = this.fractionChunks;
        var isNegative = this.isNegative;
        var bit = 0;
        var doSub, chunks, value, i, len;

        function add(val1, val2, loan) {
            var loan, value;

            if (doSub) {
                if (isNegative) {
                    value = loan + val2 - val1 - bit;
                } else {
                    value = loan + val1 - val2 - bit;
                }
                if (value < loan) {
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

        if (!(num instanceof DecimalNumber)) {
            numer = new DecimalNumber(num);
        }

        doSub = isNegative !== numer.isNegative;

        if (this.fraction === '0') {
            this.fraction = numer.fraction;
            this.fractionChunks.lenth = 0;
            this.fractionChunks.push.apply(this.fractionChunks, numer.fractionChunks);
        } else if (numer.fraction !== '0') {
            chunks = numer.fractionChunks;
            for (i = Math.max(chunks.length, fractionChunks.length); i >= 0; --i) {
                fractionChunks[i] = add(fractionChunks[i], chunks[i], chunkLimitValue);
            }
        }

        if (this.integer === '0') {
            this.integer = numer.integer;
            this.integerChunks.length = 0;
            this.integerChunks.push.apply(this.integerChunks, numer.integerChunks);
        } else if (numer.integer !== '0') {
            chunks = numer.integerChunks;
            len = Math.max(chunks.length, integerChunks.length);
            for (i = 0; i < len; ++i) {
                value = add(integerChunks[i] || 0, chunks[i] || 0, i + 1 < len ? chunkLimitValue : 0);
                if (value < 0) {
                    this.isNegative = !isNegative;
                    value = -value;
                }
                integerChunks[i] = value;
            }
        }
        return this;
    };

    window.DecimalNumber = DecimalNumber;
})();
