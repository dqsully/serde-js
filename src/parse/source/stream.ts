import { Visitor, AbstractRootVisitor, Visitors } from '../visitor/abstract';
import parseStrings from './common';
import { AbstractFeature } from '../features/abstract';

export default function parseStream(
    data: NodeJS.ReadableStream,
    rootVisitor: Visitor<AbstractRootVisitor<any>>,
    rootFeatures: AbstractFeature[],
    visitors: Visitors,
): Promise<any> {
    const parser = parseStrings(
        ''[Symbol.iterator](),
        rootVisitor,
        rootFeatures,
        visitors,
    );

    return new Promise((resolve, reject) => {
        data.on('data', (chunk) => {
            try {
                const strChunk = chunk.toString();

                parser.next(strChunk[Symbol.iterator]());
            } catch (error) {
                reject(error);
            }
        });

        data.on('end', () => {
            try {
                let result;

                do {
                    result = parser.next();
                } while (!result.done);

                resolve(result.value);
            } catch (error) {
                reject(error);
            }
        });
    });
}
