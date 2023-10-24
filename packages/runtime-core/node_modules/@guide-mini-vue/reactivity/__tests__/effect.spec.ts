import { effect, stop } from "../src/effect";
import { reactive } from "../src/reactive";
import { vi } from 'vitest';

describe("effect", () => {
    it("happy path", () => {
        const user = reactive({
            age: 10
        })

        let nextAge;
        effect(() => {
            nextAge = user.age + 1;
        })

        expect(nextAge).toBe(11)

        // update
        user.age++
        expect(nextAge).toBe(12);
    })

    it("should return runner when call effect", () => {
        let foo = 10;
        const runner = effect(() => {
            foo++;
            return "foo"
        })

        expect(foo).toBe(11);
        const r = runner();
        expect(foo).toBe(12);
        expect(r).toBe("foo")
    })

    it('scheduler', () => {
        let dummy;
        let run: any;
        // 调度
        const scheduler = vi.fn(() => {
            run = ruuner;
        });
        const obj = reactive({ foo: 1 });
        const ruuner = effect(() => {
            dummy = obj.foo;
        },
            { scheduler });
        expect(scheduler).not.toHaveBeenCalled();
        expect(dummy).toBe(1);

        // obj.foo=obj.foo+1;会触发get 和set 
        // 不会执行fn 会执行scheduler 也就是 ()=>{ run =ruuner; } 得到run 
        obj.foo++;
        expect(scheduler).toHaveBeenCalledTimes(1);
        expect(dummy).toBe(1);

        // 当执行run的时候触发 ()=>{  dummy = obj.foo; }  这个时候dummy被赋值 得到2
        run();
        expect(dummy).toBe(2);
    });

    it("stop", () => {
        // 当我们执行stop方法，响应式对象再发生改变 就不会触发响应，停止更新
        // 当我们执行runner函数，响应式又会再次触发更新
        let dummy;
        const obj = reactive({ prop: 1 })
        const runner = effect(() => {
            dummy = obj.prop
        })
        obj.prop = 2
        expect(dummy).toBe(2)
        stop(runner);
        // obj.prop = 3;
        obj.prop++
        expect(dummy).toBe(2);
        runner();
        expect(dummy).toBe(3)
    })
    it("onStop", () => {
        // 当调用stop之后 effect第二个参数传入的onStop会被执行
        // 也就是调用stop之后的回调函数，允许用户在stop之后做一些额外的处理
        const obj = reactive({ foo: 1 })
        const onStop = vi.fn()
        let dummy;
        const runner = effect(() => { dummy = obj.foo }, { onStop });

        stop(runner);
        expect(onStop).toBeCalledTimes(1);
    })
})