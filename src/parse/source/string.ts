import { AbstractSource, SourceConsumer } from "./abstract";

function* iterateString(string: string) {
    let char;

    for (char of string) {
        yield char;
    }
}

export class StringSource extends AbstractSource {
    private iterator: Generator<string, void>;

    constructor(parser: SourceConsumer, input: string) {
        super(parser);

        this.iterator = iterateString(input);
    }
}
