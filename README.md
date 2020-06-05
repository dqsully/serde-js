# SerDe JS (unofficial title)
This is a work-in-progress project to build a single JSON/JSON5/Hjson parser to rule them all. The core idea of this library is to be able to compose parsers out of individual language features (like `BooleanFeature`, `DoubleSlashCommentFeature`, etc.) and a "visitor" implementation that creates real data from the language feature parsers. These "visitors" will also be able to store metadata in the output, so that data can be stringified back into its (mostly) original formatting. This is the same concept as "round-trip parsing" in Hjson.

My goal for this project is primarily flexibility, and not speed. This is not meant to be the fastest parser in the world, although I try to take efficiency very seriously.

## Playing around with it
To get started with this project, first make sure you have Node.js and NPM installed, and then clone down this repository and install the NPM dependencies:
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

## Architecture overview
This library is mostly split into two parts - parsing and stringifying. There are some similarities between the two, but there's also a lot that's different.

### Parser architecture
The parser starts with a source - something that will produce characters and drive the parser engine. That source can produce characters asynchronously since the parser engine is built on generator functions, so both strings and streams as sources will be supported.

That parser engine ([src/parse/source/common.ts](./src/parse/source/common.ts)) is where most of the magic happens. It is made from two parts: a rewindable character iterator, and a feature processor.

The character iterator (`parseStringsWithParser`) will buffer all characters until a "commit" message is yielded from the feature processor. And if the feature processor yields a "rewind" message, the character iterator will restart from the beginning of the buffer. It's a bit more complicated than that, but in essence that's how it works.

The feature processor (`parseChars`) is what actually runs the different features on a stack, and it's probably most-complicated code in this project. Every stack frame is a list of features, and the processor will try every one until one succeeds, rewinding the character iterator on every retry, or until all of them fail.

On top of the feature processor run the features themselves, which must be setup ahead-of-time. Each feature will parse a different part of the language, and if a feature succeeds, it will "visit" the data with the configured visitor and "commit" the processed characters. If it fails, it will return a deferred error message explaining why it failed.

And the last part is the visitor, whose job it is to consume the parsed data into a certain format. Different visitors produce different formats for different capabilities. The `NoMetadataVisitor`, for example, ignores all metadata and returns only the real data.

So to recap, Source -> Character Iterator -> Feature Processor -> Features -> Visitor -> Output

### Stringifier architecture
Like the parser, the stringifier starts with a sink - something that will drive the stringifier engine and consume its string chunks. However, the rest of the system is effectively reversed. Sinks are still allowed to be asynchronous though, so strings and streams as sinks will be supported.

The stringifier engine ([src/stringify/source/common.ts](./src/stringify/source/common.ts)) also does quite a bit of work, reading tokens from a tokenizer, validating them, and calling the proper features with these tokens. It's also up there for some of the most complicated code in this project.

A tokenizer is basically the reverse of a visitor from the parser land - it takes in data of a certain format and creates a stream of tokens from it. These tokens may include "invisibles," which are things like whitespace and comments.

A stringifier feature either creates a string from a single token, or a stream of strings from a stream of tokens. This depends on what the feature is meant for. Array features, for example, will handle multiple tokens, and are in charge of outputting the start and end the array, and any separators between values. If a feature can't process the initial token, it should return undefined immediately.

This one isn't as pretty, but it's Input -> (Stringifier Engine <-> Tokenizer) -> Features -> Sink, more or less.

## Feature progress
* Parsable languages
    * [X] JSON
        * [X] Null
        * [X] Boolean
        * [X] Double-quoted string
        * [X] Decimal number
        * [X] Strict-comma object
        * [X] Strict-comma array
        * [X] Any whitespace

    * [X] JSONC (VS Code)
        * [X] JSON
        * [X] Double-slash comment
        * [X] Slash-star comment

    * [X] JSON5
        * [X] JSON (minus object, array, and number)
        * [X] ECMAScript IdentifierName
        * [X] Lax-comma object
        * [X] Lax-comma array
        * [X] Single-quoted string
        * [X] Hexadecimal number
        * [X] Lax decimal number (start/end with ., start with +)
        * [X] Infinity
        * [X] NaN
        * [X] Double-slash comment
        * [X] Slash-star comment

    * [ ] Hjson
        * [X] JSON (minus object and array)
        * [ ] Optional-comma object
        * [ ] Quoteless key string
        * [ ] Optional-comma array
        * [X] Single-quoted string
        * [ ] Quoteless string
        * [ ] Multiline string
        * [X] Double-slash comment
        * [X] Slash-star comment
        * [X] Hash comment
        * [ ] Single-line whitespace

    * Other
        * [ ] Octal number (*built but untested*)
        * [ ] Binary number (*built but untested*)

* Stringifiable languages
    * [X] JSON
        * [X] Null
        * [X] Boolean
        * [X] Double-quoted string
        * [X] Decimal number
        * [X] Strict-comma object
        * [X] Strict-comma array
        * [X] Any whitespace

    * [X] JSONC
        * [X] JSON (untested whitespace)
        * [X] Double-slash comments
        * [X] Slash-star comments

    * [ ] JSON5
        * [X] JSON (minus object, array, and number)
        * [ ] ECMAScript IdentifierName
        * [ ] Lax-comma object
        * [ ] Lax-comma array
        * [X] Single-quoted string
        * [ ] Hexadecimal number
        * [ ] Lax decimal number (start/end with ., start with +)
        * [ ] Infinity
        * [ ] NaN
        * [X] Double-slash comment
        * [X] Slash-star comment

    * [ ] Hjson
        * [X] JSON (minus object and array)
        * [ ] Optional-comma object
        * [ ] Quoteless key string
        * [ ] Optional-comma array
        * [X] Single-quoted string
        * [ ] Quoteless string
        * [ ] Multiline string
        * [X] Double-slash comment
        * [X] Slash-star comment
        * [X] Hash comment
        * [ ] Single-line whitespace

* In-memory formats
    * [X] Just the data
        * [X] Visitor
        * [X] Tokenizer

    * [ ] Separate AST for metadata
        * [X] Visitor
        * [ ] Tokenizer

    * [X] Combined AST with data and metadata
        * [X] Visitor
        * [X] Tokenizer

    * [ ] Store metadata "invisibly" in output objects and arrays
        * [ ] Visitor
        * [ ] Tokenizer

* Sources
    * [X] String
    * [ ] Stream (*built but untested*)

* Sinks
    * [X] String
    * [ ] Stream (*built but untested*)

* Other features
    * [X] Full unicode support (thanks Rust for the inspiration!)
    * [X] Parser error messages with location data
    * [ ] Recursion detection on sinks
    * [ ] Stringifier error messages with a data "stack trace"
    * [ ] Tests
        * [ ] Features
        * [ ] Sources
        * [ ] Sinks
        * [ ] Visitors
        * [ ] Tokenizers
        * [ ] Preset compliance
        * [ ] Round-trip integration tests
