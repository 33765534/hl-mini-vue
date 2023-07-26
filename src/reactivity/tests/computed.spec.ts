import { computed } from "../computed";
import { reactive } from "../reactive";

describe("computed", () => {
    it("happy path", () => {
        const user = reactive({ age: 1 })
        const age = computed(() => {
            return user.age
        })
        // 通过对象.value访问计算属性结果
        expect(age.value).toBe(1);
    })

    it("should compute lazily", () => {
        const value = reactive({ foo: 1 })
        const getter = jest.fn(() => {
            return value.foo
        })
        const cValue = computed(getter)

        // lazy 如果没有调用cValue.value,那么getter这个函数都不会被调用
        expect(getter).not.toHaveBeenCalled()

        expect(cValue.value).toBe(1)
        // 调用了cValue.value, getter函数被执行一次
        expect(getter).toHaveBeenCalledTimes(1)

        cValue.value;// 值没有改变的情况下 getter函数不执行
        expect(getter).toHaveBeenCalledTimes(1)

        value.foo = 2 // 依赖的响应式对象发生改变，但没有调用cValue.value,那么getter这个函数都不会被调用
        expect(getter).toHaveBeenCalledTimes(1)

        expect(cValue.value).toBe(2)
        // 调用了cValue.value, getter函数被执行
        expect(getter).toHaveBeenCalledTimes(2)

        cValue.value;
        expect(getter).toHaveBeenCalledTimes(2)

    })
})