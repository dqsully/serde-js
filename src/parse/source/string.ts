import { Stringifiable } from '../../types/stringifiable';
import parseStrings from './common';
import { Visitor, Visitors, AbstractRootVisitor } from '../visitor/abstract';
import { AbstractFeature } from '../features/abstract';

export default function parseString(
    data: Stringifiable,
    rootVisitor: Visitor<AbstractRootVisitor<any>>,
    rootFeatures: AbstractFeature[],
    visitors: Visitors,
) {
    const parser = parseStrings(
        data.toString()[Symbol.iterator](),
        rootVisitor,
        rootFeatures,
        visitors,
    );

    let result;

    do {
        result = parser.next();
    } while (!result.done);

    return result.value;
}
