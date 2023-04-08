import { React, ReactDOM} from '@frankcao/react'

/** @jsx React.createElement */
function Counter() {
  const [state, setState] = React.useState(1)
  return (
    <h1 onClick={() => setState((c) => c + 1)} style="user-select: none">
      Count: {state}
    </h1>
  )
}
const element = <Counter />
const container = document.getElementById('root')
ReactDOM.render(element, container)
