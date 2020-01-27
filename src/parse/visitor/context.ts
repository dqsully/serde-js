/* eslint-disable no-bitwise */
// import { AbstractVisitor } from './abstract';

export interface VisitorContext {
    state: number;
}

// export interface ChildVisitorContext<
//     PC extends VisitorContext = VisitorContext,
//     P extends AbstractVisitor<PC> = AbstractVisitor<PC>,
// > extends VisitorContext {
//     parent: PC;
//     _P: P;
// }

// interface ProtoChildVisitorContext<
//     PC extends VisitorContext,
// > extends VisitorContext {
//     parent: PC;
// }

export const INITIAL_STATE = 0;
export const SET_FLAG = 0b0000_0001;
export const SCRATCH_FLAG = 0b0000_0010;
export const LOCK_FLAG = 0b0000_0100;

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
    releaseLock(context: VisitorContext): void {
        context.state &= ~LOCK_FLAG;
    },
};

// export const ChildVisitorContext = {
//     new<
//         PC extends VisitorContext,
//         P extends AbstractVisitor<PC>
//     >(parent: PC): ChildVisitorContext<PC, P> {
//         const context: ProtoChildVisitorContext<PC> = {
//             state: INITIAL_STATE,
//             parent,
//         };

//         return context as ChildVisitorContext<PC, P>;
//     },
// };
