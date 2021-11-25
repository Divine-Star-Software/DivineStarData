/**# LZMACompress
 * ---
 * Handles compression of data into a LMZA format. 
 * This is a modified version of LZMA-JS. You can find the original here:
 * https://github.com/LZMA-JS/LZMA-JS
 * 
 * It is basically the same but converted to es6 and TypeScript. The only function 
 * you now have access to is the compress function. 
 */
export class LZMACompress {
  #disableEndMark = false;
  /** cs */
  #action_compress = 1;
  /** ce */

  #action_progress = 3;
  #wait = setTimeout;
  #__4294967296 = 4294967296;
  #N1_longLit = [4294967295, -this.#__4294967296];
  /** cs */
  #MIN_VALUE = [0, -9223372036854775808];
  /** ce */
  #P0_longLit = [0, 0];
  #P1_longLit = [1, 0];

  #get_mode_obj: any;

  #modes = [
    { s: 16, f: 64, m: 0 },
    { s: 20, f: 64, m: 0 },
    { s: 19, f: 64, m: 1 },
    { s: 20, f: 64, m: 1 },
    { s: 21, f: 128, m: 1 },
    { s: 22, f: 128, m: 1 },
    { s: 23, f: 128, m: 1 },
    { s: 24, f: 255, m: 1 },
    { s: 25, f: 255, m: 1 },
  ];

  constructor() {
    this.#CrcTable = (() => {
      var i,
        j,
        r,
        CrcTable = [];
      for (i = 0; i < 256; ++i) {
        r = i;
        for (j = 0; j < 8; ++j)
          if ((r & 1) != 0) {
            r = (r >>> 1) ^ -306674912;
          } else {
            r >>>= 1;
          }
        CrcTable[i] = r;
      }
      return CrcTable;
    })();

    this.#g_FastPos = (() => {
      var j,
        k,
        slotFast,
        c = 2,
        g_FastPos = [0, 1];
      for (slotFast = 2; slotFast < 22; ++slotFast) {
        k = 1 << ((slotFast >> 1) - 1);
        for (j = 0; j < k; ++j, ++c) g_FastPos[c] = (slotFast << 24) >> 24;
      }
      return g_FastPos;
    })();

    /** cs */
    this.#ProbPrices = (() => {
      var end,
        i,
        j,
        start,
        ProbPrices = [];
      for (i = 8; i >= 0; --i) {
        start = 1 << (9 - i - 1);
        end = 1 << (9 - i);
        for (j = start; j < end; ++j) {
          ProbPrices[j] = (i << 6) + (((end - j) << 6) >>> (9 - i - 1));
        }
      }
      return ProbPrices;
    })();

    /** cs */
    this.#get_mode_obj = (mode : number) =>{
        return this.#modes[mode - 1] || this.#modes[6];
    }
  }




  #initDim(len: number) {
    ///NOTE: This is MUCH faster than "new Array(len)" in newer versions of v8 (starting with Node.js 0.11.15, which uses v8 3.28.73).
    var a = [];
    a[len - 1] = undefined;
    return a;
  }

  #add(a: number[], b: number[]) {
    return this.#create(a[0] + b[0], a[1] + b[1]);
  }

  /** cs */
  #and(a: number[], b: number[]) {
    return this.#makeFromBits(
      ~~Math.max(Math.min(a[1] / this.#__4294967296, 2147483647), -2147483648) &
        ~~Math.max(Math.min(b[1] / this.#__4294967296, 2147483647), -2147483648),
      this.#lowBits_0(a) & this.#lowBits_0(b)
    );
  }
  /** ce */

  #compare(a: number[], b: number[]) {
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

  #create(valueLow: number, valueHigh: number) {
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

  /** cs */
  #eq(a: number[], b: number[]) {
    return a[0] == b[0] && a[1] == b[1];
  }
  /** ce */
  #fromInt(value: number) {
    if (value >= 0) {
      return [value, 0];
    } else {
      return [value + this.#__4294967296, -this.#__4294967296];
    }
  }

  #lowBits_0(a: number[]) {
    if (a[0] >= 2147483648) {
      return ~~Math.max(
        Math.min(a[0] - this.#__4294967296, 2147483647),
        -2147483648
      );
    } else {
      return ~~Math.max(Math.min(a[0], 2147483647), -2147483648);
    }
  }
  /** cs */
  #makeFromBits(highBits: number, lowBits: number) {
    var high, low;
    high = highBits * this.#__4294967296;
    low = lowBits;
    if (lowBits < 0) {
      low += this.#__4294967296;
    }
    return [low, high];
  }

  #pwrAsDouble(n: number): number {
    if (n <= 30) {
      return 1 << n;
    } else {
      return this.#pwrAsDouble(30) * this.#pwrAsDouble(n - 30);
    }
  }

  #shl(a: number[], n: number) {
    var diff, newHigh, newLow, twoToN;
    n &= 63;
    if (this.#eq(a, this.#MIN_VALUE)) {
      if (!n) {
        return a;
      }
      return this.#P0_longLit;
    }
    if (a[1] < 0) {
      throw new Error("Neg");
    }
    twoToN = this.#pwrAsDouble(n);
    newHigh = (a[1] * twoToN) % 1.8446744073709552e19;
    newLow = a[0] * twoToN;
    diff = newLow - (newLow % this.#__4294967296);
    newHigh += diff;
    newLow -= diff;
    if (newHigh >= 9223372036854775807) {
      newHigh -= 1.8446744073709552e19;
    }
    return [newLow, newHigh];
  }

  #shr(a: number[], n: number) {
    var shiftFact;
    n &= 63;
    shiftFact = this.#pwrAsDouble(n);
    return this.#create(Math.floor(a[0] / shiftFact), a[1] / shiftFact);
  }

  #shru(a: number[], n: number) {
    var sr;
    n &= 63;
    sr = this.#shr(a, n);
    if (a[1] < 0) {
      sr = this.#add(sr, this.#shl([2, 0], 63 - n));
    }
    return sr;
  }

  /** ce */

  #sub(a: number[], b: number[]) {
    return this.#create(a[0] - b[0], a[1] - b[1]);
  }

  #ByteArrayInputStream(this$static: any, buf: any) {
    this$static.buf = buf;
    this$static.pos = 0;
    this$static.count = buf.length;
    return this$static;
  }

  /** cs */
  #read_0(this$static: any, buf: any, off: number, len: number) {
    if (this$static.pos >= this$static.count) return -1;
    len = Math.min(len, this$static.count - this$static.pos);
    this.#arraycopy(this$static.buf, this$static.pos, buf, off, len);
    this$static.pos += len;
    return len;
  }
  /** ce */

  #ByteArrayOutputStream(this$static: any) {
    this$static.buf = this.#initDim(32);
    this$static.count = 0;
    return this$static;
  }

  #toByteArray(this$static: any) {
    var data = this$static.buf;
    data.length = this$static.count;
    return data;
  }

  /** cs */
  #write(this$static: any, b: number) {
    this$static.buf[this$static.count++] = (b << 24) >> 24;
  }
  /** ce */

  #write_0(this$static: any, buf: any, off: any, len: number) {
    this.#arraycopy(buf, off, this$static.buf, this$static.count, len);
    this$static.count += len;
  }

  /** cs */
  #getChars(
    this$static: any,
    srcBegin: number,
    srcEnd: number,
    dst: number[],
    dstBegin: number
  ) {
    var srcIdx;
    for (srcIdx = srcBegin; srcIdx < srcEnd; ++srcIdx) {
      dst[dstBegin++] = this$static.charCodeAt(srcIdx);
    }
  }
  /** ce */

  #arraycopy(
    src: any[],
    srcOfs: number,
    dest: any[],
    destOfs: number,
    len: number
  ) {
    for (var i = 0; i < len; ++i) {
      dest[destOfs + i] = src[srcOfs + i];
    }
  }

  /** cs */
  #configure(this$static: any, encoder: any) {
    this.#setDictionarySize_0(encoder, 1 << this$static.s);
    encoder._numFastBytes = this$static.f;
    this.#setMatchFinder(encoder, this$static.m);

    /// lc is always 3
    /// lp is always 0
    /// pb is always 2
    encoder._numLiteralPosStateBits = 0;
    encoder._numLiteralContextBits = 3;
    encoder._posStateBits = 2;
    ///this$static._posStateMask = (1 << pb) - 1;
    encoder._posStateMask = 3;
  }

  #init(
    this$static: any,
    input: any,
    output: any,
    length_0: any,
    mode: string
  ) {
    var encoder, i;
    if (this.#compare(length_0, this.#N1_longLit) < 0)
      throw new Error("invalid length " + length_0);
    this$static.length_0 = length_0;
    encoder = this.#encoder({});
    this.#configure(mode, encoder);

    if (this.#disableEndMark) {
      encoder._writeEndMark = true;
    } else {
      encoder._writeEndMark = false;
    }

    this.#writeCoderProperties(encoder, output);
    for (i = 0; i < 64; i += 8)
      this.#write(output, this.#lowBits_0(this.#shr(length_0, i)) & 255);
    this$static.chunker =
      ((encoder._needReleaseMFStream = 0),
      ((encoder._inStream = input),
      (encoder._finished = 0),
      this.#create_2(encoder),
      (encoder._rangeEncoder.Stream = output),
      this.#Init_4(encoder),
      this.#fillDistancesPrices(encoder),
      this.#fillAlignPrices(encoder),
      (encoder._lenEncoder._tableSize = encoder._numFastBytes + 1 - 2),
      this.#updateTables(encoder._lenEncoder, 1 << encoder._posStateBits),
      (encoder._repMatchLenEncoder._tableSize = encoder._numFastBytes + 1 - 2),
      this.#updateTables(
        encoder._repMatchLenEncoder,
        1 << encoder._posStateBits
      ),
      (encoder.nowPos64 = this.#P0_longLit),
      undefined),
      this.#chunker_0({}, encoder));
  }

  #LZMAByteArrayCompressor(this$static: any, data: any, mode: string) {
    this$static.output = this.#ByteArrayOutputStream({});
    this.#init(
      this$static,
      this.#ByteArrayInputStream({}, data),
      this$static.output,
      this.#fromInt(data.length),
      mode
    );
    return this$static;
  }
  /** ce */

  /** cs */
  #create_4(
    this$static: any,
    keepSizeBefore: number,
    keepSizeAfter: number,
    keepSizeReserv: number
  ) {
    var blockSize;
    this$static._keepSizeBefore = keepSizeBefore;
    this$static._keepSizeAfter = keepSizeAfter;
    blockSize = keepSizeBefore + keepSizeAfter + keepSizeReserv;
    if (
      this$static._bufferBase == null ||
      this$static._blockSize != blockSize
    ) {
      this$static._bufferBase = null;
      this$static._blockSize = blockSize;
      this$static._bufferBase = this.#initDim(this$static._blockSize);
    }
    this$static._pointerToLastSafePosition =
      this$static._blockSize - keepSizeAfter;
  }

  #getIndexByte(this$static: any, index: number) {
    return this$static._bufferBase[
      this$static._bufferOffset + this$static._pos + index
    ];
  }

  #getMatchLen(
    this$static: any,
    index: number,
    distance: number,
    limit: number
  ) {
    var i, pby;
    if (this$static._streamEndWasReached) {
      if (this$static._pos + index + limit > this$static._streamPos) {
        limit = this$static._streamPos - (this$static._pos + index);
      }
    }
    ++distance;
    pby = this$static._bufferOffset + this$static._pos + index;
    for (
      i = 0;
      i < limit &&
      this$static._bufferBase[pby + i] ==
        this$static._bufferBase[pby + i - distance];
      ++i
    ) {}
    return i;
  }

  #getNumAvailableBytes(this$static: any) {
    return this$static._streamPos - this$static._pos;
  }

  #moveBlock(this$static: any) {
    var i, numBytes, offset;
    offset =
      this$static._bufferOffset +
      this$static._pos -
      this$static._keepSizeBefore;
    if (offset > 0) {
      --offset;
    }
    numBytes = this$static._bufferOffset + this$static._streamPos - offset;
    for (i = 0; i < numBytes; ++i) {
      this$static._bufferBase[i] = this$static._bufferBase[offset + i];
    }
    this$static._bufferOffset -= offset;
  }

  #movePos_1(this$static: any) {
    var pointerToPostion;
    ++this$static._pos;
    if (this$static._pos > this$static._posLimit) {
      pointerToPostion = this$static._bufferOffset + this$static._pos;
      if (pointerToPostion > this$static._pointerToLastSafePosition) {
        this.#moveBlock(this$static);
      }
      this.#readBlock(this$static);
    }
  }

  #readBlock(this$static: any) {
    var numReadBytes, pointerToPostion, size;
    if (this$static._streamEndWasReached) return;
    while (1) {
      size =
        -this$static._bufferOffset +
        this$static._blockSize -
        this$static._streamPos;
      if (!size) return;
      numReadBytes = this.#read_0(
        this$static._stream,
        this$static._bufferBase,
        this$static._bufferOffset + this$static._streamPos,
        size
      );
      if (numReadBytes == -1) {
        this$static._posLimit = this$static._streamPos;
        pointerToPostion = this$static._bufferOffset + this$static._posLimit;
        if (pointerToPostion > this$static._pointerToLastSafePosition) {
          this$static._posLimit =
            this$static._pointerToLastSafePosition - this$static._bufferOffset;
        }
        this$static._streamEndWasReached = 1;
        return;
      }
      this$static._streamPos += numReadBytes;
      if (
        this$static._streamPos >=
        this$static._pos + this$static._keepSizeAfter
      ) {
        this$static._posLimit =
          this$static._streamPos - this$static._keepSizeAfter;
      }
    }
  }

  #reduceOffsets(this$static: any, subValue: number) {
    this$static._bufferOffset += subValue;
    this$static._posLimit -= subValue;
    this$static._pos -= subValue;
    this$static._streamPos -= subValue;
  }

  #CrcTable: number[] = [];

  #create_3(
    this$static: any,
    historySize: number,
    keepAddBufferBefore: number,
    matchMaxLen: number,
    keepAddBufferAfter: number
  ) {
    var cyclicBufferSize, hs, windowReservSize;
    if (historySize < 1073741567) {
      this$static._cutValue = 16 + (matchMaxLen >> 1);
      windowReservSize =
        ~~(
          (historySize +
            keepAddBufferBefore +
            matchMaxLen +
            keepAddBufferAfter) /
          2
        ) + 256;
      this.#create_4(
        this$static,
        historySize + keepAddBufferBefore,
        matchMaxLen + keepAddBufferAfter,
        windowReservSize
      );
      this$static._matchMaxLen = matchMaxLen;
      cyclicBufferSize = historySize + 1;
      if (this$static._cyclicBufferSize != cyclicBufferSize) {
        this$static._son = this.#initDim(
          (this$static._cyclicBufferSize = cyclicBufferSize) * 2
        );
      }

      hs = 65536;
      if (this$static.HASH_ARRAY) {
        hs = historySize - 1;
        hs |= hs >> 1;
        hs |= hs >> 2;
        hs |= hs >> 4;
        hs |= hs >> 8;
        hs >>= 1;
        hs |= 65535;
        if (hs > 16777216) hs >>= 1;
        this$static._hashMask = hs;
        ++hs;
        hs += this$static.kFixHashSize;
      }

      if (hs != this$static._hashSizeSum) {
        this$static._hash = this.#initDim((this$static._hashSizeSum = hs));
      }
    }
  }

  #getMatches(this$static: any, distances: number[]) {
    var count,
      cur,
      curMatch,
      curMatch2,
      curMatch3,
      cyclicPos,
      delta,
      hash2Value,
      hash3Value,
      hashValue,
      len,
      len0,
      len1,
      lenLimit,
      matchMinPos,
      maxLen,
      offset,
      pby1,
      ptr0,
      ptr1,
      temp;
    if (this$static._pos + this$static._matchMaxLen <= this$static._streamPos) {
      lenLimit = this$static._matchMaxLen;
    } else {
      lenLimit = this$static._streamPos - this$static._pos;
      if (lenLimit < this$static.kMinMatchCheck) {
        this.#movePos_0(this$static);
        return 0;
      }
    }
    offset = 0;
    matchMinPos =
      this$static._pos > this$static._cyclicBufferSize
        ? this$static._pos - this$static._cyclicBufferSize
        : 0;
    cur = this$static._bufferOffset + this$static._pos;
    maxLen = 1;
    hash2Value = 0;
    hash3Value = 0;
    if (this$static.HASH_ARRAY) {
      temp =
        this.#CrcTable[this$static._bufferBase[cur] & 255] ^
        (this$static._bufferBase[cur + 1] & 255);
      hash2Value = temp & 1023;
      temp ^= (this$static._bufferBase[cur + 2] & 255) << 8;
      hash3Value = temp & 65535;
      hashValue =
        (temp ^ (this.#CrcTable[this$static._bufferBase[cur + 3] & 255] << 5)) &
        this$static._hashMask;
    } else {
      hashValue =
        (this$static._bufferBase[cur] & 255) ^
        ((this$static._bufferBase[cur + 1] & 255) << 8);
    }

    curMatch = this$static._hash[this$static.kFixHashSize + hashValue] || 0;
    if (this$static.HASH_ARRAY) {
      curMatch2 = this$static._hash[hash2Value] || 0;
      curMatch3 = this$static._hash[1024 + hash3Value] || 0;
      this$static._hash[hash2Value] = this$static._pos;
      this$static._hash[1024 + hash3Value] = this$static._pos;
      if (curMatch2 > matchMinPos) {
        if (
          this$static._bufferBase[this$static._bufferOffset + curMatch2] ==
          this$static._bufferBase[cur]
        ) {
          distances[offset++] = maxLen = 2;
          distances[offset++] = this$static._pos - curMatch2 - 1;
        }
      }
      if (curMatch3 > matchMinPos) {
        if (
          this$static._bufferBase[this$static._bufferOffset + curMatch3] ==
          this$static._bufferBase[cur]
        ) {
          if (curMatch3 == curMatch2) {
            offset -= 2;
          }
          distances[offset++] = maxLen = 3;
          distances[offset++] = this$static._pos - curMatch3 - 1;
          curMatch2 = curMatch3;
        }
      }
      if (offset != 0 && curMatch2 == curMatch) {
        offset -= 2;
        maxLen = 1;
      }
    }
    this$static._hash[this$static.kFixHashSize + hashValue] = this$static._pos;
    ptr0 = (this$static._cyclicBufferPos << 1) + 1;
    ptr1 = this$static._cyclicBufferPos << 1;
    len0 = len1 = this$static.kNumHashDirectBytes;
    if (this$static.kNumHashDirectBytes != 0) {
      if (curMatch > matchMinPos) {
        if (
          this$static._bufferBase[
            this$static._bufferOffset +
              curMatch +
              this$static.kNumHashDirectBytes
          ] != this$static._bufferBase[cur + this$static.kNumHashDirectBytes]
        ) {
          distances[offset++] = maxLen = this$static.kNumHashDirectBytes;
          distances[offset++] = this$static._pos - curMatch - 1;
        }
      }
    }
    count = this$static._cutValue;
    while (1) {
      if (curMatch <= matchMinPos || count-- == 0) {
        this$static._son[ptr0] = this$static._son[ptr1] = 0;
        break;
      }
      delta = this$static._pos - curMatch;
      cyclicPos =
        (delta <= this$static._cyclicBufferPos
          ? this$static._cyclicBufferPos - delta
          : this$static._cyclicBufferPos -
            delta +
            this$static._cyclicBufferSize) << 1;
      pby1 = this$static._bufferOffset + curMatch;
      len = len0 < len1 ? len0 : len1;
      if (
        this$static._bufferBase[pby1 + len] ==
        this$static._bufferBase[cur + len]
      ) {
        while (++len != lenLimit) {
          if (
            this$static._bufferBase[pby1 + len] !=
            this$static._bufferBase[cur + len]
          ) {
            break;
          }
        }
        if (maxLen < len) {
          distances[offset++] = maxLen = len;
          distances[offset++] = delta - 1;
          if (len == lenLimit) {
            this$static._son[ptr1] = this$static._son[cyclicPos];
            this$static._son[ptr0] = this$static._son[cyclicPos + 1];
            break;
          }
        }
      }
      if (
        (this$static._bufferBase[pby1 + len] & 255) <
        (this$static._bufferBase[cur + len] & 255)
      ) {
        this$static._son[ptr1] = curMatch;
        ptr1 = cyclicPos + 1;
        curMatch = this$static._son[ptr1];
        len1 = len;
      } else {
        this$static._son[ptr0] = curMatch;
        ptr0 = cyclicPos;
        curMatch = this$static._son[ptr0];
        len0 = len;
      }
    }
    this.#movePos_0(this$static);
    return offset;
  }

  #init_5(this$static: any) {
    this$static._bufferOffset = 0;
    this$static._pos = 0;
    this$static._streamPos = 0;
    this$static._streamEndWasReached = 0;
    this.#readBlock(this$static);
    this$static._cyclicBufferPos = 0;
    this.#reduceOffsets(this$static, -1);
  }

  #movePos_0(this$static: any) {
    var subValue;
    if (++this$static._cyclicBufferPos >= this$static._cyclicBufferSize) {
      this$static._cyclicBufferPos = 0;
    }
    this.#movePos_1(this$static);
    if (this$static._pos == 1073741823) {
      subValue = this$static._pos - this$static._cyclicBufferSize;
      this.#normalizeLinks(
        this$static._son,
        this$static._cyclicBufferSize * 2,
        subValue
      );
      this.#normalizeLinks(
        this$static._hash,
        this$static._hashSizeSum,
        subValue
      );
      this.#reduceOffsets(this$static, subValue);
    }
  }

  ///NOTE: This is only called after reading one whole gigabyte.
  #normalizeLinks(items: number[], numItems: number, subValue: number) {
    var i, value;
    for (i = 0; i < numItems; ++i) {
      value = items[i] || 0;
      if (value <= subValue) {
        value = 0;
      } else {
        value -= subValue;
      }
      items[i] = value;
    }
  }

  #setType(this$static: any, numHashBytes: number) {
    this$static.HASH_ARRAY = numHashBytes > 2;
    if (this$static.HASH_ARRAY) {
      this$static.kNumHashDirectBytes = 0;
      this$static.kMinMatchCheck = 4;
      this$static.kFixHashSize = 66560;
    } else {
      this$static.kNumHashDirectBytes = 2;
      this$static.kMinMatchCheck = 3;
      this$static.kFixHashSize = 0;
    }
  }

  #skip(this$static: any, num: number) {
    var count,
      cur,
      curMatch,
      cyclicPos,
      delta,
      hash2Value,
      hash3Value,
      hashValue,
      len,
      len0,
      len1,
      lenLimit,
      matchMinPos,
      pby1,
      ptr0,
      ptr1,
      temp;
    do {
      if (
        this$static._pos + this$static._matchMaxLen <=
        this$static._streamPos
      ) {
        lenLimit = this$static._matchMaxLen;
      } else {
        lenLimit = this$static._streamPos - this$static._pos;
        if (lenLimit < this$static.kMinMatchCheck) {
          this.#movePos_0(this$static);
          continue;
        }
      }
      matchMinPos =
        this$static._pos > this$static._cyclicBufferSize
          ? this$static._pos - this$static._cyclicBufferSize
          : 0;
      cur = this$static._bufferOffset + this$static._pos;
      if (this$static.HASH_ARRAY) {
        temp =
          this.#CrcTable[this$static._bufferBase[cur] & 255] ^
          (this$static._bufferBase[cur + 1] & 255);
        hash2Value = temp & 1023;
        this$static._hash[hash2Value] = this$static._pos;
        temp ^= (this$static._bufferBase[cur + 2] & 255) << 8;
        hash3Value = temp & 65535;
        this$static._hash[1024 + hash3Value] = this$static._pos;
        hashValue =
          (temp ^
            (this.#CrcTable[this$static._bufferBase[cur + 3] & 255] << 5)) &
          this$static._hashMask;
      } else {
        hashValue =
          (this$static._bufferBase[cur] & 255) ^
          ((this$static._bufferBase[cur + 1] & 255) << 8);
      }
      curMatch = this$static._hash[this$static.kFixHashSize + hashValue];
      this$static._hash[this$static.kFixHashSize + hashValue] =
        this$static._pos;
      ptr0 = (this$static._cyclicBufferPos << 1) + 1;
      ptr1 = this$static._cyclicBufferPos << 1;
      len0 = len1 = this$static.kNumHashDirectBytes;
      count = this$static._cutValue;
      while (1) {
        if (curMatch <= matchMinPos || count-- == 0) {
          this$static._son[ptr0] = this$static._son[ptr1] = 0;
          break;
        }
        delta = this$static._pos - curMatch;
        cyclicPos =
          (delta <= this$static._cyclicBufferPos
            ? this$static._cyclicBufferPos - delta
            : this$static._cyclicBufferPos -
              delta +
              this$static._cyclicBufferSize) << 1;
        pby1 = this$static._bufferOffset + curMatch;
        len = len0 < len1 ? len0 : len1;
        if (
          this$static._bufferBase[pby1 + len] ==
          this$static._bufferBase[cur + len]
        ) {
          while (++len != lenLimit) {
            if (
              this$static._bufferBase[pby1 + len] !=
              this$static._bufferBase[cur + len]
            ) {
              break;
            }
          }
          if (len == lenLimit) {
            this$static._son[ptr1] = this$static._son[cyclicPos];
            this$static._son[ptr0] = this$static._son[cyclicPos + 1];
            break;
          }
        }
        if (
          (this$static._bufferBase[pby1 + len] & 255) <
          (this$static._bufferBase[cur + len] & 255)
        ) {
          this$static._son[ptr1] = curMatch;
          ptr1 = cyclicPos + 1;
          curMatch = this$static._son[ptr1];
          len1 = len;
        } else {
          this$static._son[ptr0] = curMatch;
          ptr0 = cyclicPos;
          curMatch = this$static._son[ptr0];
          len0 = len;
        }
      }
      this.#movePos_0(this$static);
    } while (--num != 0);
  }

  /** ce */

  #getLenToPosState(len: number) {
    len -= 2;
    if (len < 4) {
      return len;
    }
    return 3;
  }

  #stateUpdateChar(index: number) {
    if (index < 4) {
      return 0;
    }
    if (index < 10) {
      return index - 3;
    }
    return index - 6;
  }

  /** cs */
  #chunker_0(this$static: any, encoder: number) {
    this$static.encoder = encoder;
    this$static.decoder = null;
    this$static.alive = 1;
    return this$static;
  }
  /** ce */

  #processChunk(this$static: any) {
    if (!this$static.alive) {
      throw new Error("bad state");
    }

    if (this$static.encoder) {
      /// do:throw new Error("No encoding");
      /** cs */
      this.#processEncoderChunk(this$static);
      /** ce */
    } else {
      throw new Error("No decoding");
    }
    return this$static.alive;
  }

  /** cs */
  #processEncoderChunk(this$static: any) {
    this.#codeOneBlock(
      this$static.encoder,
      this$static.encoder.processedInSize,
      this$static.encoder.processedOutSize,
      this$static.encoder.finished
    );
    this$static.inBytesProcessed = this$static.encoder.processedInSize[0];
    if (this$static.encoder.finished[0]) {
      this.#releaseStreams(this$static.encoder);
      this$static.alive = 0;
    }
  }
  /** ce */

  #g_FastPos: number[] = [];
  /** cs */

  #backward(this$static: any, cur: number) {
    var backCur, backMem, posMem, posPrev;
    this$static._optimumEndIndex = cur;
    posMem = this$static._optimum[cur].PosPrev;
    backMem = this$static._optimum[cur].BackPrev;
    do {
      if (this$static._optimum[cur].Prev1IsChar) {
        this.#makeAsChar(this$static._optimum[posMem]);
        this$static._optimum[posMem].PosPrev = posMem - 1;
        if (this$static._optimum[cur].Prev2) {
          this$static._optimum[posMem - 1].Prev1IsChar = 0;
          this$static._optimum[posMem - 1].PosPrev =
            this$static._optimum[cur].PosPrev2;
          this$static._optimum[posMem - 1].BackPrev =
            this$static._optimum[cur].BackPrev2;
        }
      }
      posPrev = posMem;
      backCur = backMem;
      backMem = this$static._optimum[posPrev].BackPrev;
      posMem = this$static._optimum[posPrev].PosPrev;
      this$static._optimum[posPrev].BackPrev = backCur;
      this$static._optimum[posPrev].PosPrev = cur;
      cur = posPrev;
    } while (cur > 0);
    this$static.backRes = this$static._optimum[0].BackPrev;
    this$static._optimumCurrentIndex = this$static._optimum[0].PosPrev;
    return this$static._optimumCurrentIndex;
  }

  #baseInit(this$static: any) {
    this$static._state = 0;
    this$static._previousByte = 0;
    for (var i = 0; i < 4; ++i) {
      this$static._repDistances[i] = 0;
    }
  }

  #codeOneBlock(
    this$static: any,
    inSize: number[][],
    outSize: number[][],
    finished: number[]
  ) {
    var baseVal,
      complexState,
      curByte,
      distance,
      footerBits,
      i,
      len,
      lenToPosState,
      matchByte,
      pos,
      posReduced,
      posSlot,
      posState,
      progressPosValuePrev,
      subCoder;
    inSize[0] = this.#P0_longLit;
    outSize[0] = this.#P0_longLit;
    finished[0] = 1;
    if (this$static._inStream) {
      this$static._matchFinder._stream = this$static._inStream;
      this.#init_5(this$static._matchFinder);
      this$static._needReleaseMFStream = 1;
      this$static._inStream = null;
    }
    if (this$static._finished) {
      return;
    }
    this$static._finished = 1;
    progressPosValuePrev = this$static.nowPos64;
    if (this.#eq(this$static.nowPos64, this.#P0_longLit)) {
      if (!this.#getNumAvailableBytes(this$static._matchFinder)) {
        this.#flush(this$static, this.#lowBits_0(this$static.nowPos64));
        return;
      }
      this.#readMatchDistances(this$static);
      posState =
        this.#lowBits_0(this$static.nowPos64) & this$static._posStateMask;
      this.#encode_3(
        this$static._rangeEncoder,
        this$static._isMatch,
        (this$static._state << 4) + posState,
        0
      );
      this$static._state = this.#stateUpdateChar(this$static._state);
      curByte = this.#getIndexByte(
        this$static._matchFinder,
        -this$static._additionalOffset
      );
      this.#encode_1(
        this.#getSubCoder(
          this$static._literalEncoder,
          this.#lowBits_0(this$static.nowPos64),
          this$static._previousByte
        ),
        this$static._rangeEncoder,
        curByte
      );
      this$static._previousByte = curByte;
      --this$static._additionalOffset;
      this$static.nowPos64 = this.#add(this$static.nowPos64, this.#P1_longLit);
    }
    if (!this.#getNumAvailableBytes(this$static._matchFinder)) {
      this.#flush(this$static, this.#lowBits_0(this$static.nowPos64));
      return;
    }
    while (1) {
      len = this.#getOptimum(this$static, this.#lowBits_0(this$static.nowPos64));
      pos = this$static.backRes;
      posState =
        this.#lowBits_0(this$static.nowPos64) & this$static._posStateMask;
      complexState = (this$static._state << 4) + posState;
      if (len == 1 && pos == -1) {
        this.#encode_3(
          this$static._rangeEncoder,
          this$static._isMatch,
          complexState,
          0
        );
        curByte = this.#getIndexByte(
          this$static._matchFinder,
          -this$static._additionalOffset
        );
        subCoder = this.#getSubCoder(
          this$static._literalEncoder,
          this.#lowBits_0(this$static.nowPos64),
          this$static._previousByte
        );
        if (this$static._state < 7) {
          this.#encode_1(subCoder, this$static._rangeEncoder, curByte);
        } else {
          matchByte = this.#getIndexByte(
            this$static._matchFinder,
            -this$static._repDistances[0] - 1 - this$static._additionalOffset
          );
          this.#encodeMatched(
            subCoder,
            this$static._rangeEncoder,
            matchByte,
            curByte
          );
        }
        this$static._previousByte = curByte;
        this$static._state = this.#stateUpdateChar(this$static._state);
      } else {
        this.#encode_3(
          this$static._rangeEncoder,
          this$static._isMatch,
          complexState,
          1
        );
        if (pos < 4) {
          this.#encode_3(
            this$static._rangeEncoder,
            this$static._isRep,
            this$static._state,
            1
          );
          if (!pos) {
            this.#encode_3(
              this$static._rangeEncoder,
              this$static._isRepG0,
              this$static._state,
              0
            );
            if (len == 1) {
              this.#encode_3(
                this$static._rangeEncoder,
                this$static._isRep0Long,
                complexState,
                0
              );
            } else {
              this.#encode_3(
                this$static._rangeEncoder,
                this$static._isRep0Long,
                complexState,
                1
              );
            }
          } else {
            this.#encode_3(
              this$static._rangeEncoder,
              this$static._isRepG0,
              this$static._state,
              1
            );
            if (pos == 1) {
              this.#encode_3(
                this$static._rangeEncoder,
                this$static._isRepG1,
                this$static._state,
                0
              );
            } else {
              this.#encode_3(
                this$static._rangeEncoder,
                this$static._isRepG1,
                this$static._state,
                1
              );
              this.#encode_3(
                this$static._rangeEncoder,
                this$static._isRepG2,
                this$static._state,
                pos - 2
              );
            }
          }
          if (len == 1) {
            this$static._state = this$static._state < 7 ? 9 : 11;
          } else {
            this.#encode_0(
              this$static._repMatchLenEncoder,
              this$static._rangeEncoder,
              len - 2,
              posState
            );
            this$static._state = this$static._state < 7 ? 8 : 11;
          }
          distance = this$static._repDistances[pos];
          if (pos != 0) {
            for (i = pos; i >= 1; --i) {
              this$static._repDistances[i] = this$static._repDistances[i - 1];
            }
            this$static._repDistances[0] = distance;
          }
        } else {
          this.#encode_3(
            this$static._rangeEncoder,
            this$static._isRep,
            this$static._state,
            0
          );
          this$static._state = this$static._state < 7 ? 7 : 10;
          this.#encode_0(
            this$static._lenEncoder,
            this$static._rangeEncoder,
            len - 2,
            posState
          );
          pos -= 4;
          posSlot = this.#getPosSlot(pos);
          lenToPosState = this.#getLenToPosState(len);
          this.#encode_2(
            this$static._posSlotEncoder[lenToPosState],
            this$static._rangeEncoder,
            posSlot
          );
          if (posSlot >= 4) {
            footerBits = (posSlot >> 1) - 1;
            baseVal = (2 | (posSlot & 1)) << footerBits;
            posReduced = pos - baseVal;
            if (posSlot < 14) {
              this.#reverseEncode2(
                this$static._posEncoders,
                baseVal - posSlot - 1,
                this$static._rangeEncoder,
                footerBits,
                posReduced
              );
            } else {
              this.#encodeDirectBits(
                this$static._rangeEncoder,
                posReduced >> 4,
                footerBits - 4
              );
              this.#reverseEncode(
                this$static._posAlignEncoder,
                this$static._rangeEncoder,
                posReduced & 15
              );
              ++this$static._alignPriceCount;
            }
          }
          distance = pos;
          for (i = 3; i >= 1; --i) {
            this$static._repDistances[i] = this$static._repDistances[i - 1];
          }
          this$static._repDistances[0] = distance;
          ++this$static._matchPriceCount;
        }
        this$static._previousByte = this.#getIndexByte(
          this$static._matchFinder,
          len - 1 - this$static._additionalOffset
        );
      }
      this$static._additionalOffset -= len;
      this$static.nowPos64 = this.#add(this$static.nowPos64, this.#fromInt(len));
      if (!this$static._additionalOffset) {
        if (this$static._matchPriceCount >= 128) {
          this.#fillDistancesPrices(this$static);
        }
        if (this$static._alignPriceCount >= 16) {
          this.#fillAlignPrices(this$static);
        }
        inSize[0] = this$static.nowPos64;
        outSize[0] = this.#getProcessedSizeAdd(this$static._rangeEncoder);
        if (!this.#getNumAvailableBytes(this$static._matchFinder)) {
          this.#flush(this$static, this.#lowBits_0(this$static.nowPos64));
          return;
        }
        if (
          this.#compare(
            this.#sub(this$static.nowPos64, progressPosValuePrev),
            [4096, 0]
          ) >= 0
        ) {
          this$static._finished = 0;
          finished[0] = 0;
          return;
        }
      }
    }
  }

  #create_2(this$static: any) {
    var bt, numHashBytes;
    if (!this$static._matchFinder) {
      bt = {};
      numHashBytes = 4;
      if (!this$static._matchFinderType) {
        numHashBytes = 2;
      }
      this.#setType(bt, numHashBytes);
      this$static._matchFinder = bt;
    }
    this.#create_1(
      this$static._literalEncoder,
      this$static._numLiteralPosStateBits,
      this$static._numLiteralContextBits
    );
    if (
      this$static._dictionarySize == this$static._dictionarySizePrev &&
      this$static._numFastBytesPrev == this$static._numFastBytes
    ) {
      return;
    }
    this.#create_3(
      this$static._matchFinder,
      this$static._dictionarySize,
      4096,
      this$static._numFastBytes,
      274
    );
    this$static._dictionarySizePrev = this$static._dictionarySize;
    this$static._numFastBytesPrev = this$static._numFastBytes;
  }

  #encoder(this$static: any) {
    var i;
    this$static._repDistances = this.#initDim(4);
    this$static._optimum = [];
    this$static._rangeEncoder = {};
    this$static._isMatch = this.#initDim(192);
    this$static._isRep = this.#initDim(12);
    this$static._isRepG0 = this.#initDim(12);
    this$static._isRepG1 = this.#initDim(12);
    this$static._isRepG2 = this.#initDim(12);
    this$static._isRep0Long = this.#initDim(192);
    this$static._posSlotEncoder = [];
    this$static._posEncoders = this.#initDim(114);
    this$static._posAlignEncoder = this.#bitTreeEncoder({}, 4);
    this$static._lenEncoder = this.#encoder$LenPriceTableEncoder({});
    this$static._repMatchLenEncoder = this.#encoder$LenPriceTableEncoder({});
    this$static._literalEncoder = {};
    this$static._matchDistances = [];
    this$static._posSlotPrices = [];
    this$static._distancesPrices = [];
    this$static._alignPrices = this.#initDim(16);
    this$static.reps = this.#initDim(4);
    this$static.repLens = this.#initDim(4);
    this$static.processedInSize = [this.#P0_longLit];
    this$static.processedOutSize = [this.#P0_longLit];
    this$static.finished = [0];
    this$static.properties = this.#initDim(5);
    this$static.tempPrices = this.#initDim(128);
    this$static._longestMatchLength = 0;
    this$static._matchFinderType = 1;
    this$static._numDistancePairs = 0;
    this$static._numFastBytesPrev = -1;
    this$static.backRes = 0;
    for (i = 0; i < 4096; ++i) {
      this$static._optimum[i] = {};
    }
    for (i = 0; i < 4; ++i) {
      this$static._posSlotEncoder[i] = this.#bitTreeEncoder({}, 6);
    }
    return this$static;
  }

  #fillAlignPrices(this$static: any) {
    for (var i = 0; i < 16; ++i) {
      this$static._alignPrices[i] = this.#reverseGetPrice(
        this$static._posAlignEncoder,
        i
      );
    }
    this$static._alignPriceCount = 0;
  }

  #fillDistancesPrices(this$static: any) {
    var baseVal, encoder, footerBits, i, lenToPosState, posSlot, st, st2;
    for (i = 4; i < 128; ++i) {
      posSlot = this.#getPosSlot(i);
      footerBits = (posSlot >> 1) - 1;
      baseVal = (2 | (posSlot & 1)) << footerBits;
      this$static.tempPrices[i] = this.#reverseGetPrice2(
        this$static._posEncoders,
        baseVal - posSlot - 1,
        footerBits,
        i - baseVal
      );
    }
    for (lenToPosState = 0; lenToPosState < 4; ++lenToPosState) {
      encoder = this$static._posSlotEncoder[lenToPosState];
      st = lenToPosState << 6;
      for (posSlot = 0; posSlot < this$static._distTableSize; ++posSlot) {
        this$static._posSlotPrices[st + posSlot] = this.#getPrice_1(
          encoder,
          posSlot
        );
      }
      for (posSlot = 14; posSlot < this$static._distTableSize; ++posSlot) {
        this$static._posSlotPrices[st + posSlot] +=
          ((posSlot >> 1) - 1 - 4) << 6;
      }
      st2 = lenToPosState * 128;
      for (i = 0; i < 4; ++i) {
        this$static._distancesPrices[st2 + i] =
          this$static._posSlotPrices[st + i];
      }
      for (; i < 128; ++i) {
        this$static._distancesPrices[st2 + i] =
          this$static._posSlotPrices[st + this.#getPosSlot(i)] +
          this$static.tempPrices[i];
      }
    }
    this$static._matchPriceCount = 0;
  }

  #flush(this$static: any, nowPos: number) {
    this.#releaseMFStream(this$static);
    this.#writeEndMarker(this$static, nowPos & this$static._posStateMask);
    for (var i = 0; i < 5; ++i) {
      this.#shiftLow(this$static._rangeEncoder);
    }
  }

  #getOptimum(this$static: any, position: number) {
    var cur,
      curAnd1Price,
      curAndLenCharPrice,
      curAndLenPrice,
      curBack,
      curPrice,
      currentByte,
      distance,
      i,
      len,
      lenEnd,
      lenMain,
      lenRes,
      lenTest,
      lenTest2,
      lenTestTemp,
      matchByte,
      matchPrice,
      newLen,
      nextIsChar,
      nextMatchPrice,
      nextOptimum,
      nextRepMatchPrice,
      normalMatchPrice,
      numAvailableBytes,
      numAvailableBytesFull,
      numDistancePairs,
      offs,
      offset,
      opt,
      optimum,
      pos,
      posPrev,
      posState,
      posStateNext,
      price_4,
      repIndex,
      repLen,
      repMatchPrice,
      repMaxIndex,
      shortRepPrice,
      startLen,
      state,
      state2,
      t,
      price,
      price_0,
      price_1,
      price_2,
      price_3;
    if (this$static._optimumEndIndex != this$static._optimumCurrentIndex) {
      lenRes =
        this$static._optimum[this$static._optimumCurrentIndex].PosPrev -
        this$static._optimumCurrentIndex;
      this$static.backRes =
        this$static._optimum[this$static._optimumCurrentIndex].BackPrev;
      this$static._optimumCurrentIndex =
        this$static._optimum[this$static._optimumCurrentIndex].PosPrev;
      return lenRes;
    }
    this$static._optimumCurrentIndex = this$static._optimumEndIndex = 0;
    if (this$static._longestMatchWasFound) {
      lenMain = this$static._longestMatchLength;
      this$static._longestMatchWasFound = 0;
    } else {
      lenMain = this.#readMatchDistances(this$static);
    }
    numDistancePairs = this$static._numDistancePairs;
    numAvailableBytes =
      this.#getNumAvailableBytes(this$static._matchFinder) + 1;
    if (numAvailableBytes < 2) {
      this$static.backRes = -1;
      return 1;
    }
    if (numAvailableBytes > 273) {
      numAvailableBytes = 273;
    }
    repMaxIndex = 0;
    for (i = 0; i < 4; ++i) {
      this$static.reps[i] = this$static._repDistances[i];
      this$static.repLens[i] = this.#getMatchLen(
        this$static._matchFinder,
        -1,
        this$static.reps[i],
        273
      );
      if (this$static.repLens[i] > this$static.repLens[repMaxIndex]) {
        repMaxIndex = i;
      }
    }
    if (this$static.repLens[repMaxIndex] >= this$static._numFastBytes) {
      this$static.backRes = repMaxIndex;
      lenRes = this$static.repLens[repMaxIndex];
      this.#movePos(this$static, lenRes - 1);
      return lenRes;
    }
    if (lenMain >= this$static._numFastBytes) {
      this$static.backRes =
        this$static._matchDistances[numDistancePairs - 1] + 4;
      this.#movePos(this$static, lenMain - 1);
      return lenMain;
    }
    currentByte = this.#getIndexByte(this$static._matchFinder, -1);
    matchByte = this.#getIndexByte(
      this$static._matchFinder,
      -this$static._repDistances[0] - 1 - 1
    );
    if (
      lenMain < 2 &&
      currentByte != matchByte &&
      this$static.repLens[repMaxIndex] < 2
    ) {
      this$static.backRes = -1;
      return 1;
    }
    this$static._optimum[0].State = this$static._state;
    posState = position & this$static._posStateMask;
    this$static._optimum[1].Price =
      this.#ProbPrices[
        this$static._isMatch[(this$static._state << 4) + posState] >>> 2
      ] +
      this.#getPrice_0(
        this.#getSubCoder(
          this$static._literalEncoder,
          position,
          this$static._previousByte
        ),
        this$static._state >= 7,
        matchByte,
        currentByte
      );
    this.#makeAsChar(this$static._optimum[1]);
    matchPrice =
      this.#ProbPrices[
        (2048 - this$static._isMatch[(this$static._state << 4) + posState]) >>>
          2
      ];
    repMatchPrice =
      matchPrice +
      this.#ProbPrices[(2048 - this$static._isRep[this$static._state]) >>> 2];
    if (matchByte == currentByte) {
      shortRepPrice =
        repMatchPrice +
        this.#GetRepLen1Price(this$static, this$static._state, posState);
      if (shortRepPrice < this$static._optimum[1].Price) {
        this$static._optimum[1].Price = shortRepPrice;
        this.#makeAsShortRep(this$static._optimum[1]);
      }
    }
    lenEnd =
      lenMain >= this$static.repLens[repMaxIndex]
        ? lenMain
        : this$static.repLens[repMaxIndex];
    if (lenEnd < 2) {
      this$static.backRes = this$static._optimum[1].BackPrev;
      return 1;
    }
    this$static._optimum[1].PosPrev = 0;
    this$static._optimum[0].Backs0 = this$static.reps[0];
    this$static._optimum[0].Backs1 = this$static.reps[1];
    this$static._optimum[0].Backs2 = this$static.reps[2];
    this$static._optimum[0].Backs3 = this$static.reps[3];
    len = lenEnd;
    do {
      this$static._optimum[len--].Price = 268435455;
    } while (len >= 2);
    for (i = 0; i < 4; ++i) {
      repLen = this$static.repLens[i];
      if (repLen < 2) {
        continue;
      }
      price_4 =
        repMatchPrice +
        this.#GetPureRepPrice(this$static, i, this$static._state, posState);
      do {
        curAndLenPrice =
          price_4 +
          this.#getPrice(this$static._repMatchLenEncoder, repLen - 2, posState);
        optimum = this$static._optimum[repLen];
        if (curAndLenPrice < optimum.Price) {
          optimum.Price = curAndLenPrice;
          optimum.PosPrev = 0;
          optimum.BackPrev = i;
          optimum.Prev1IsChar = 0;
        }
      } while (--repLen >= 2);
    }
    normalMatchPrice =
      matchPrice +
      this.#ProbPrices[this$static._isRep[this$static._state] >>> 2];
    len = this$static.repLens[0] >= 2 ? this$static.repLens[0] + 1 : 2;
    if (len <= lenMain) {
      offs = 0;
      while (len > this$static._matchDistances[offs]) {
        offs += 2;
      }
      for (; ; ++len) {
        distance = this$static._matchDistances[offs + 1];
        curAndLenPrice =
          normalMatchPrice +
          this.#GetPosLenPrice(this$static, distance, len, posState);
        optimum = this$static._optimum[len];
        if (curAndLenPrice < optimum.Price) {
          optimum.Price = curAndLenPrice;
          optimum.PosPrev = 0;
          optimum.BackPrev = distance + 4;
          optimum.Prev1IsChar = 0;
        }
        if (len == this$static._matchDistances[offs]) {
          offs += 2;
          if (offs == numDistancePairs) {
            break;
          }
        }
      }
    }
    cur = 0;
    while (1) {
      ++cur;
      if (cur == lenEnd) {
        return this.#backward(this$static, cur);
      }
      newLen = this.#readMatchDistances(this$static);
      numDistancePairs = this$static._numDistancePairs;
      if (newLen >= this$static._numFastBytes) {
        this$static._longestMatchLength = newLen;
        this$static._longestMatchWasFound = 1;
        return this.#backward(this$static, cur);
      }
      ++position;
      posPrev = this$static._optimum[cur].PosPrev;
      if (this$static._optimum[cur].Prev1IsChar) {
        --posPrev;
        if (this$static._optimum[cur].Prev2) {
          state =
            this$static._optimum[this$static._optimum[cur].PosPrev2].State;
          if (this$static._optimum[cur].BackPrev2 < 4) {
            state = state < 7 ? 8 : 11;
          } else {
            state = state < 7 ? 7 : 10;
          }
        } else {
          state = this$static._optimum[posPrev].State;
        }
        state = this.#stateUpdateChar(state);
      } else {
        state = this$static._optimum[posPrev].State;
      }
      if (posPrev == cur - 1) {
        if (!this$static._optimum[cur].BackPrev) {
          state = state < 7 ? 9 : 11;
        } else {
          state = this.#stateUpdateChar(state);
        }
      } else {
        if (
          this$static._optimum[cur].Prev1IsChar &&
          this$static._optimum[cur].Prev2
        ) {
          posPrev = this$static._optimum[cur].PosPrev2;
          pos = this$static._optimum[cur].BackPrev2;
          state = state < 7 ? 8 : 11;
        } else {
          pos = this$static._optimum[cur].BackPrev;
          if (pos < 4) {
            state = state < 7 ? 8 : 11;
          } else {
            state = state < 7 ? 7 : 10;
          }
        }
        opt = this$static._optimum[posPrev];
        if (pos < 4) {
          if (!pos) {
            this$static.reps[0] = opt.Backs0;
            this$static.reps[1] = opt.Backs1;
            this$static.reps[2] = opt.Backs2;
            this$static.reps[3] = opt.Backs3;
          } else if (pos == 1) {
            this$static.reps[0] = opt.Backs1;
            this$static.reps[1] = opt.Backs0;
            this$static.reps[2] = opt.Backs2;
            this$static.reps[3] = opt.Backs3;
          } else if (pos == 2) {
            this$static.reps[0] = opt.Backs2;
            this$static.reps[1] = opt.Backs0;
            this$static.reps[2] = opt.Backs1;
            this$static.reps[3] = opt.Backs3;
          } else {
            this$static.reps[0] = opt.Backs3;
            this$static.reps[1] = opt.Backs0;
            this$static.reps[2] = opt.Backs1;
            this$static.reps[3] = opt.Backs2;
          }
        } else {
          this$static.reps[0] = pos - 4;
          this$static.reps[1] = opt.Backs0;
          this$static.reps[2] = opt.Backs1;
          this$static.reps[3] = opt.Backs2;
        }
      }
      this$static._optimum[cur].State = state;
      this$static._optimum[cur].Backs0 = this$static.reps[0];
      this$static._optimum[cur].Backs1 = this$static.reps[1];
      this$static._optimum[cur].Backs2 = this$static.reps[2];
      this$static._optimum[cur].Backs3 = this$static.reps[3];
      curPrice = this$static._optimum[cur].Price;
      currentByte = this.#getIndexByte(this$static._matchFinder, -1);
      matchByte = this.#getIndexByte(
        this$static._matchFinder,
        -this$static.reps[0] - 1 - 1
      );
      posState = position & this$static._posStateMask;
      curAnd1Price =
        curPrice +
        this.#ProbPrices[this$static._isMatch[(state << 4) + posState] >>> 2] +
        this.#getPrice_0(
          this.#getSubCoder(
            this$static._literalEncoder,
            position,
            this.#getIndexByte(this$static._matchFinder, -2)
          ),
          state >= 7,
          matchByte,
          currentByte
        );
      nextOptimum = this$static._optimum[cur + 1];
      nextIsChar = 0;
      if (curAnd1Price < nextOptimum.Price) {
        nextOptimum.Price = curAnd1Price;
        nextOptimum.PosPrev = cur;
        nextOptimum.BackPrev = -1;
        nextOptimum.Prev1IsChar = 0;
        nextIsChar = 1;
      }
      matchPrice =
        curPrice +
        this.#ProbPrices[
          (2048 - this$static._isMatch[(state << 4) + posState]) >>> 2
        ];
      repMatchPrice =
        matchPrice + this.#ProbPrices[(2048 - this$static._isRep[state]) >>> 2];
      if (
        matchByte == currentByte &&
        !(nextOptimum.PosPrev < cur && !nextOptimum.BackPrev)
      ) {
        shortRepPrice =
          repMatchPrice +
          (this.#ProbPrices[this$static._isRepG0[state] >>> 2] +
            this.#ProbPrices[
              this$static._isRep0Long[(state << 4) + posState] >>> 2
            ]);
        if (shortRepPrice <= nextOptimum.Price) {
          nextOptimum.Price = shortRepPrice;
          nextOptimum.PosPrev = cur;
          nextOptimum.BackPrev = 0;
          nextOptimum.Prev1IsChar = 0;
          nextIsChar = 1;
        }
      }
      numAvailableBytesFull =
        this.#getNumAvailableBytes(this$static._matchFinder) + 1;
      numAvailableBytesFull =
        4095 - cur < numAvailableBytesFull ? 4095 - cur : numAvailableBytesFull;
      numAvailableBytes = numAvailableBytesFull;
      if (numAvailableBytes < 2) {
        continue;
      }
      if (numAvailableBytes > this$static._numFastBytes) {
        numAvailableBytes = this$static._numFastBytes;
      }
      if (!nextIsChar && matchByte != currentByte) {
        t = Math.min(numAvailableBytesFull - 1, this$static._numFastBytes);
        lenTest2 = this.#getMatchLen(
          this$static._matchFinder,
          0,
          this$static.reps[0],
          t
        );
        if (lenTest2 >= 2) {
          state2 = this.#stateUpdateChar(state);
          posStateNext = (position + 1) & this$static._posStateMask;
          nextRepMatchPrice =
            curAnd1Price +
            this.#ProbPrices[
              (2048 - this$static._isMatch[(state2 << 4) + posStateNext]) >>> 2
            ] +
            this.#ProbPrices[(2048 - this$static._isRep[state2]) >>> 2];
          offset = cur + 1 + lenTest2;
          while (lenEnd < offset) {
            this$static._optimum[++lenEnd].Price = 268435455;
          }
          curAndLenPrice =
            nextRepMatchPrice +
            ((price = this.#getPrice(
              this$static._repMatchLenEncoder,
              lenTest2 - 2,
              posStateNext
            )),
            price +
              this.#GetPureRepPrice(this$static, 0, state2, posStateNext));
          optimum = this$static._optimum[offset];
          if (curAndLenPrice < optimum.Price) {
            optimum.Price = curAndLenPrice;
            optimum.PosPrev = cur + 1;
            optimum.BackPrev = 0;
            optimum.Prev1IsChar = 1;
            optimum.Prev2 = 0;
          }
        }
      }
      startLen = 2;
      for (repIndex = 0; repIndex < 4; ++repIndex) {
        lenTest = this.#getMatchLen(
          this$static._matchFinder,
          -1,
          this$static.reps[repIndex],
          numAvailableBytes
        );
        if (lenTest < 2) {
          continue;
        }
        lenTestTemp = lenTest;
        do {
          while (lenEnd < cur + lenTest) {
            this$static._optimum[++lenEnd].Price = 268435455;
          }
          curAndLenPrice =
            repMatchPrice +
            ((price_0 = this.#getPrice(
              this$static._repMatchLenEncoder,
              lenTest - 2,
              posState
            )),
            price_0 +
              this.#GetPureRepPrice(this$static, repIndex, state, posState));
          optimum = this$static._optimum[cur + lenTest];
          if (curAndLenPrice < optimum.Price) {
            optimum.Price = curAndLenPrice;
            optimum.PosPrev = cur;
            optimum.BackPrev = repIndex;
            optimum.Prev1IsChar = 0;
          }
        } while (--lenTest >= 2);
        lenTest = lenTestTemp;
        if (!repIndex) {
          startLen = lenTest + 1;
        }
        if (lenTest < numAvailableBytesFull) {
          t = Math.min(
            numAvailableBytesFull - 1 - lenTest,
            this$static._numFastBytes
          );
          lenTest2 = this.#getMatchLen(
            this$static._matchFinder,
            lenTest,
            this$static.reps[repIndex],
            t
          );
          if (lenTest2 >= 2) {
            state2 = state < 7 ? 8 : 11;
            posStateNext = (position + lenTest) & this$static._posStateMask;
            curAndLenCharPrice =
              repMatchPrice +
              ((price_1 = this.#getPrice(
                this$static._repMatchLenEncoder,
                lenTest - 2,
                posState
              )),
              price_1 +
                this.#GetPureRepPrice(this$static, repIndex, state, posState)) +
              this.#ProbPrices[
                this$static._isMatch[(state2 << 4) + posStateNext] >>> 2
              ] +
              this.#getPrice_0(
                this.#getSubCoder(
                  this$static._literalEncoder,
                  position + lenTest,
                  this.#getIndexByte(this$static._matchFinder, lenTest - 1 - 1)
                ),
                1,
                this.#getIndexByte(
                  this$static._matchFinder,
                  lenTest - 1 - (this$static.reps[repIndex] + 1)
                ),
                this.#getIndexByte(this$static._matchFinder, lenTest - 1)
              );
            state2 = this.#stateUpdateChar(state2);
            posStateNext = (position + lenTest + 1) & this$static._posStateMask;
            nextMatchPrice =
              curAndLenCharPrice +
              this.#ProbPrices[
                (2048 - this$static._isMatch[(state2 << 4) + posStateNext]) >>>
                  2
              ];
            nextRepMatchPrice =
              nextMatchPrice +
              this.#ProbPrices[(2048 - this$static._isRep[state2]) >>> 2];
            offset = lenTest + 1 + lenTest2;
            while (lenEnd < cur + offset) {
              this$static._optimum[++lenEnd].Price = 268435455;
            }
            curAndLenPrice =
              nextRepMatchPrice +
              ((price_2 = this.#getPrice(
                this$static._repMatchLenEncoder,
                lenTest2 - 2,
                posStateNext
              )),
              price_2 +
                this.#GetPureRepPrice(this$static, 0, state2, posStateNext));
            optimum = this$static._optimum[cur + offset];
            if (curAndLenPrice < optimum.Price) {
              optimum.Price = curAndLenPrice;
              optimum.PosPrev = cur + lenTest + 1;
              optimum.BackPrev = 0;
              optimum.Prev1IsChar = 1;
              optimum.Prev2 = 1;
              optimum.PosPrev2 = cur;
              optimum.BackPrev2 = repIndex;
            }
          }
        }
      }
      if (newLen > numAvailableBytes) {
        newLen = numAvailableBytes;
        for (
          numDistancePairs = 0;
          newLen > this$static._matchDistances[numDistancePairs];
          numDistancePairs += 2
        ) {}
        this$static._matchDistances[numDistancePairs] = newLen;
        numDistancePairs += 2;
      }
      if (newLen >= startLen) {
        normalMatchPrice =
          matchPrice + this.#ProbPrices[this$static._isRep[state] >>> 2];
        while (lenEnd < cur + newLen) {
          this$static._optimum[++lenEnd].Price = 268435455;
        }
        offs = 0;
        while (startLen > this$static._matchDistances[offs]) {
          offs += 2;
        }
        for (lenTest = startLen; ; ++lenTest) {
          curBack = this$static._matchDistances[offs + 1];
          curAndLenPrice =
            normalMatchPrice +
            this.#GetPosLenPrice(this$static, curBack, lenTest, posState);
          optimum = this$static._optimum[cur + lenTest];
          if (curAndLenPrice < optimum.Price) {
            optimum.Price = curAndLenPrice;
            optimum.PosPrev = cur;
            optimum.BackPrev = curBack + 4;
            optimum.Prev1IsChar = 0;
          }
          if (lenTest == this$static._matchDistances[offs]) {
            if (lenTest < numAvailableBytesFull) {
              t = Math.min(
                numAvailableBytesFull - 1 - lenTest,
                this$static._numFastBytes
              );
              lenTest2 = this.#getMatchLen(
                this$static._matchFinder,
                lenTest,
                curBack,
                t
              );
              if (lenTest2 >= 2) {
                state2 = state < 7 ? 7 : 10;
                posStateNext = (position + lenTest) & this$static._posStateMask;
                curAndLenCharPrice =
                  curAndLenPrice +
                  this.#ProbPrices[
                    this$static._isMatch[(state2 << 4) + posStateNext] >>> 2
                  ] +
                  this.#getPrice_0(
                    this.#getSubCoder(
                      this$static._literalEncoder,
                      position + lenTest,
                      this.#getIndexByte(
                        this$static._matchFinder,
                        lenTest - 1 - 1
                      )
                    ),
                    1,
                    this.#getIndexByte(
                      this$static._matchFinder,
                      lenTest - (curBack + 1) - 1
                    ),
                    this.#getIndexByte(this$static._matchFinder, lenTest - 1)
                  );
                state2 = this.#stateUpdateChar(state2);
                posStateNext =
                  (position + lenTest + 1) & this$static._posStateMask;
                nextMatchPrice =
                  curAndLenCharPrice +
                  this.#ProbPrices[
                    (2048 -
                      this$static._isMatch[(state2 << 4) + posStateNext]) >>>
                      2
                  ];
                nextRepMatchPrice =
                  nextMatchPrice +
                  this.#ProbPrices[(2048 - this$static._isRep[state2]) >>> 2];
                offset = lenTest + 1 + lenTest2;
                while (lenEnd < cur + offset) {
                  this$static._optimum[++lenEnd].Price = 268435455;
                }
                curAndLenPrice =
                  nextRepMatchPrice +
                  ((price_3 = this.#getPrice(
                    this$static._repMatchLenEncoder,
                    lenTest2 - 2,
                    posStateNext
                  )),
                  price_3 +
                    this.#GetPureRepPrice(
                      this$static,
                      0,
                      state2,
                      posStateNext
                    ));
                optimum = this$static._optimum[cur + offset];
                if (curAndLenPrice < optimum.Price) {
                  optimum.Price = curAndLenPrice;
                  optimum.PosPrev = cur + lenTest + 1;
                  optimum.BackPrev = 0;
                  optimum.Prev1IsChar = 1;
                  optimum.Prev2 = 1;
                  optimum.PosPrev2 = cur;
                  optimum.BackPrev2 = curBack + 4;
                }
              }
            }
            offs += 2;
            if (offs == numDistancePairs) break;
          }
        }
      }
    }
  }

  #GetPosLenPrice(
    this$static: any,
    pos: number,
    len: number,
    posState: number
  ) {
    var price,
      lenToPosState = this.#getLenToPosState(len);
    if (pos < 128) {
      price = this$static._distancesPrices[lenToPosState * 128 + pos];
    } else {
      price =
        this$static._posSlotPrices[
          (lenToPosState << 6) + this.#getPosSlot2(pos)
        ] + this$static._alignPrices[pos & 15];
    }
    return price + this.#getPrice(this$static._lenEncoder, len - 2, posState);
  }

  #GetPureRepPrice(
    this$static: any,
    repIndex: number,
    state: number,
    posState: number
  ) {
    var price;
    if (!repIndex) {
      price = this.#ProbPrices[this$static._isRepG0[state] >>> 2];
      price +=
        this.#ProbPrices[
          (2048 - this$static._isRep0Long[(state << 4) + posState]) >>> 2
        ];
    } else {
      price = this.#ProbPrices[(2048 - this$static._isRepG0[state]) >>> 2];
      if (repIndex == 1) {
        price += this.#ProbPrices[this$static._isRepG1[state] >>> 2];
      } else {
        price += this.#ProbPrices[(2048 - this$static._isRepG1[state]) >>> 2];
        price += this.#getPriceBase(this$static._isRepG2[state], repIndex - 2);
      }
    }
    return price;
  }

  #GetRepLen1Price(this$static: any, state: number, posState: number) {
    return (
      this.#ProbPrices[this$static._isRepG0[state] >>> 2] +
      this.#ProbPrices[this$static._isRep0Long[(state << 4) + posState] >>> 2]
    );
  }

  #Init_4(this$static: any) {
    this.#baseInit(this$static);
    this.#init_9(this$static._rangeEncoder);
    this.#initBitModels(this$static._isMatch);
    this.#initBitModels(this$static._isRep0Long);
    this.#initBitModels(this$static._isRep);
    this.#initBitModels(this$static._isRepG0);
    this.#initBitModels(this$static._isRepG1);
    this.#initBitModels(this$static._isRepG2);
    this.#initBitModels(this$static._posEncoders);
    this.#init_3(this$static._literalEncoder);
    for (var i = 0; i < 4; ++i) {
      this.#initBitModels(this$static._posSlotEncoder[i].Models);
    }
    this.#init_2(this$static._lenEncoder, 1 << this$static._posStateBits);
    this.#init_2(
      this$static._repMatchLenEncoder,
      1 << this$static._posStateBits
    );
    this.#initBitModels(this$static._posAlignEncoder.Models);
    this$static._longestMatchWasFound = 0;
    this$static._optimumEndIndex = 0;
    this$static._optimumCurrentIndex = 0;
    this$static._additionalOffset = 0;
  }

  #movePos(this$static: any, num: number) {
    if (num > 0) {
      this.#skip(this$static._matchFinder, num);
      this$static._additionalOffset += num;
    }
  }

  #readMatchDistances(this$static: any) {
    var lenRes = 0;
    this$static._numDistancePairs = this.#getMatches(
      this$static._matchFinder,
      this$static._matchDistances
    );
    if (this$static._numDistancePairs > 0) {
      lenRes = this$static._matchDistances[this$static._numDistancePairs - 2];
      if (lenRes == this$static._numFastBytes)
        lenRes += this.#getMatchLen(
          this$static._matchFinder,
          lenRes - 1,
          this$static._matchDistances[this$static._numDistancePairs - 1],
          273 - lenRes
        );
    }
    ++this$static._additionalOffset;
    return lenRes;
  }

  #releaseMFStream(this$static: any) {
    if (this$static._matchFinder && this$static._needReleaseMFStream) {
      this$static._matchFinder._stream = null;
      this$static._needReleaseMFStream = 0;
    }
  }

  #releaseStreams(this$static: any) {
    this.#releaseMFStream(this$static);
    this$static._rangeEncoder.Stream = null;
  }

  #setDictionarySize_0(this$static: any, dictionarySize: number) {
    this$static._dictionarySize = dictionarySize;
    for (var dicLogSize = 0; dictionarySize > 1 << dicLogSize; ++dicLogSize) {}
    this$static._distTableSize = dicLogSize * 2;
  }

  #setMatchFinder(this$static: any, matchFinderIndex: number) {
    var matchFinderIndexPrev = this$static._matchFinderType;
    this$static._matchFinderType = matchFinderIndex;
    if (
      this$static._matchFinder &&
      matchFinderIndexPrev != this$static._matchFinderType
    ) {
      this$static._dictionarySizePrev = -1;
      this$static._matchFinder = null;
    }
  }

  #writeCoderProperties(this$static: any, outStream: number) {
    this$static.properties[0] =
      (((this$static._posStateBits * 5 + this$static._numLiteralPosStateBits) *
        9 +
        this$static._numLiteralContextBits) <<
        24) >>
      24;
    for (var i = 0; i < 4; ++i) {
      this$static.properties[1 + i] =
        ((this$static._dictionarySize >> (8 * i)) << 24) >> 24;
    }
    this.#write_0(outStream, this$static.properties, 0, 5);
  }

  #writeEndMarker(this$static: any, posState: number) {
    if (!this$static._writeEndMark) {
      return;
    }
    this.#encode_3(
      this$static._rangeEncoder,
      this$static._isMatch,
      (this$static._state << 4) + posState,
      1
    );
    this.#encode_3(
      this$static._rangeEncoder,
      this$static._isRep,
      this$static._state,
      0
    );
    this$static._state = this$static._state < 7 ? 7 : 10;
    this.#encode_0(
      this$static._lenEncoder,
      this$static._rangeEncoder,
      0,
      posState
    );
    var lenToPosState = this.#getLenToPosState(2);
    this.#encode_2(
      this$static._posSlotEncoder[lenToPosState],
      this$static._rangeEncoder,
      63
    );
    this.#encodeDirectBits(this$static._rangeEncoder, 67108863, 26);
    this.#reverseEncode(
      this$static._posAlignEncoder,
      this$static._rangeEncoder,
      15
    );
  }

  #getPosSlot(pos: number) {
    if (pos < 2048) {
      return this.#g_FastPos[pos];
    }
    if (pos < 2097152) {
      return this.#g_FastPos[pos >> 10] + 20;
    }
    return this.#g_FastPos[pos >> 20] + 40;
  }

  #getPosSlot2(pos: number) {
    if (pos < 131072) {
      return this.#g_FastPos[pos >> 6] + 12;
    }
    if (pos < 134217728) {
      return this.#g_FastPos[pos >> 16] + 32;
    }
    return this.#g_FastPos[pos >> 26] + 52;
  }

  #encode(this$static: any, rangeEncoder: any, symbol: any, posState: number) {
    if (symbol < 8) {
      this.#encode_3(rangeEncoder, this$static._choice, 0, 0);
      this.#encode_2(this$static._lowCoder[posState], rangeEncoder, symbol);
    } else {
      symbol -= 8;
      this.#encode_3(rangeEncoder, this$static._choice, 0, 1);
      if (symbol < 8) {
        this.#encode_3(rangeEncoder, this$static._choice, 1, 0);
        this.#encode_2(this$static._midCoder[posState], rangeEncoder, symbol);
      } else {
        this.#encode_3(rangeEncoder, this$static._choice, 1, 1);
        this.#encode_2(this$static._highCoder, rangeEncoder, symbol - 8);
      }
    }
  }

  #encoder$LenEncoder(this$static: any) {
    this$static._choice = this.#initDim(2);
    this$static._lowCoder = this.#initDim(16);
    this$static._midCoder = this.#initDim(16);
    this$static._highCoder = this.#bitTreeEncoder({}, 8);
    for (var posState = 0; posState < 16; ++posState) {
      this$static._lowCoder[posState] = this.#bitTreeEncoder({}, 3);
      this$static._midCoder[posState] = this.#bitTreeEncoder({}, 3);
    }
    return this$static;
  }

  #init_2(this$static: any, numPosStates: number) {
    this.#initBitModels(this$static._choice);
    for (var posState = 0; posState < numPosStates; ++posState) {
      this.#initBitModels(this$static._lowCoder[posState].Models);
      this.#initBitModels(this$static._midCoder[posState].Models);
    }
    this.#initBitModels(this$static._highCoder.Models);
  }

  #setPrices(
    this$static: any,
    posState: any,
    numSymbols: number,
    prices: number[],
    st: number
  ) {
    var a0, a1, b0, b1, i;
    a0 = this.#ProbPrices[this$static._choice[0] >>> 2];
    a1 = this.#ProbPrices[(2048 - this$static._choice[0]) >>> 2];
    b0 = a1 + this.#ProbPrices[this$static._choice[1] >>> 2];
    b1 = a1 + this.#ProbPrices[(2048 - this$static._choice[1]) >>> 2];
    i = 0;
    for (i = 0; i < 8; ++i) {
      if (i >= numSymbols) return;
      prices[st + i] =
        a0 + this.#getPrice_1(this$static._lowCoder[posState], i);
    }
    for (; i < 16; ++i) {
      if (i >= numSymbols) return;
      prices[st + i] =
        b0 + this.#getPrice_1(this$static._midCoder[posState], i - 8);
    }
    for (; i < numSymbols; ++i) {
      prices[st + i] = b1 + this.#getPrice_1(this$static._highCoder, i - 8 - 8);
    }
  }

  #encode_0(
    this$static: any,
    rangeEncoder: any,
    symbol: any,
    posState: number
  ) {
    this.#encode(this$static, rangeEncoder, symbol, posState);
    if (--this$static._counters[posState] == 0) {
      this.#setPrices(
        this$static,
        posState,
        this$static._tableSize,
        this$static._prices,
        posState * 272
      );
      this$static._counters[posState] = this$static._tableSize;
    }
  }

  #encoder$LenPriceTableEncoder(this$static: any) {
    this.#encoder$LenEncoder(this$static);
    this$static._prices = [];
    this$static._counters = [];
    return this$static;
  }

  #getPrice(this$static: any, symbol: number, posState: number) {
    return this$static._prices[posState * 272 + symbol];
  }

  #updateTables(this$static: any, numPosStates: number) {
    for (var posState = 0; posState < numPosStates; ++posState) {
      this.#setPrices(
        this$static,
        posState,
        this$static._tableSize,
        this$static._prices,
        posState * 272
      );
      this$static._counters[posState] = this$static._tableSize;
    }
  }

  #create_1(this$static: any, numPosBits: number, numPrevBits: number) {
    var i, numStates;
    if (
      this$static.m_Coders != null &&
      this$static.m_NumPrevBits == numPrevBits &&
      this$static.m_NumPosBits == numPosBits
    ) {
      return;
    }
    this$static.m_NumPosBits = numPosBits;
    this$static.m_PosMask = (1 << numPosBits) - 1;
    this$static.m_NumPrevBits = numPrevBits;
    numStates = 1 << (this$static.m_NumPrevBits + this$static.m_NumPosBits);
    this$static.m_Coders = this.#initDim(numStates);
    for (i = 0; i < numStates; ++i) {
      this$static.m_Coders[i] = this.#encoder$LiteralEncoder$Encoder2({});
    }
  }

  #getSubCoder(this$static: any, pos: number, prevByte: number) {
    return this$static.m_Coders[
      ((pos & this$static.m_PosMask) << this$static.m_NumPrevBits) +
        ((prevByte & 255) >>> (8 - this$static.m_NumPrevBits))
    ];
  }

  #init_3(this$static: any) {
    var i,
      numStates = 1 << (this$static.m_NumPrevBits + this$static.m_NumPosBits);
    for (i = 0; i < numStates; ++i) {
      this.#initBitModels(this$static.m_Coders[i].m_Encoders);
    }
  }

  #encode_1(this$static: any, rangeEncoder: any, symbol: number) {
    var bit,
      i,
      context = 1;
    for (i = 7; i >= 0; --i) {
      bit = (symbol >> i) & 1;
      this.#encode_3(rangeEncoder, this$static.m_Encoders, context, bit);
      context = (context << 1) | bit;
    }
  }

  #encodeMatched(
    this$static: any,
    rangeEncoder: any,
    matchByte: number,
    symbol: number
  ) {
    var bit,
      i,
      matchBit,
      state,
      same = 1,
      context = 1;
    for (i = 7; i >= 0; --i) {
      bit = (symbol >> i) & 1;
      state = context;
      if (same) {
        matchBit = (matchByte >> i) & 1;
        state += (1 + matchBit) << 8;
        //@ts-ignore
        same = matchBit == bit;
      }
      this.#encode_3(rangeEncoder, this$static.m_Encoders, state, bit);
      context = (context << 1) | bit;
    }
  }

  #encoder$LiteralEncoder$Encoder2(this$static: any) {
    this$static.m_Encoders = this.#initDim(768);
    return this$static;
  }

  #getPrice_0(
    this$static: any,
    matchMode: any,
    matchByte: number,
    symbol: number
  ) {
    var bit,
      context = 1,
      i = 7,
      matchBit,
      price = 0;
    if (matchMode) {
      for (; i >= 0; --i) {
        matchBit = (matchByte >> i) & 1;
        bit = (symbol >> i) & 1;
        price += this.#getPriceBase(
          this$static.m_Encoders[((1 + matchBit) << 8) + context],
          bit
        );
        context = (context << 1) | bit;
        if (matchBit != bit) {
          --i;
          break;
        }
      }
    }
    for (; i >= 0; --i) {
      bit = (symbol >> i) & 1;
      price += this.#getPriceBase(this$static.m_Encoders[context], bit);
      context = (context << 1) | bit;
    }
    return price;
  }

  #makeAsChar(this$static: any) {
    this$static.BackPrev = -1;
    this$static.Prev1IsChar = 0;
  }

  #makeAsShortRep(this$static: any) {
    this$static.BackPrev = 0;
    this$static.Prev1IsChar = 0;
  }
  /** ce */

  /** cs */
  #bitTreeEncoder(this$static: any, numBitLevels: number) {
    this$static.NumBitLevels = numBitLevels;
    this$static.Models = this.#initDim(1 << numBitLevels);
    return this$static;
  }

  #encode_2(this$static: any, rangeEncoder: any, symbol: number) {
    var bit,
      bitIndex,
      m = 1;
    for (bitIndex = this$static.NumBitLevels; bitIndex != 0; ) {
      --bitIndex;
      bit = (symbol >>> bitIndex) & 1;
      this.#encode_3(rangeEncoder, this$static.Models, m, bit);
      m = (m << 1) | bit;
    }
  }

  #getPrice_1(this$static: any, symbol: number) {
    var bit,
      bitIndex,
      m = 1,
      price = 0;
    for (bitIndex = this$static.NumBitLevels; bitIndex != 0; ) {
      --bitIndex;
      bit = (symbol >>> bitIndex) & 1;
      price += this.#getPriceBase(this$static.Models[m], bit);
      m = (m << 1) + bit;
    }
    return price;
  }

  #reverseEncode(this$static: any, rangeEncoder: any, symbol: number) {
    var bit,
      i,
      m = 1;
    for (i = 0; i < this$static.NumBitLevels; ++i) {
      bit = symbol & 1;
      this.#encode_3(rangeEncoder, this$static.Models, m, bit);
      m = (m << 1) | bit;
      symbol >>= 1;
    }
  }

  #reverseGetPrice(this$static: any, symbol: number) {
    var bit,
      i,
      m = 1,
      price = 0;
    for (i = this$static.NumBitLevels; i != 0; --i) {
      bit = symbol & 1;
      symbol >>>= 1;
      price += this.#getPriceBase(this$static.Models[m], bit);
      m = (m << 1) | bit;
    }
    return price;
  }

  #reverseEncode2(
    Models: any,
    startIndex: number,
    rangeEncoder: any,
    NumBitLevels: number,
    symbol: number
  ) {
    var bit,
      i,
      m = 1;
    for (i = 0; i < NumBitLevels; ++i) {
      bit = symbol & 1;
      this.#encode_3(rangeEncoder, Models, startIndex + m, bit);
      m = (m << 1) | bit;
      symbol >>= 1;
    }
  }

  #reverseGetPrice2(
    Models: number[],
    startIndex: number,
    NumBitLevels: number,
    symbol: number
  ) {
    var bit,
      i,
      m = 1,
      price = 0;
    for (i = NumBitLevels; i != 0; --i) {
      bit = symbol & 1;
      symbol >>>= 1;
      price +=
        this.#ProbPrices[(((Models[startIndex + m] - bit) ^ -bit) & 2047) >>> 2];
      m = (m << 1) | bit;
    }
    return price;
  }
  /** ce */

  #initBitModels(probs: number[]) {
    for (var i = probs.length - 1; i >= 0; --i) {
      probs[i] = 1024;
    }
  }

  #ProbPrices: number[] = [];

  #encode_3(this$static: any, probs: number[], index: number, symbol: number) {
    var newBound,
      prob = probs[index];
    newBound = (this$static.Range >>> 11) * prob;
    if (!symbol) {
      this$static.Range = newBound;
      probs[index] = ((prob + ((2048 - prob) >>> 5)) << 16) >> 16;
    } else {
      this$static.Low = this.#add(
        this$static.Low,
        this.#and(this.#fromInt(newBound), [4294967295, 0])
      );
      this$static.Range -= newBound;
      probs[index] = ((prob - (prob >>> 5)) << 16) >> 16;
    }
    if (!(this$static.Range & -16777216)) {
      this$static.Range <<= 8;
      this.#shiftLow(this$static);
    }
  }

  #encodeDirectBits(this$static: any, v: any, numTotalBits: number) {
    for (var i = numTotalBits - 1; i >= 0; --i) {
      this$static.Range >>>= 1;
      if (((v >>> i) & 1) == 1) {
        this$static.Low = this.#add(
          this$static.Low,
          this.#fromInt(this$static.Range)
        );
      }
      if (!(this$static.Range & -16777216)) {
        this$static.Range <<= 8;
        this.#shiftLow(this$static);
      }
    }
  }

  #getProcessedSizeAdd(this$static: any) {
    return this.#add(
      this.#add(this.#fromInt(this$static._cacheSize), this$static._position),
      [4, 0]
    );
  }

  #init_9(this$static: any) {
    this$static._position = this.#P0_longLit;
    this$static.Low = this.#P0_longLit;
    this$static.Range = -1;
    this$static._cacheSize = 1;
    this$static._cache = 0;
  }

  #shiftLow(this$static: any) {
    var temp,
      LowHi = this.#lowBits_0(this.#shru(this$static.Low, 32));
    if (LowHi != 0 || this.#compare(this$static.Low, [4278190080, 0]) < 0) {
      this$static._position = this.#add(
        this$static._position,
        this.#fromInt(this$static._cacheSize)
      );
      temp = this$static._cache;
      do {
        this.#write(this$static.Stream, temp + LowHi);
        temp = 255;
      } while (--this$static._cacheSize != 0);
      this$static._cache = this.#lowBits_0(this$static.Low) >>> 24;
    }
    ++this$static._cacheSize;
    this$static.Low = this.#shl(this.#and(this$static.Low, [16777215, 0]), 8);
  }

  #getPriceBase(Prob: number, symbol: number) {
    return this.#ProbPrices[(((Prob - symbol) ^ -symbol) & 2047) >>> 2];
  }

  /** ce */

  /** cs */
  #encode2(s: string) {
    var ch,
      chars: any[] = [],
      data,
      elen = 0,
      i,
      l = s.length;
    /// Be able to handle binary arrays and buffers.
    if (typeof s == "object") {
      return s;
    } else {
      this.#getChars(s, 0, l, chars, 0);
    }
    /// Add extra spaces in the array to break up the unicode symbols.
    for (i = 0; i < l; ++i) {
      ch = chars[i];
      if (ch >= 1 && ch <= 127) {
        ++elen;
      } else if (!ch || (ch >= 128 && ch <= 2047)) {
        elen += 2;
      } else {
        elen += 3;
      }
    }
    data = [];
    elen = 0;
    for (i = 0; i < l; ++i) {
      ch = chars[i];
      if (ch >= 1 && ch <= 127) {
        data[elen++] = (ch << 24) >> 24;
      } else if (!ch || (ch >= 128 && ch <= 2047)) {
        data[elen++] = ((192 | ((ch >> 6) & 31)) << 24) >> 24;
        data[elen++] = ((128 | (ch & 63)) << 24) >> 24;
      } else {
        data[elen++] = ((224 | ((ch >> 12) & 15)) << 24) >> 24;
        data[elen++] = ((128 | ((ch >> 6) & 63)) << 24) >> 24;
        data[elen++] = ((128 | (ch & 63)) << 24) >> 24;
      }
    }
    return data;
  }
  /** ce */

  #toDouble(a: number[]) {
    return a[1] + a[0];
  }

  /** cs */
  compress(
    str: string ,
    mode: any,
    on_finish?: Function,
    on_progress?: Function
  ) {
    var this$static: any = {},
      percent,
      cbn: any, /// A callback number should be supplied instead of on_finish() if we are using Web Workers.
      sync =
        typeof on_finish == "undefined" && typeof on_progress == "undefined";

    if (!on_finish) {
      cbn = on_finish;
      //@ts-ignore
      on_finish = on_progress = 0;
    }

    if (!on_progress) {
      on_progress = (percent: number) => {
        if (typeof cbn == "undefined") return;


      };
    }
    if (!on_finish) {
      on_finish = (res: any, err: any) => {
        if (typeof cbn == "undefined") return;


      };
    }

    if (sync) {
      this$static.c = this.#LZMAByteArrayCompressor(
        {},
        this.#encode2(str),
        this.#get_mode_obj(mode)
      );
      while (this.#processChunk(this$static.c.chunker));
      return this.#toByteArray(this$static.c.output);
    }

    try {
      this$static.c = this.#LZMAByteArrayCompressor(
        {},
        this.#encode2(str),
        this.#get_mode_obj(mode)
      );

      on_progress(0);
    } catch (err) {
      return on_finish(null, err);
    }

    const self = this;

    function do_action() {
      try {
        var res,
          start = new Date().getTime();

        while (self.#processChunk(this$static.c.chunker)) {
          percent =
            self.#toDouble(this$static.c.chunker.inBytesProcessed) /
            self.#toDouble(this$static.c.length_0);
          /// If about 200 miliseconds have passed, update the progress.
          if (new Date().getTime() - start > 200) {
            //@ts-ignore
            on_progress(percent);

            self.#wait(do_action, 0);
            return 0;
          }
        }
        //@ts-ignore
        on_progress(1);

        res = self.#toByteArray(this$static.c.output);

        /// delay so we don’t catch errors from the on_finish handler
        //@ts-ignore
        self.#wait(on_finish.bind(null, res), 0);
      } catch (err) {
        //@ts-ignore
        on_finish(null, err);
      }
    }

    ///NOTE: We need to wait to make sure it is always async.
    self.#wait(do_action, 0);
  }
  /** ce */
}


