import { AbstractFeature } from "../abstract";

export interface Context {
    variant: boolean;
    nextChar: number;
}

const trueChars = 'true'.split('');
const falseChars = 'false'.split('');

export class BooelanFeature extends AbstractFeature<Context> {
    public parseChar(char: string, context?: Context): Context | null {
        if (context === undefined) {
            if (char === 't') {
                return {
                    variant: true,
                    nextChar: 1,
                };
            } else if (char === 'f') {
                return {
                    variant: false,
                    nextChar: 1,
                };
            } else {
                return null;
            }
        } else if (context.variant) {
            if (char === trueChars[context.nextChar]) {
                context.nextChar++;
                return context;
            } else {
                return null;
            }
        } else {
            if (char === falseChars[context.nextChar]) {
                context.nextChar++;
                return context;
            } else {
                return null;
            }
        }
    }
}
