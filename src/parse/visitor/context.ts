/* eslint-disable no-bitwise */
export interface VisitorContext {
    state: number;
}

export const INITIAL_STATE = 0;
export const SET_FLAG = 0b0000_0001;
export const SCRATCH_FLAG = 0b0000_0010;
export const LOCK_FLAG = 0b0000_0100;
export const NOT_EMPTY_FLAG = 0b0000_1000;

export const VisitorContext = {
    new(): VisitorContext {
        return {
            state: INITIAL_STATE,
        };
    },

    isSet(context: VisitorContext): boolean {
        return (context.state & SET_FLAG) > 0;
    },
    set(context: VisitorContext) {
        context.state |= SET_FLAG;
    },

    assertIsSet(context: VisitorContext, message: string): void {
        if (!(context.state & SET_FLAG)) {
            throw new Error(message);
        }
    },
    assertIsNotSet(context: VisitorContext, message: string): void {
        if (context.state & SET_FLAG) {
            throw new Error(message);
        }
    },

    hasScratch(context: VisitorContext): boolean {
        return (context.state & SCRATCH_FLAG) > 0;
    },
    setHasScratch(context: VisitorContext) {
        context.state |= SCRATCH_FLAG;
    },
    clearHasScratch(context: VisitorContext) {
        context.state &= ~SCRATCH_FLAG;
    },

    assertHasScratch(context: VisitorContext, message: string): void {
        if (!(context.state & SCRATCH_FLAG)) {
            throw new Error(message);
        }
    },
    assertDoesntHaveScratch(context: VisitorContext, message: string): void {
        if (context.state & SCRATCH_FLAG) {
            throw new Error(message);
        }
    },

    getLock(context: VisitorContext, message: string): void {
        if (context.state & LOCK_FLAG) {
            throw new Error(message);
        }
        context.state |= LOCK_FLAG;
    },
    assertNotLocked(context: VisitorContext, message: string): void {
        if (context.state & LOCK_FLAG) {
            throw new Error(message);
        }
    },
    releaseLock(context: VisitorContext, message: string): void {
        if (!(context.state & LOCK_FLAG)) {
            throw new Error(message);
        }
        context.state &= ~LOCK_FLAG;
    },
    hasLock(context: VisitorContext): boolean {
        return !!(context.state & LOCK_FLAG);
    },

    setNotEmpty(context: VisitorContext): void {
        context.state |= NOT_EMPTY_FLAG;
    },
    isEmpty(context: VisitorContext): boolean {
        return !(context.state & NOT_EMPTY_FLAG);
    },
};
