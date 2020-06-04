import {
    AbstractFeature, AbstractFeatureParseReturn, FeatureResult, PeekAhead,
} from '../../parse/features/abstract';
import { Visitor, Visitors } from '../../parse/visitor/abstract';

export interface DummyFeatureSettings {
    id: symbol;
    consume?: string;
}

export default class DummyFeature extends AbstractFeature<DummyFeatureSettings> {
    public settings: Required<DummyFeatureSettings>;

    constructor(settings: DummyFeatureSettings) {
        super();
        this.settings = {
            id: settings.id,
            consume: settings.consume ?? '@',
        };
    }

    public* parse(
        firstChar: string,
        visitor: Visitor,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _visitors: Visitors,
        peekFinalizers?: PeekAhead,
    ): AbstractFeatureParseReturn {
        if (this.settings.consume.length === 0) {
            visitor.impl.visitValue(visitor.context, this.settings.id);

            return FeatureResult.Ignore;
        }

        if (firstChar !== this.settings.consume[0]) {
            return () => `dummy feature (${this.settings.id.toString()}): expected '${firstChar}' to be '${this.settings.consume[0]}'`;
        }

        let char: string | undefined;

        for (let i = 1; i < this.settings.consume.length; i += 1) {
            // Read next character
            char = yield;

            if (char === undefined) {
                return () => `dummy feature (${this.settings.id.toString()}): unexpected end of file`;
            }
            if (char !== this.settings.consume[i]) {
                return () => `dummy feature (${this.settings.id.toString()}): expected '${char}' to be '${this.settings.consume[i]}'`;
            }
        }

        if (peekFinalizers !== undefined) {
            yield peekFinalizers;
        }

        visitor.impl.visitValue(visitor.context, this.settings.id);

        // Commit all parsed chars
        if (peekFinalizers !== undefined) {
            return FeatureResult.CommitUntilLast;
        } else {
            return FeatureResult.Commit;
        }
    }
}
