/**# LMZA Decompress
 *  ---
 *  Handles decompressing LMZA encoded data
 * This is a modified version of LZMA-JS. You can find the original here:
 * https://github.com/LZMA-JS/LZMA-JS
 *
 * It is basically the same but converted to es6 and TypeScript. The only function
 * you now have access to is the decompress function.
 */
export class LMZADecompress {
    /** ds */
    #action_decompress = 2;
    /** de */
    #action_progress = 3;
    #wait = setTimeout;
    #__4294967296 = 4294967296;
    #N1_longLit = [4294967295, -this.#__4294967296];
    #P0_longLit = [0, 0];
    #P1_longLit = [1, 0];
    #initDim(len) {
        ///NOTE: This is MUCH faster than "new Array(len)" in newer versions of v8 (starting with Node.js 0.11.15, which uses v8 3.28.73).
        var a = [];
        a[len - 1] = undefined;
        return a;
    }
    #add(a, b) {
        return this.#create(a[0] + b[0], a[1] + b[1]);
    }
    #compare(a, b) {
        var nega, negb;
        if (a[0] == b[0] && a[1] == b[1]) {
            return 0;
        }
        nega = a[1] < 0;
        negb = b[1] < 0;
        if (nega && !negb) {
            return -1;
        }
        if (!nega && negb) {
            return 1;
        }
        if (this.#sub(a, b)[1] < 0) {
            return -1;
        }
        return 1;
    }
    #create(valueLow, valueHigh) {
        var diffHigh, diffLow;
        valueHigh %= 1.8446744073709552e19;
        valueLow %= 1.8446744073709552e19;
        diffHigh = valueHigh % this.#__4294967296;
        diffLow = Math.floor(valueLow / this.#__4294967296) * this.#__4294967296;
        valueHigh = valueHigh - diffHigh + diffLow;
        valueLow = valueLow - diffLow + diffHigh;
        while (valueLow < 0) {
            valueLow += this.#__4294967296;
            valueHigh -= this.#__4294967296;
        }
        while (valueLow > 4294967295) {
            valueLow -= this.#__4294967296;
            valueHigh += this.#__4294967296;
        }
        valueHigh = valueHigh % 1.8446744073709552e19;
        while (valueHigh > 9223372032559808512) {
            valueHigh -= 1.8446744073709552e19;
        }
        while (valueHigh < -9223372036854775808) {
            valueHigh += 1.8446744073709552e19;
        }
        return [valueLow, valueHigh];
    }
    #fromInt(value) {
        if (value >= 0) {
            return [value, 0];
        }
        else {
            return [value + this.#__4294967296, -this.#__4294967296];
        }
    }
    #lowBits_0(a) {
        if (a[0] >= 2147483648) {
            return ~~Math.max(Math.min(a[0] - this.#__4294967296, 2147483647), -2147483648);
        }
        else {
            return ~~Math.max(Math.min(a[0], 2147483647), -2147483648);
        }
    }
    #sub(a, b) {
        return this.#create(a[0] - b[0], a[1] - b[1]);
    }
    #byteArrayInputStream(this$static, buf) {
        this$static.buf = buf;
        this$static.pos = 0;
        this$static.count = buf.length;
        return this$static;
    }
    /** ds */
    #read(this$static) {
        if (this$static.pos >= this$static.count)
            return -1;
        return this$static.buf[this$static.pos++] & 255;
    }
    /** de */
    #byteArrayOutputStream(this$static) {
        this$static.buf = this.#initDim(32);
        this$static.count = 0;
        return this$static;
    }
    #toByteArray(this$static) {
        var data = this$static.buf;
        data.length = this$static.count;
        return data;
    }
    #write_0(this$static, buf, off, len) {
        this.#arraycopy(buf, off, this$static.buf, this$static.count, len);
        this$static.count += len;
    }
    #arraycopy(src, srcOfs, dest, destOfs, len) {
        for (var i = 0; i < len; ++i) {
            dest[destOfs + i] = src[srcOfs + i];
        }
    }
    /** ds */
    #init_0(this$static, input, output) {
        var decoder, hex_length = "", i, properties = [], r, tmp_length;
        for (i = 0; i < 5; ++i) {
            r = this.#read(input);
            if (r == -1)
                throw new Error("truncated input");
            properties[i] = (r << 24) >> 24;
        }
        decoder = this.#decoder({});
        if (!this.#setDecoderProperties(decoder, properties)) {
            throw new Error("corrupted input");
        }
        for (i = 0; i < 64; i += 8) {
            r = this.#read(input);
            if (r == -1)
                throw new Error("truncated input");
            r = r.toString(16);
            if (r.length == 1)
                r = "0" + r;
            hex_length = r + "" + hex_length;
        }
        /// Was the length set in the header (if it was compressed from a stream, the length is all f"s).
        if (/^0+$|^f+$/i.test(hex_length)) {
            /// The length is unknown, so set to -1.
            this$static.length_0 = this.#N1_longLit;
        }
        else {
            ///NOTE: If there is a problem with the decoder because of the length, you can always set the length to -1 (N1_longLit) which means unknown.
            tmp_length = parseInt(hex_length, 16);
            /// If the length is too long to handle, just set it to unknown.
            if (tmp_length > 4294967295) {
                this$static.length_0 = this.#N1_longLit;
            }
            else {
                this$static.length_0 = this.#fromInt(tmp_length);
            }
        }
        this$static.chunker = this.#codeInChunks(decoder, input, output, this$static.length_0);
    }
    #LZMAByteArrayDecompressor(this$static, data) {
        this$static.output = this.#byteArrayOutputStream({});
        this.#init_0(this$static, this.#byteArrayInputStream({}, data), this$static.output);
        return this$static;
    }
    /** de */
    /** ds */
    #copyBlock(this$static, distance, len) {
        var pos = this$static._pos - distance - 1;
        if (pos < 0) {
            pos += this$static._windowSize;
        }
        for (; len != 0; --len) {
            if (pos >= this$static._windowSize) {
                pos = 0;
            }
            this$static._buffer[this$static._pos++] = this$static._buffer[pos++];
            if (this$static._pos >= this$static._windowSize) {
                this.#flush_0(this$static);
            }
        }
    }
    #create_5(this$static, windowSize) {
        if (this$static._buffer == null || this$static._windowSize != windowSize) {
            this$static._buffer = this.#initDim(windowSize);
        }
        this$static._windowSize = windowSize;
        this$static._pos = 0;
        this$static._streamPos = 0;
    }
    #flush_0(this$static) {
        var size = this$static._pos - this$static._streamPos;
        if (!size) {
            return;
        }
        this.#write_0(this$static._stream, this$static._buffer, this$static._streamPos, size);
        if (this$static._pos >= this$static._windowSize) {
            this$static._pos = 0;
        }
        this$static._streamPos = this$static._pos;
    }
    #getByte(this$static, distance) {
        var pos = this$static._pos - distance - 1;
        if (pos < 0) {
            pos += this$static._windowSize;
        }
        return this$static._buffer[pos];
    }
    #putByte(this$static, b) {
        this$static._buffer[this$static._pos++] = b;
        if (this$static._pos >= this$static._windowSize) {
            this.#flush_0(this$static);
        }
    }
    #releaseStream(this$static) {
        this.#flush_0(this$static);
        this$static._stream = null;
    }
    /** de */
    #getLenToPosState(len) {
        len -= 2;
        if (len < 4) {
            return len;
        }
        return 3;
    }
    #stateUpdateChar(index) {
        if (index < 4) {
            return 0;
        }
        if (index < 10) {
            return index - 3;
        }
        return index - 6;
    }
    /** ds */
    #chunker(this$static, decoder) {
        this$static.decoder = decoder;
        this$static.encoder = null;
        this$static.alive = 1;
        return this$static;
    }
    /** de */
    #processChunk(this$static) {
        if (!this$static.alive) {
            throw new Error("bad state");
        }
        if (this$static.encoder) {
            throw new Error("No encoding");
        }
        else {
            /// co:throw new Error("No decoding");
            /** ds */
            this.#processDecoderChunk(this$static);
            /** de */
        }
        return this$static.alive;
    }
    /** ds */
    #processDecoderChunk(this$static) {
        var result = this.#codeOneChunk(this$static.decoder);
        if (result == -1) {
            throw new Error("corrupted input");
        }
        this$static.inBytesProcessed = this.#N1_longLit;
        this$static.outBytesProcessed = this$static.decoder.nowPos64;
        if (result ||
            (this.#compare(this$static.decoder.outSize, this.#P0_longLit) >= 0 &&
                this.#compare(this$static.decoder.nowPos64, this$static.decoder.outSize) >= 0)) {
            this.#flush_0(this$static.decoder.m_OutWindow);
            this.#releaseStream(this$static.decoder.m_OutWindow);
            this$static.decoder.m_RangeDecoder.Stream = null;
            this$static.alive = 0;
        }
    }
    /** de */
    /** ds */
    #codeInChunks(this$static, inStream, outStream, outSize) {
        this$static.m_RangeDecoder.Stream = inStream;
        this.#releaseStream(this$static.m_OutWindow);
        this$static.m_OutWindow._stream = outStream;
        this.#init_1(this$static);
        this$static.state = 0;
        this$static.rep0 = 0;
        this$static.rep1 = 0;
        this$static.rep2 = 0;
        this$static.rep3 = 0;
        this$static.outSize = outSize;
        this$static.nowPos64 = this.#P0_longLit;
        this$static.prevByte = 0;
        return this.#chunker({}, this$static);
    }
    #codeOneChunk(this$static) {
        var decoder2, distance, len, numDirectBits, posSlot, posState;
        posState =
            this.#lowBits_0(this$static.nowPos64) & this$static.m_PosStateMask;
        if (!this.#decodeBit(this$static.m_RangeDecoder, this$static.m_IsMatchDecoders, (this$static.state << 4) + posState)) {
            decoder2 = this.#getDecoder(this$static.m_LiteralDecoder, this.#lowBits_0(this$static.nowPos64), this$static.prevByte);
            if (this$static.state < 7) {
                this$static.prevByte = this.#decodeNormal(decoder2, this$static.m_RangeDecoder);
            }
            else {
                this$static.prevByte = this.#decodeWithMatchByte(decoder2, this$static.m_RangeDecoder, this.#getByte(this$static.m_OutWindow, this$static.rep0));
            }
            this.#putByte(this$static.m_OutWindow, this$static.prevByte);
            this$static.state = this.#stateUpdateChar(this$static.state);
            this$static.nowPos64 = this.#add(this$static.nowPos64, this.#P1_longLit);
        }
        else {
            if (this.#decodeBit(this$static.m_RangeDecoder, this$static.m_IsRepDecoders, this$static.state)) {
                len = 0;
                if (!this.#decodeBit(this$static.m_RangeDecoder, this$static.m_IsRepG0Decoders, this$static.state)) {
                    if (!this.#decodeBit(this$static.m_RangeDecoder, this$static.m_IsRep0LongDecoders, (this$static.state << 4) + posState)) {
                        this$static.state = this$static.state < 7 ? 9 : 11;
                        len = 1;
                    }
                }
                else {
                    if (!this.#decodeBit(this$static.m_RangeDecoder, this$static.m_IsRepG1Decoders, this$static.state)) {
                        distance = this$static.rep1;
                    }
                    else {
                        if (!this.#decodeBit(this$static.m_RangeDecoder, this$static.m_IsRepG2Decoders, this$static.state)) {
                            distance = this$static.rep2;
                        }
                        else {
                            distance = this$static.rep3;
                            this$static.rep3 = this$static.rep2;
                        }
                        this$static.rep2 = this$static.rep1;
                    }
                    this$static.rep1 = this$static.rep0;
                    this$static.rep0 = distance;
                }
                if (!len) {
                    len =
                        this.#decode2(this$static.m_RepLenDecoder, this$static.m_RangeDecoder, posState) + 2;
                    this$static.state = this$static.state < 7 ? 8 : 11;
                }
            }
            else {
                this$static.rep3 = this$static.rep2;
                this$static.rep2 = this$static.rep1;
                this$static.rep1 = this$static.rep0;
                len =
                    2 +
                        this.#decode2(this$static.m_LenDecoder, this$static.m_RangeDecoder, posState);
                this$static.state = this$static.state < 7 ? 7 : 10;
                posSlot = this.#decode_0(this$static.m_PosSlotDecoder[this.#getLenToPosState(len)], this$static.m_RangeDecoder);
                if (posSlot >= 4) {
                    numDirectBits = (posSlot >> 1) - 1;
                    this$static.rep0 = (2 | (posSlot & 1)) << numDirectBits;
                    if (posSlot < 14) {
                        this$static.rep0 += this.#reverseDecode2(this$static.m_PosDecoders, this$static.rep0 - posSlot - 1, this$static.m_RangeDecoder, numDirectBits);
                    }
                    else {
                        this$static.rep0 +=
                            this.#decodeDirectBits(this$static.m_RangeDecoder, numDirectBits - 4) << 4;
                        this$static.rep0 += this.#reverseDecode(this$static.m_PosAlignDecoder, this$static.m_RangeDecoder);
                        if (this$static.rep0 < 0) {
                            if (this$static.rep0 == -1) {
                                return 1;
                            }
                            return -1;
                        }
                    }
                }
                else
                    this$static.rep0 = posSlot;
            }
            if (this.#compare(this.#fromInt(this$static.rep0), this$static.nowPos64) >=
                0 ||
                this$static.rep0 >= this$static.m_DictionarySizeCheck) {
                return -1;
            }
            this.#copyBlock(this$static.m_OutWindow, this$static.rep0, len);
            this$static.nowPos64 = this.#add(this$static.nowPos64, this.#fromInt(len));
            this$static.prevByte = this.#getByte(this$static.m_OutWindow, 0);
        }
        return 0;
    }
    #decoder(this$static) {
        this$static.m_OutWindow = {};
        this$static.m_RangeDecoder = {};
        this$static.m_IsMatchDecoders = this.#initDim(192);
        this$static.m_IsRepDecoders = this.#initDim(12);
        this$static.m_IsRepG0Decoders = this.#initDim(12);
        this$static.m_IsRepG1Decoders = this.#initDim(12);
        this$static.m_IsRepG2Decoders = this.#initDim(12);
        this$static.m_IsRep0LongDecoders = this.#initDim(192);
        this$static.m_PosSlotDecoder = this.#initDim(4);
        this$static.m_PosDecoders = this.#initDim(114);
        this$static.m_PosAlignDecoder = this.#bitTreeDecoder({}, 4);
        this$static.m_LenDecoder = this.#decoder$LenDecoder({});
        this$static.m_RepLenDecoder = this.#decoder$LenDecoder({});
        this$static.m_LiteralDecoder = {};
        for (var i = 0; i < 4; ++i) {
            this$static.m_PosSlotDecoder[i] = this.#bitTreeDecoder({}, 6);
        }
        return this$static;
    }
    #init_1(this$static) {
        this$static.m_OutWindow._streamPos = 0;
        this$static.m_OutWindow._pos = 0;
        this.#initBitModels(this$static.m_IsMatchDecoders);
        this.#initBitModels(this$static.m_IsRep0LongDecoders);
        this.#initBitModels(this$static.m_IsRepDecoders);
        this.#initBitModels(this$static.m_IsRepG0Decoders);
        this.#initBitModels(this$static.m_IsRepG1Decoders);
        this.#initBitModels(this$static.m_IsRepG2Decoders);
        this.#initBitModels(this$static.m_PosDecoders);
        this.#init_0_1(this$static.m_LiteralDecoder);
        for (var i = 0; i < 4; ++i) {
            this.#initBitModels(this$static.m_PosSlotDecoder[i].Models);
        }
        this.#init(this$static.m_LenDecoder);
        this.#init(this$static.m_RepLenDecoder);
        this.#initBitModels(this$static.m_PosAlignDecoder.Models);
        this.#tnit_8(this$static.m_RangeDecoder);
    }
    #setDecoderProperties(this$static, properties) {
        var dictionarySize, i, lc, lp, pb, remainder, val;
        if (properties.length < 5)
            return 0;
        val = properties[0] & 255;
        lc = val % 9;
        remainder = ~~(val / 9);
        lp = remainder % 5;
        pb = ~~(remainder / 5);
        dictionarySize = 0;
        for (i = 0; i < 4; ++i) {
            dictionarySize += (properties[1 + i] & 255) << (i * 8);
        }
        ///NOTE: If the input is bad, it might call for an insanely large dictionary size, which would crash the script.
        if (dictionarySize > 99999999 ||
            !this.#setLcLpPb(this$static, lc, lp, pb)) {
            return 0;
        }
        return this.#setDictionarySize(this$static, dictionarySize);
    }
    #setDictionarySize(this$static, dictionarySize) {
        if (dictionarySize < 0) {
            return 0;
        }
        if (this$static.m_DictionarySize != dictionarySize) {
            this$static.m_DictionarySize = dictionarySize;
            this$static.m_DictionarySizeCheck = Math.max(this$static.m_DictionarySize, 1);
            this.#create_5(this$static.m_OutWindow, Math.max(this$static.m_DictionarySizeCheck, 4096));
        }
        return 1;
    }
    #setLcLpPb(this$static, lc, lp, pb) {
        if (lc > 8 || lp > 4 || pb > 4) {
            return 0;
        }
        this.#create_0(this$static.m_LiteralDecoder, lp, lc);
        var numPosStates = 1 << pb;
        this.#create2(this$static.m_LenDecoder, numPosStates);
        this.#create2(this$static.m_RepLenDecoder, numPosStates);
        this$static.m_PosStateMask = numPosStates - 1;
        return 1;
    }
    #create2(this$static, numPosStates) {
        for (; this$static.m_NumPosStates < numPosStates; ++this$static.m_NumPosStates) {
            this$static.m_LowCoder[this$static.m_NumPosStates] = this.#bitTreeDecoder({}, 3);
            this$static.m_MidCoder[this$static.m_NumPosStates] = this.#bitTreeDecoder({}, 3);
        }
    }
    #decode2(this$static, rangeDecoder, posState) {
        if (!this.#decodeBit(rangeDecoder, this$static.m_Choice, 0)) {
            return this.#decode_0(this$static.m_LowCoder[posState], rangeDecoder);
        }
        var symbol = 8;
        if (!this.#decodeBit(rangeDecoder, this$static.m_Choice, 1)) {
            symbol += this.#decode_0(this$static.m_MidCoder[posState], rangeDecoder);
        }
        else {
            symbol += 8 + this.#decode_0(this$static.m_HighCoder, rangeDecoder);
        }
        return symbol;
    }
    #decoder$LenDecoder(this$static) {
        this$static.m_Choice = this.#initDim(2);
        this$static.m_LowCoder = this.#initDim(16);
        this$static.m_MidCoder = this.#initDim(16);
        this$static.m_HighCoder = this.#bitTreeDecoder({}, 8);
        this$static.m_NumPosStates = 0;
        return this$static;
    }
    #init(this$static) {
        this.#initBitModels(this$static.m_Choice);
        for (var posState = 0; posState < this$static.m_NumPosStates; ++posState) {
            this.#initBitModels(this$static.m_LowCoder[posState].Models);
            this.#initBitModels(this$static.m_MidCoder[posState].Models);
        }
        this.#initBitModels(this$static.m_HighCoder.Models);
    }
    #create_0(this$static, numPosBits, numPrevBits) {
        var i, numStates;
        if (this$static.m_Coders != null &&
            this$static.m_NumPrevBits == numPrevBits &&
            this$static.m_NumPosBits == numPosBits)
            return;
        this$static.m_NumPosBits = numPosBits;
        this$static.m_PosMask = (1 << numPosBits) - 1;
        this$static.m_NumPrevBits = numPrevBits;
        numStates = 1 << (this$static.m_NumPrevBits + this$static.m_NumPosBits);
        this$static.m_Coders = this.#initDim(numStates);
        for (i = 0; i < numStates; ++i)
            this$static.m_Coders[i] = this.#decoder$LiteralDecoder$Decoder2({});
    }
    #getDecoder(this$static, pos, prevByte) {
        return this$static.m_Coders[((pos & this$static.m_PosMask) << this$static.m_NumPrevBits) +
            ((prevByte & 255) >>> (8 - this$static.m_NumPrevBits))];
    }
    #init_0_1(this$static) {
        var i, numStates;
        numStates = 1 << (this$static.m_NumPrevBits + this$static.m_NumPosBits);
        for (i = 0; i < numStates; ++i) {
            this.#initBitModels(this$static.m_Coders[i].m_Decoders);
        }
    }
    #decodeNormal(this$static, rangeDecoder) {
        var symbol = 1;
        do {
            symbol =
                (symbol << 1) |
                    this.#decodeBit(rangeDecoder, this$static.m_Decoders, symbol);
        } while (symbol < 256);
        return (symbol << 24) >> 24;
    }
    #decodeWithMatchByte(this$static, rangeDecoder, matchByte) {
        var bit, matchBit, symbol = 1;
        do {
            matchBit = (matchByte >> 7) & 1;
            matchByte <<= 1;
            bit = this.#decodeBit(rangeDecoder, this$static.m_Decoders, ((1 + matchBit) << 8) + symbol);
            symbol = (symbol << 1) | bit;
            if (matchBit != bit) {
                while (symbol < 256) {
                    symbol =
                        (symbol << 1) |
                            this.#decodeBit(rangeDecoder, this$static.m_Decoders, symbol);
                }
                break;
            }
        } while (symbol < 256);
        return (symbol << 24) >> 24;
    }
    #decoder$LiteralDecoder$Decoder2(this$static) {
        this$static.m_Decoders = this.#initDim(768);
        return this$static;
    }
    /** de */
    /** ds */
    #bitTreeDecoder(this$static, numBitLevels) {
        this$static.NumBitLevels = numBitLevels;
        this$static.Models = this.#initDim(1 << numBitLevels);
        return this$static;
    }
    #decode_0(this$static, rangeDecoder) {
        var bitIndex, m = 1;
        for (bitIndex = this$static.NumBitLevels; bitIndex != 0; --bitIndex) {
            m = (m << 1) + this.#decodeBit(rangeDecoder, this$static.Models, m);
        }
        return m - (1 << this$static.NumBitLevels);
    }
    #reverseDecode(this$static, rangeDecoder) {
        var bit, bitIndex, m = 1, symbol = 0;
        for (bitIndex = 0; bitIndex < this$static.NumBitLevels; ++bitIndex) {
            bit = this.#decodeBit(rangeDecoder, this$static.Models, m);
            m <<= 1;
            m += bit;
            symbol |= bit << bitIndex;
        }
        return symbol;
    }
    #reverseDecode2(Models, startIndex, rangeDecoder, NumBitLevels) {
        var bit, bitIndex, m = 1, symbol = 0;
        for (bitIndex = 0; bitIndex < NumBitLevels; ++bitIndex) {
            bit = this.#decodeBit(rangeDecoder, Models, startIndex + m);
            m <<= 1;
            m += bit;
            symbol |= bit << bitIndex;
        }
        return symbol;
    }
    /** de */
    /** ds */
    #decodeBit(this$static, probs, index) {
        var newBound, prob = probs[index];
        newBound = (this$static.Range >>> 11) * prob;
        if ((this$static.Code ^ -2147483648) < (newBound ^ -2147483648)) {
            this$static.Range = newBound;
            probs[index] = ((prob + ((2048 - prob) >>> 5)) << 16) >> 16;
            if (!(this$static.Range & -16777216)) {
                this$static.Code =
                    (this$static.Code << 8) | this.#read(this$static.Stream);
                this$static.Range <<= 8;
            }
            return 0;
        }
        else {
            this$static.Range -= newBound;
            this$static.Code -= newBound;
            probs[index] = ((prob - (prob >>> 5)) << 16) >> 16;
            if (!(this$static.Range & -16777216)) {
                this$static.Code =
                    (this$static.Code << 8) | this.#read(this$static.Stream);
                this$static.Range <<= 8;
            }
            return 1;
        }
    }
    #decodeDirectBits(this$static, numTotalBits) {
        var i, t, result = 0;
        for (i = numTotalBits; i != 0; --i) {
            this$static.Range >>>= 1;
            t = (this$static.Code - this$static.Range) >>> 31;
            this$static.Code -= this$static.Range & (t - 1);
            result = (result << 1) | (1 - t);
            if (!(this$static.Range & -16777216)) {
                this$static.Code =
                    (this$static.Code << 8) | this.#read(this$static.Stream);
                this$static.Range <<= 8;
            }
        }
        return result;
    }
    #tnit_8(this$static) {
        this$static.Code = 0;
        this$static.Range = -1;
        for (var i = 0; i < 5; ++i) {
            this$static.Code =
                (this$static.Code << 8) | this.#read(this$static.Stream);
        }
    }
    /** de */
    #initBitModels(probs) {
        for (var i = probs.length - 1; i >= 0; --i) {
            probs[i] = 1024;
        }
    }
    /** ds */
    #decode(utf) {
        var i = 0, j = 0, x, y, z, l = utf.length, buf = [], charCodes = [];
        for (; i < l; ++i, ++j) {
            x = utf[i] & 255;
            if (!(x & 128)) {
                if (!x) {
                    /// It appears that this is binary data, so it cannot be converted to a string, so just send it back.
                    return utf;
                }
                charCodes[j] = x;
            }
            else if ((x & 224) == 192) {
                if (i + 1 >= l) {
                    /// It appears that this is binary data, so it cannot be converted to a string, so just send it back.
                    return utf;
                }
                y = utf[++i] & 255;
                if ((y & 192) != 128) {
                    /// It appears that this is binary data, so it cannot be converted to a string, so just send it back.
                    return utf;
                }
                charCodes[j] = ((x & 31) << 6) | (y & 63);
            }
            else if ((x & 240) == 224) {
                if (i + 2 >= l) {
                    /// It appears that this is binary data, so it cannot be converted to a string, so just send it back.
                    return utf;
                }
                y = utf[++i] & 255;
                if ((y & 192) != 128) {
                    /// It appears that this is binary data, so it cannot be converted to a string, so just send it back.
                    return utf;
                }
                z = utf[++i] & 255;
                if ((z & 192) != 128) {
                    /// It appears that this is binary data, so it cannot be converted to a string, so just send it back.
                    return utf;
                }
                charCodes[j] = ((x & 15) << 12) | ((y & 63) << 6) | (z & 63);
            }
            else {
                /// It appears that this is binary data, so it cannot be converted to a string, so just send it back.
                return utf;
            }
            if (j == 16383) {
                buf.push(String.fromCharCode.apply(String, charCodes));
                j = -1;
            }
        }
        if (j > 0) {
            charCodes.length = j;
            buf.push(String.fromCharCode.apply(String, charCodes));
        }
        return buf.join("");
    }
    /** de */
    #toDouble(a) {
        return a[1] + a[0];
    }
    /** ds */
    decompress(byte_arr, on_finish, on_progress) {
        var this$static = {}, percent, cbn, /// A callback number should be supplied instead of on_finish() if we are using Web Workers.
        has_progress, len, sync = typeof on_finish == "undefined" && typeof on_progress == "undefined";
        if (!on_finish) {
            cbn = on_finish;
            //@ts-ignore
            on_finish = on_progress = 0;
        }
        if (!on_progress) {
            on_progress = (percent) => {
                if (typeof cbn == "undefined")
                    return;
            };
        }
        if (!on_finish) {
            on_finish = (res, err) => {
                if (typeof cbn == "undefined")
                    return;
                return postMessage({
                    action: this.#action_decompress,
                    cbn: cbn,
                    result: res,
                    error: err,
                });
            };
        }
        if (sync) {
            this$static.d = this.#LZMAByteArrayDecompressor({}, byte_arr);
            while (this.#processChunk(this$static.d.chunker))
                ;
            return this.#decode(this.#toByteArray(this$static.d.output));
        }
        try {
            this$static.d = this.#LZMAByteArrayDecompressor({}, byte_arr);
            len = this.#toDouble(this$static.d.length_0);
            ///NOTE: If the data was created via a stream, it will not have a length value, and therefore we can't calculate the progress.
            has_progress = len > -1;
            on_progress(0);
        }
        catch (err) {
            return on_finish(null, err);
        }
        const self = this;
        function do_action() {
            try {
                var res, i = 0, start = new Date().getTime();
                while (self.#processChunk(this$static.d.chunker)) {
                    if (++i % 1000 == 0 && new Date().getTime() - start > 200) {
                        if (has_progress) {
                            percent =
                                self.#toDouble(this$static.d.chunker.decoder.nowPos64) / len;
                            /// If about 200 miliseconds have passed, update the progress.
                            //@ts-ignore
                            on_progress(percent);
                        }
                        ///NOTE: This allows other code to run, like the browser to update.
                        self.#wait(do_action, 0);
                        return 0;
                    }
                }
                //@ts-ignore
                on_progress(1);
                res = self.#decode(self.#toByteArray(this$static.d.output));
                /// delay so we don’t catch errors from the on_finish handler
                //@ts-ignore
                self.#wait(on_finish.bind(null, res), 0);
            }
            catch (err) {
                //@ts-ignore
                on_finish(null, err);
            }
        }
        ///NOTE: We need to wait to make sure it is always async.
        this.#wait(do_action, 0);
    }
}
