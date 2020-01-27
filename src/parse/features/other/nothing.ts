// import { Visitor } from '../../visitor/abstract';
import { AbstractFeature, AbstractFeatureParseReturn } from '../abstract';

interface Settings {}
export {
    Settings as NothingFeatureSettings,
};

export default class NothingFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    // We don't use `this` because there are no settings for `BooleanFeature`
    // eslint-disable-next-line class-methods-use-this
    // eslint-disable-next-line require-yield
    public* parse(): AbstractFeatureParseReturn {
        return false;
    }
}
