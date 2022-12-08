interface VNode {
  type: string
  props: {
    [key: string]: any
    children: VNode[]
  }
}

interface Props {
  [key: string]: any
  children?: VNode[]
}

type Fiber = VNode & {
  dom: HTMLElement | Text | null
  parent: Fiber | null
  child: Fiber | null
  sibling: Fiber | null
  alternate?: Fiber | null
  effectTag?: string
}

function createElement(type: string, props: any, ...children: (object | string)[]) {
  return {
    type,
    props: {
      ...props,
      children: children.map(children => typeof children === 'object' ? children : createTextElement(children)),
    },
  }
}

function createTextElement(text: string) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

const isProperty = (key: string) => key !== 'children'
const isEvent = (key: string) => key.startsWith('on')
const isGone = (preProps: Props, nextProps: Props) => (key: string) => !(key in nextProps)
const isNew = (preProps: Props, nextProps: Props) => (key: string) => preProps[key] !== nextProps[key]
function createDOM(fiber: Fiber) {
  const dom = fiber.type === 'TEXT_ELEMENT'
    ? document.createTextNode('')
    : document.createElement(fiber.type)
  Object.keys(fiber.props).filter(isProperty).forEach(key => dom[key] = fiber.props[key])
  return dom
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
  const domParent = fiber.parent?.dom
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom && domParent)
    domParent.appendChild(fiber.dom)
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom)
    updateDom(fiber.dom, fiber.alternate!.props, fiber.props)

  if (fiber.effectTag === 'DELETION' && fiber.dom && domParent)
    domParent.removeChild(fiber.dom)

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function updateDom(dom: HTMLElement | Text, preProps: Props, nextProps: Props) {
  // delete keys which are gone
  Object.keys(preProps)
    .filter(isProperty)
    .filter(isGone(preProps, nextProps))
    .forEach(key => dom[key] = '')

  // update changed or new keys
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(preProps, nextProps))
    .forEach(key => dom[key] = nextProps[key])
}

function render(element: VNode, container: HTMLElement) {
  wipRoot = {
    type: container.tagName,
    dom: container,
    props: {
      children: [element],
    },
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
  requestIdleCallback(workloop)
}

requestIdleCallback(workloop)

function performUnitOfWork(fiber: Fiber): Fiber | null {
  if (!fiber.dom)
    fiber.dom = createDOM(fiber)
  if (fiber.parent)
    fiber.parent.dom?.appendChild(fiber.dom)

  const elements = fiber.props.children
  reconcileChildren(fiber, elements!)

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

  while (index < elements.length) {
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
    if (oldFiber && !sameType)
      oldFiber.effectTag = 'DELETION'

    if (oldFiber)
      oldFiber = oldFiber.sibling
    if (index === 0)
      wipFiber.child = newFiber
    else
      prevSibling!.sibling = newFiber

    prevSibling = newFiber
    index++
  }
}

const React = {
  createElement,
  createTextElement,
}
export default React
