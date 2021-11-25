<h1 align="center">
 ⛯ Divine Star Data ⛯
</h1>
 
<p align="center">
<img src="https://divinestarapparel.com/wp-content/uploads/2021/02/logo-small.png"/>
</p>

---

# What is this?

A JSON compressor. It compresses data using the LZMA algorithm. It uses a port of LZMA-JS to TypeScript. Check out the original repo here:
[link](https://github.com/LZMA-JS/LZMA-JS)

# Why?

Divine Star has several projects that need to store compressed JSON data. All of Divine Star’s projects are written in TypeScript. The node module did not have a TypeScript version and was not as flexible as needed. This module makes it easy to move the compression and decompression into any context within an Electron node-integration environment or server side..

# Current Features

- Read in compressed JSON
- Write a compressed JSON file
- Change Compression Level

# How To Use

Start a new node project with these commands:

```console
npm init
npm i --save-dev typescript @types/node
npm i --save dsdata

```

Change your package.json to include:

```json
{
  "type": "module"
}
```

Create a folder for your TypeScript files and make a new tsconfig file. Change the tsconfig to be like:

```json
{
  "target": "esNext",
  "module": "esNext",
  "moduleResolution": "node",
  "types": ["node", "dsdata"]
}
```

Finally if you want to use Divine Star Data simply import it and create a new instance by passing it fs/promises. 


```typescript
import { DivineStarData } from "dsdata";
import * as fs from "fs/promises";
const DSD = new DivineStarData(fs);

(async()=>{
    const jsonData =[
        {test:1},
        {test:1},
        {test:1},
        {test:1},
        {test:1},
        {test:1},
        {test:1},
        {test:1},
        {test:1},
        {test:1},
    ];
   await  DSD.write("./test.dsd",jsonData);
   const data = await DSD.read("./test.dsd");
   console.log(data);
})();
````


