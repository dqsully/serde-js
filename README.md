# SerDe JS (unofficial title)
This is a work-in-progress project to build a single JSON/JSON5/Hjson parser to rule them all. The core idea of this library is to be able to compose parsers out of individual language features (like `BooleanFeature`, `DoubleSlashCommentFeature`, etc.) and a "visitor" implementation that creates real data from the language feature parsers. These "visitors" will also be able to store metadata in the output, so that data can be stringified back into its (mostly) original formatting. This is the same concept as "round-trip parsing" in Hjson.

My goal for this project is primarily flexibility, and not speed. This is not mean't to be the fastest parser in the world, although I try to take efficiency very seriously when it's important.

At the moment only a handful of language features are built out, although they don't "visit" any metadata yet, and there's only one "visitor" implementation that ignores metadata altogether. Eventually I intend to build out all the features of JSON, JSON5 (or JSON6, JSOX, etc.), Hjson, and maybe even some other features like a proper `Date` type. The visitors I'd like to build include one that stores metadata like Hjson but with a symbol key instead of `__COMMENTS__`, one that stores metadata in a separate AST (kinda similar to jju), and of course one that doesn't store metadata at all.

## Playing around with it
To get started with this project, make sure you have Node.js and NPM installed, then clone down this repository and install the NPM dependencies:
```
git clone https://github.com/dqsully/serde-js
cd serde-js
npm install
```

The entire project is written in TypeScript, so you will need to compile it to JavaScript before Node.js can run it:
```
npm run build
```
--or--
```
npx tsc [--watch]
```

The compiled JavaScript should now be in a new `dist` folder, where you can run my proof-of-concept test file.
```
nodejs dist/test
```

The source for this file is at [`./src/test.ts`](./src/test.ts), and I use it to test if the features I build work properly. Try playing around and disabling some of the features or reconfiguring them, or breaking the input `data` string to see this library in action. This is very much still a WIP so some of the error messages really need work.
