import { isRactive, reactive } from "../reactive";

describe("reactive", () => {
    it("happy path", () => {
        const original = { foo: 1 }
        const observed = reactive(original);

        expect(observed).not.toBe(original);
        expect(observed.foo).toBe(1);
        expect(isRactive(observed)).toBe(true);
        expect(isRactive(original)).toBe(false);
    })

    it("nested reactive", () => {
        const original = { nested: { foo: 1 }, array: [{ bar: 2 }] }
        const observed = reactive(original);
        expect(isRactive(observed.nested)).toBe(true);
        expect(isRactive(observed.array)).toBe(true);
        expect(isRactive(observed.array[0])).toBe(true);
        
    })
})