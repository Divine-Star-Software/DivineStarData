/// <reference types="node" />
import type * as fs from "fs/promises";
import { LZMACompress } from "./LZMACompress.js";
import { LMZADecompress } from "./LMZADecompress.js";
/**# Divine Star Data
 * ---
 * Handles the reading and writing of compressed JSON.
 */
export declare class DivineStarData {
    private fileSystem;
    defaultLevel: number;
    compressor: LZMACompress;
    decompressor: LMZADecompress;
    constructor(fileSystem: typeof fs);
    /**# Set Compression Level
     * ---
     * Default is 9. Lowest is 1;
     * @param level
     */
    setCompressionLevel(level: number): void;
    /**# Read
     * ---
     * Read in a compressed JSON file and return it as a JSON object.
     * @param path
     * @returns
     */
    read(path: string): Promise<any>;
    /**# Write
     * ---
     * Write a JSON object to the given path in a compressed format.
     * @param path
     * @param data
     */
    write(path: string, data: object): Promise<void>;
}
