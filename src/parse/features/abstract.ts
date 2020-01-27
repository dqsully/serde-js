import { Visitor, Visitors } from '../visitor/abstract';

export interface ParseChild {
    visitor: Visitor,
    features: AbstractFeature[],
    commitUntilNow: boolean,
    whitespaceMode?: boolean,
}

export type AbstractFeatureParseReturn = Generator<
    undefined | true | ParseChild,
    boolean | (() => string),
    string | undefined
>;

export abstract class AbstractFeature<S extends object = object> {
    public abstract settings: S;

    public abstract parse(
        char: string,
        visitor: Visitor,
        visitors: Visitors,
    ): AbstractFeatureParseReturn;
}

/*
    yield `undefined` to read the next char
    yield `true` to commit the latest read chars, and read the next
    yield `impl ParseChild` to run another parser, committing it's parsed chars

    return `true` to commit the latest read chars and stop parsing
    return `false` to ignore the latest read chars, but stop parsing
    return a string as a parser error message

    yields a single-character string when there's data left
    yields undefined when EOF is reached
*/

/*
    Need to be able to:
        consume/commit
        peek
        pass context on to child
*/
