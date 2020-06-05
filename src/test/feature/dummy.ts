import {
    AbstractFeature, AbstractFeatureParseReturn, FeatureResult, Peekers, FeatureAction,
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
        _visitors: Visitors,
        peekers?: Peekers,
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

        if (peekers !== undefined) {
            yield {
                action: FeatureAction.PeekAhead,
                peekers,
            };
        }

        visitor.impl.visitValue(visitor.context, this.settings.id);

        // Commit all parsed chars
        if (peekers !== undefined) {
            return FeatureResult.CommitUntilLast;
        } else {
            return FeatureResult.Commit;
        }
    }
}
