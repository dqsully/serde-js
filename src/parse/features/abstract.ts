import { ParseConfig } from "../config";
import { AbstractValueVisitor, Visitor } from "../visitor/abstract";

export abstract class AbstractFeature<C extends {}> {
    protected config: ParseConfig;

    constructor(config: ParseConfig) {
        this.config = config;
    }

    public abstract parseChar(
        char: string,
        context: C | undefined,
        visitor: Visitor<AbstractValueVisitor<any>>,
    ): C | Error | null;
}
