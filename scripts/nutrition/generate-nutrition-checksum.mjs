import{readFile}from'node:fs/promises';import{sha256}from'./lib.mjs';const p=process.argv[2]??'data/nutrition/imports/titan-curated-1.0.4.json';console.log(`${sha256(await readFile(p))}  ${p}`)
