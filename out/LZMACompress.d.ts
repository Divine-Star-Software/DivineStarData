/**# LZMACompress
 * ---
 * Handles compression of data into a LMZA format.
 * This is a modified version of LZMA-JS. You can find the original here:
 * https://github.com/LZMA-JS/LZMA-JS
 *
 * It is basically the same but converted to es6 and TypeScript. The only function
 * you now have access to is the compress function.
 */
export declare class LZMACompress {
    #private;
    constructor();
    /** cs */
    compress(str: string, mode: any, on_finish?: Function, on_progress?: Function): any;
}
