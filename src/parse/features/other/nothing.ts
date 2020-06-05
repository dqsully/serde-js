// import { Visitor } from '../../visitor/abstract';
import { AbstractFeature, AbstractFeatureParseReturn, FeatureResult } from '../abstract';

interface Settings {}
export {
    Settings as NothingFeatureSettings,
};

export default class NothingFeature extends AbstractFeature<Settings> {
    public settings: Settings = {};

    // eslint-disable-next-line require-yield
    public* parse(): AbstractFeatureParseReturn {
        return FeatureResult.Ignore;
    }
}
