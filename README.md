# Examples and minigames for PIXIJs and Colfio library

![Preview](./docs/preview.png)
## Live demo
- all examples can bee found live on the [official webpage](https://aphgames.io/docs/learning/examples/pixi-intro/animation)

## Docs
- documentation of the ECSLite library that is used for most examples can be found live [here](https://aphgames.io/docs/learning/tutorials/ecsdocs)

## How to run this project
- the project is powered by ParcelJS, TypeScript, PixiJS and Colfio
- install [NodeJS](https://nodejs.org/en/download/) (Node >= 18)
- enable **pnpm** (this package uses pnpm, not npm): `corepack enable` or `npm i -g pnpm`
- from the Colfio repo root, install the engine once: `pnpm install` (examples alias `colfio` → `../src`)
- in this folder, run `pnpm install`
- run `pnpm run generate-views` to generate HTML files from examples-info.json
- run `pnpm run dev` and open **http://localhost:1234/** (do not open `view/*.html` via Live Server or `file://` — bare imports like `pixi.js` only resolve through Parcel)

Do not mix `npm install` with an existing pnpm `node_modules` — if install fails after switching package managers, delete `node_modules` (and any `package-lock.json`) then run `pnpm install` again.

## Deployment
- run `pnpm run build` and find your project in the `build` folder
