import type * as fs from "fs/promises";
import { LZMACompress } from "./LZMACompress.js";
import { LMZADecompress } from "./LMZADecompress.js";
/**# Divine Star Data
 * ---
 * Handles the reading and writing of compressed JSON.
 */
export class DivineStarData {
  defaultLevel = 9;
  compressor = new LZMACompress();
  decompressor = new LMZADecompress();
  constructor(private fileSystem: typeof fs) {}

  /**# Set Compression Level
   * ---
   * Default is 9. Lowest is 1;
   * @param level
   */
  setCompressionLevel(level: number) {
    if (level > 9 || level < 1) {
      throw new Error();
    }
    this.defaultLevel = level;
  }
  /**# Read
   * ---
   * Read in a compressed JSON file and return it as a JSON object.
   * @param path
   * @param onError - optional - Function to run if error occurs. Will be passed the error obj.
   * @returns data | null if error
   */
  async read(path: string, onError?: Function): Promise<any> {
    let data: any = null;
    try {
      const rawBuffer = await this.fileSystem.readFile(path);
      const deCompressed = this.decompressor.decompress(rawBuffer);
      data = JSON.parse(deCompressed);
    } catch (error: any) {
      console.log(`Problem loading: ${path}`);
      console.log(error);
      if (onError) {
        onError(error);
      }
    }
    return data;
  }
  /**# Write
   * ---
   * Write a JSON object to the given path in a compressed format.
   * @param path
   * @param data
   * @param onError - optional - Function to run if error occurs. Will be passed the error obj.
   */
  async write(path: string, data: object, onError?: Function) {
    try {
      const rawJson = JSON.stringify(data);
      const compressed = this.compressor.compress(rawJson, this.defaultLevel);
      const buffer = Buffer.from(compressed);
      await this.fileSystem.writeFile(path, buffer);
    } catch (error: any) {
      console.log(`Problem writing: ${path}`);
      console.log(error);
      if (onError) {
        onError(error);
      }
    }
  }
}
