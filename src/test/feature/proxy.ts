import { AbstractFeature, AbstractFeatureParseReturn, Peekers } from '../../parse/features/abstract';
import { Visitor, Visitors } from '../../parse/visitor/abstract';

export interface ProxyFeatureSettings {
    feature: AbstractFeature;
    callback: (value: ReturnType<AbstractFeatureParseReturn['next']>) => void;
}

export default class ProxyFeature extends AbstractFeature<ProxyFeatureSettings> {
    public settings: ProxyFeatureSettings;

    constructor(settings: ProxyFeatureSettings) {
        super();
        this.settings = settings;
    }

    public* parse(
        firstChar: string,
        visitor: Visitor,
        visitors: Visitors,
        peekers?: Peekers,
    ): AbstractFeatureParseReturn {
        const iterator = this.settings.feature.parse(
            firstChar,
            visitor,
            visitors,
            peekers,
        );

        // Generators don't use yielded arguments on the first `next` call
        let returned = iterator.next();

        this.settings.callback(returned);

        while (true) {
            if (returned.done) {
                return returned.value;
            } else if (returned.done === false) {
                const given = yield returned.value;

                returned = iterator.next(given);

                this.settings.callback(returned);
            } else {
                throw new Error('Unexpected done state from iterator');
            }
        }
    }
}
