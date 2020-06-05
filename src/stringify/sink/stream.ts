import stream from 'stream';
import { Tokenizer } from '../tokenizer/abstract';
import { TokenFeatures, stringifyTokens } from './common';

export default function intoStream(
    data: any,
    tokenizer: Tokenizer,
    features: TokenFeatures,
) {
    const stringifier = stringifyTokens(
        tokenizer(data),
        features,
    );

    let buf = '';
    let result: IteratorResult<string, void> = stringifier.next();

    return new stream.Readable({
        read(size: number) {
            if (result.done && buf.length === 0) {
                this.push(null);
                return;
            }

            while (!result.done && buf.length < size) {
                buf += result.value;

                result = stringifier.next();
            }

            const chunk = buf.slice(0, size);
            buf = buf.slice(size);

            this.push(chunk);
        },
    });
}
