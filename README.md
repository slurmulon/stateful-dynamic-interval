# stateful-dynamic-interval
> :clock1: Stateful dynamic interval
---

A pauseable and resumeable timer built around [dynamic-interval](https://github.com/slurmulon/dynamic-interval)

## Install

`npm install --save slurmulon/stateful-dynamic-interval`

## Usage

```js
import { StatefulDynterval } from 'stateful-dynamic-interval'

const step  = context => console.log('stepping', context)
const wait  = 50
const timer = new StatefulDynterval(step, wait)

timer.pause()
// ...
timer.resume()
```

## Example

This script doubles the amount of time between intervals on each iteration, starting with 50ms.

```js
import { StatefulDynterval } from 'stateful-dynamic-interval'

const timer = new StatefulDynterval(context => ({ wait: context.wait * 2 }), 50)

setTimeout(() => {
  timer.pause()

  setTimeout(() => {
    // this resumed step will only run for the remaining time in the interval,
    // which may be dynamic, meaning it can change on each iteration based on
    // the return value of the callback function (this example is dynamic)
    timer.resume()
  }, 1000)
}, 1000)
```

## License

MIT
