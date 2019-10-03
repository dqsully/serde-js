export type SourceConsumer = (char: string) => void;

export abstract class AbstractSource {
    protected parser: SourceConsumer;

    constructor(parser: SourceConsumer) {
        this.parser = parser;
    }
}
