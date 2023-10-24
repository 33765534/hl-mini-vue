import { isReadonly, shallowReadonly } from "../src/reactive";
import { vi } from 'vitest';

describe("readonly", () => {
    it("happy path", () => {
        // not set 
        const original = { foo: 1, bar: { baz: 2 } }
        const wrapped = shallowReadonly(original);
        expect(isReadonly(wrapped)).toBe(true)
        expect(isReadonly(wrapped.bar)).toBe(false)
    })

    it("warn then call set", () => {
        console.warn = vi.fn()

        const user = shallowReadonly({
            age: 10
        })
        user.age = 11;
        // 当触发set readonly会抛出告警
        expect(console.warn).toBeCalled()
    })
})