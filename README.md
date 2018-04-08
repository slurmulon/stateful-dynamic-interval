# stateful-dynamic-interval
> :clock1: The stateful dynamic interval
---

A pauseable and resumeable `setInterval` built around [dynamic-interval](https://github.com/slurmulon/dynamic-interval)

## Install

`npm install --save slurmulon/stateful-dynamic-interval`

then

```js
import setStatefulDynterval from 'stateful-dynamic-interval'
```

or

```js
import { StatefulDynterval } from 'stateful-dynamic-interval'
```

## Usage

```js
import { StatefulDynterval } from 'stateful-dynamic-interval'

const timer = new StatefulDynterval(context => console.log('tick', context), 1000)

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
