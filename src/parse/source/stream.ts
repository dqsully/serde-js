import { AbstractSource, SourceConsumer } from "./abstract";
import { Readable } from "../../types/stream";

function* iterateString(string: string) {
    let char;

    for (char of string) {
        yield char;
    }
}

export class StreamSource extends AbstractSource {
    private stream: Readable;
    private chunkIterator?: Generator<string, void>;

    constructor(parser: SourceConsumer, input: Readable) {
        super(parser);

        this.stream = input;
    }
}
