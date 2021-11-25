/// <reference types="node" />
/**# LMZA Decompress
 *  ---
 *  Handles decompressing LMZA encoded data
 * This is a modified version of LZMA-JS. You can find the original here:
 * https://github.com/LZMA-JS/LZMA-JS
 *
 * It is basically the same but converted to es6 and TypeScript. The only function
 * you now have access to is the decompress function.
 */
export declare class LMZADecompress {
    #private;
    /** ds */
    decompress(byte_arr: number[] | Buffer, on_finish?: Function, on_progress?: Function): any;
}
