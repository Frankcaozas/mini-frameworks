interface VNode {
  type: string | Function
  props: {
    [key: string]: any
    children: VNode[]
  }
}

interface Props {
  [key: string]: any
  children?: VNode[]
}

interface SetStateAction {
  (state: any): void
}

type Fiber = VNode & {
  dom: HTMLElement | Text | null
  parent: Fiber | null
  child: Fiber | null
  sibling: Fiber | null
  alternate?: Fiber | null
  effectTag?: string
  hooks?: {
    state: any
    queue: SetStateAction[]
  }[]
}

function createElement(
  type: string,
  props: any,
  ...children: (object | string)[]
) {
  return {
    type,
    props: {
      ...props,
      children: children.map(children =>
        typeof children === 'object' ? children : createTextElement(children),
      ),
    },
  }
}

function createTextElement(text: string): VNode {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  }
}
const isEvent = (key: string) => key.startsWith('on')
const isProperty = (key: string) => key !== 'children' && !isEvent(key)
const isGone = (preProps: Props, nextProps: Props) => (key: string) =>
  !(key in nextProps)
const isNew = (preProps: Props, nextProps: Props) => (key: string) =>
  preProps[key] !== nextProps[key]
function createDOM(fiber: Fiber) {
  if (typeof fiber.type === 'string') {
    const dom
      = fiber.type === 'TEXT_ELEMENT'
        ? document.createTextNode('')
        : document.createElement(fiber.type)
    updateDom(dom, {}, fiber.props)
    return dom
  }
  return null
}

let nextUnitOfWork: Fiber | null = null
let wipRoot: Fiber | null = null
let deletions: Fiber[] | null = null
let currentRoot: Fiber | null = null

function commitRoot() {
  deletions?.forEach(commitWork)
  if (wipRoot?.child)
    commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

function commitWork(fiber: Fiber | null) {
  if (!fiber)
    return
  let domParentFiber = fiber.parent
  while (!domParentFiber?.dom && domParentFiber?.parent)
    domParentFiber = domParentFiber.parent

  const domParent = domParentFiber!.dom

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom && domParent)
    domParent.appendChild(fiber.dom)
  if (fiber.effectTag === 'UPDATE' && fiber.dom)
    updateDom(fiber.dom, fiber.alternate!.props, fiber.props)

  if (fiber.effectTag === 'DELETION' && fiber.dom && domParent)
    commitDeletion(fiber, domParent)

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function commitDeletion(fiber: Fiber | null, domParent: HTMLElement | Text) {
  if (!fiber)
    return
  if (fiber.dom)
    domParent.removeChild(fiber.dom)
  else commitDeletion(fiber.child, domParent)
}

function updateDom(dom: HTMLElement | Text, preProps: Props, nextProps: Props) {
  // delete keys which are gone
  Object.keys(preProps)
    .filter(isProperty)
    .filter(isGone(preProps, nextProps))
    .forEach(key => ((dom as any)[key] = ''))
  // remove event listeners
  Object.keys(preProps)
    .filter(isEvent)
    .filter(key => !(key in nextProps) || isNew(preProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.removeEventListener(eventType, preProps[name])
    })
  // update changed or new keys
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(preProps, nextProps))
    .forEach(key => ((dom as any)[key] = nextProps[key]))
  // bind event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(preProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })
}

function render(element: VNode, container: HTMLElement) {
  wipRoot = {
    type: container.tagName,
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
    child: null,
    parent: null,
    sibling: null,
  }
  deletions = []
  nextUnitOfWork = wipRoot
}

function workloop(deadline: IdleDeadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot)
    commitRoot()

  requestIdleCallback(workloop)
}

requestIdleCallback(workloop)

function performUnitOfWork(fiber: Fiber): Fiber | null {
  if (fiber.type instanceof Function)
    updateFuntionComponent(fiber)
  else updateHostComponent(fiber)

  if (fiber.child)
    return fiber.child

  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling)
      return nextFiber.sibling
    nextFiber = nextFiber.parent!
  }
  return null
}

function reconcileChildren(wipFiber: Fiber, elements: VNode[]) {
  let oldFiber = wipFiber.alternate?.child

  let index = 0
  let prevSibling = null

  while (index < elements.length || oldFiber != null) {
    const element = elements[index]
    const sameType = oldFiber && element && oldFiber.type === element.type
    let newFiber: Fiber | null = null
    if (sameType) {
      newFiber = {
        type: oldFiber!.type,
        props: element.props,
        dom: oldFiber!.dom,
        parent: wipFiber,
        child: null,
        sibling: null,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      }
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        child: null,
        sibling: null,
        alternate: null,
        effectTag: 'PLACEMENT',
      }
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = 'DELETION'
      deletions?.push(oldFiber)
    }

    if (oldFiber)
      oldFiber = oldFiber.sibling
    if (index === 0)
      wipFiber.child = newFiber
    else if (element)
      prevSibling!.sibling = newFiber

    prevSibling = newFiber
    index++
  }
}
let wipFiber: Fiber | null = null
let hookIndex: number
function updateFuntionComponent(fiber: Fiber) {
  hookIndex = 0
  wipFiber = fiber
  wipFiber!.hooks = []
  if (fiber.type instanceof Function) {
    const children = [fiber.type(fiber.props)]
    reconcileChildren(fiber, children)
  }
}

function useState(initial: any) {
  const oldHook
    = wipFiber?.alternate
    && wipFiber.alternate.hooks
    && wipFiber.alternate.hooks[hookIndex]
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: new Array<SetStateAction>(),
  }

  if (oldHook)
    oldHook.queue.forEach(action => hook.state = action(oldHook.state))
  const setState = (action: SetStateAction) => {
    hook.queue.push(action)
    wipRoot = {
      type: currentRoot!.type,
      dom: currentRoot!.dom,
      props: currentRoot!.props,
      alternate: currentRoot,
      child: null,
      parent: null,
      sibling: null,
    }
    deletions = []
    nextUnitOfWork = wipRoot
  }
  wipFiber?.hooks?.push(hook)
  hookIndex++
  return [hook.state, setState]
}

function updateHostComponent(fiber: Fiber) {
  if (!fiber.dom)
    fiber.dom = createDOM(fiber)
  const elements = fiber.props.children
  reconcileChildren(fiber, elements!)
}

export const React = {
  createElement,
  useState,
}

export const ReactDOM = {
  render,
}

