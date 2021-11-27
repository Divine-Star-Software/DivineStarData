<h1 align="center">
 ⛯ Divine Star Data ⛯
</h1>
 
<p align="center">
<img src="https://divinestarapparel.com/wp-content/uploads/2021/02/logo-small.png"/>
</p>

---

![GitHub top language](https://img.shields.io/github/languages/top/lucasdamianjohnson/DivineStarData?color=purple&style=plastic)
![GitHub repo size](https://img.shields.io/github/repo-size/lucasdamianjohnson/DivineStarData?color=purple&style=plastic)
![npm own loads](https://img.shields.io/npm/dt/dsdata?color=purple&style=plastic)
![GitHub latest release](https://img.shields.io/github/v/release/lucasdamianjohnson/DivineStarData?color=purple&style=plastic)
![GitHub latest version](https://img.shields.io/npm/v/dsdata?color=purple&style=plastic)
![GitHub last commit](https://img.shields.io/github/last-commit/lucasdamianjohnson/DivineStarData?color=purple&style=plastic)
![GitHub commit actiivty](https://img.shields.io/github/commit-activity/y/lucasdamianjohnson/DivineStarData?color=purple&style=plastic)
![GitHub followers](https://img.shields.io/github/followers/lucasdamianjohnson?color=purple&style=plastic)
![GitHub stars](https://img.shields.io/github/stars/lucasdamianjohnson/DivineStarData?color=purple&style=plastic)
![GitHub watchers](https://img.shields.io/github/watchers/lucasdamianjohnson/DivineStarData?color=purple&style=plastic)
 

# What is this?

A JSON compressor. It compresses data using the LZMA algorithm. It uses a port of LZMA-JS to TypeScript. Check out the original repo here:
[link](https://github.com/LZMA-JS/LZMA-JS)

# Why?

Makes it easy to just get and store compressed json data. This is useful is your app generates a lot of data and you want to keep a small footprint on the disk. 

## Why make it? 

Divine Star has several projects that need to store compressed JSON data. All of Divine Star’s projects are written in TypeScript. The node module for LMZA-JS did not have a TypeScript version and was not as flexible as needed. It is still a great library, but it's getting a little out of date. Please show respect to the original creators and their hard work. 

# Improvements 

Just a list of basic improvements/changes that were made to the library:

- The module exports an ES6 class which can then be instantiated. 
- All functions that the user does not need to access are made private with the new ‘#’ private instance marker. 
- This module makes it easier to move the compression and decompression into any context within an Electron node-integration environment or server side.
- The helper class makes it easy to just read and write json async without dealing with the compression. 


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

# Use Just The Converted LZMA-JS

If you want access to just the converted LZMA-JS library just clone the repo and extract the .ts or .js files for the compressor or
decompressor. Then you can use them in your project and import their respective classes like any other ES6 class. 



