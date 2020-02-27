import { stringifyTokens, TokenFeatures } from './common';
import { Tokenizer } from '../tokenizer/abstract';

export default function intoString(
    data: any,
    tokenizer: Tokenizer,
    features: TokenFeatures,
) {
    const stringifier = stringifyTokens(
        tokenizer(data),
        features,
    );

    let output = '';
    let result = stringifier.next();

    while (!result.done) {
        output += result.value;

        result = stringifier.next();
    }

    return output;
}
