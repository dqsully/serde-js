// eslint-disable-next-line import/prefer-default-export
export class Index {
    public line = 1;

    public column = 1;

    public eof = false;

    private committedLine = 1;

    private committedColumn = 1;

    private committedEof = false;

    public step(char: string | undefined) {
        if (char === undefined) {
            if (!this.eof) {
                this.eof = true;
                this.column += 1;
            }
        } else if (char === '\n') {
            this.line += 1;
            this.column = 1;
        } else {
            this.column += 1;
        }
    }

    public commit() {
        this.committedLine = this.line;
        this.committedColumn = this.column;
        this.committedEof = this.eof;
    }

    public rewind() {
        this.line = this.committedLine;
        this.column = this.committedColumn;
        this.eof = this.committedEof;
    }

    public toString() {
        if (this.eof) {
            return 'End of File';
        }

        return `${this.line}:${this.column}`;
    }

    public clone() {
        const index = new Index();

        index.line = this.line;
        index.column = this.column;
        index.eof = this.eof;
        index.committedLine = this.committedLine;
        index.committedColumn = this.committedColumn;
        index.committedEof = this.committedEof;

        return index;
    }

    public ref(): IndexRef {
        return {
            line: this.line,
            column: this.column,
            eof: this.eof,

            toString: this.toString,
        };
    }
}

export interface IndexRef {
    line: number;
    column: number;
    eof: boolean;

    toString(this: IndexRef): string;
}

export class ParseError extends Error {
    public line?: number;

    public column?: number;

    public eof: boolean;

    constructor(index: Index, message: string) {
        super(`At ${index}: ${message}`);

        if (index.eof) {
            this.eof = true;
        } else {
            this.line = index.line;
            this.column = index.column;
            this.eof = false;
        }
    }
}
