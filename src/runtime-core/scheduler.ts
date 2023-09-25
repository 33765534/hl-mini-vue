let queue: any[] = [];
let isFlushPending = false;

const p = Promise.resolve();
export function nextTick(fn) {
    return fn ? p.then(fn) : p
}

export function queueJobs(job) {
    if (!queue.includes(job)) {
        //  先判断队列中是否存在，不存在就添加job
        queue.push(job)
    }

    queueFlush()
}

function queueFlush() {
    if (isFlushPending) return;
    isFlushPending = true

    // 把要执行的函数抽离成flushJobs  传入nextTick
    nextTick(flushJobs);
}

function flushJobs() {
    isFlushPending = false;
    let job;
    // shift()从数组中删除第一个元素并返回该数组的值
    // 赋值给job 并 执行
    while ((job = queue.shift())) {
        job && job();
    }
}