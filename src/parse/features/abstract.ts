import { Visitors, Visitor } from '../visitor/abstract';

export enum FeatureAction {
    ParseChild,
    PeekAhead,
}

export interface ParseChild {
    action: FeatureAction.ParseChild,

    visitor: Visitor,
    features: AbstractFeature[],
    commitUntilNow: boolean,
    whitespaceMode?: boolean,
    peekFinalizers?: PeekAhead,
}

export interface PeekAhead {
    action: FeatureAction.PeekAhead,

    finalizers: Peeker[],
    fillers: Peeker[],
}

export enum FeatureResult {
    Commit,
    Ignore,
    CommitUntilLast,
}

export type AbstractFeatureParseReturn = Generator<
    undefined | true | ParseChild | PeekAhead,
    FeatureResult | (() => string),
    string | undefined
>;

export abstract class AbstractFeature<S extends object = object> {
    public abstract settings: S;

    public abstract parse(
        char: string,
        visitor: Visitor,
        visitors: Visitors,
        peekFinalizers?: PeekAhead,
    ): AbstractFeatureParseReturn;
}

/*
    yield `undefined` to read the next char
    yield `true` to commit the latest read chars, and read the next
    yield `impl ParseChild` to run another parser, committing it's parsed chars
    yield `impl PeekAhead` to

    return `true` to commit the latest read chars and stop parsing
    return `false` to ignore the latest read chars, but stop parsing
    return `-1` to redo
    return a string as a parser error message

    yields a single-character string when there's data left
    yields undefined when EOF is reached
*/

export type AbstractFeaturePeekReturn = Generator<
    undefined,
    boolean | (() => string),
    string | undefined
>;

export interface Peeker {
    peek(
        char: string,
    ): AbstractFeaturePeekReturn;
}

/*
    yield `undefined` to read the next char

    return `true` to commit all the read chars
    return `false` to commit all but the last char
    return a function as a parser error message
*/

/*
    Need to be able to:
        consume/commit
        peek
        pass context on to child
*/
