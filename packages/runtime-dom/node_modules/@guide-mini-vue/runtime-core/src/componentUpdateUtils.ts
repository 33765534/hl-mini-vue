// 用于判断组件是否需要更新，是否修改了props
export function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode
    const { props: nextProps } = nextVNode
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true
        }
    }
    return false
}