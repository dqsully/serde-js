import { Stringifiable } from "./stringifiable";

export interface Readable {
    on(event: 'error', callback: (error: any) => void): void;
    on(event: 'data', callback: (chunk: Stringifiable) => void): any;
    on(event: 'end', callback: () => void): any;
}

export interface Writable {
    write(data: string): any;
    end(): any;
}
