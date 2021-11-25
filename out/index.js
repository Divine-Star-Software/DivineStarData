import { LZMACompress } from "./LZMACompress.js";
import { LMZADecompress } from "./LMZADecompress.js";
/**# Divine Star Data
 * ---
 * Handles the reading and writing of compressed JSON.
 */
export class DivineStarData {
    fileSystem;
    defaultLevel = 9;
    compressor = new LZMACompress();
    decompressor = new LMZADecompress();
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
    }
    /**# Set Compression Level
     * ---
     * Default is 9. Lowest is 1;
     * @param level
     */
    setCompressionLevel(level) {
        if (level > 9 || level < 1) {
            throw new Error();
        }
        this.defaultLevel = level;
    }
    /**# Read
     * ---
     * Read in a compressed JSON file and return it as a JSON object.
     * @param path
     * @returns
     */
    async read(path) {
        let data = null;
        try {
            const rawBuffer = await this.fileSystem.readFile(path);
            const deCompressed = this.decompressor.decompress(rawBuffer);
            data = JSON.parse(deCompressed);
        }
        catch (error) {
            console.log(`Problem loading: ${path}`);
            console.log(error);
        }
        return data;
    }
    /**# Write
     * ---
     * Write a JSON object to the given path in a compressed format.
     * @param path
     * @param data
     */
    async write(path, data) {
        try {
            const rawJson = JSON.stringify(data);
            const compressed = this.compressor.compress(rawJson, this.defaultLevel);
            const buffer = Buffer.from(compressed);
            await this.fileSystem.writeFile(path, buffer);
        }
        catch (error) {
            console.log(`Problem writing: ${path}`);
            console.log(error);
        }
    }
}
