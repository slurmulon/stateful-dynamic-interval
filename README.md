# stateful-dynamic-interval
> :clock1: The stateful dynamic interval
---

[![build](https://img.shields.io/circleci/project/github/RedSparr0w/node-csgo-parser.svg?style=for-the-badge)](https://circleci.com/gh/slurmulon/stateful-dynamic-interval)
[![npm](https://img.shields.io/npm/v/stateful-dynamic-interval.svg?style=for-the-badge)](https://npmjs.com/package/stateful-dynamic-interval)

A pauseable and resumeable `setInterval` built around [dynamic-interval](https://github.com/slurmulon/dynamic-interval)

## Install

`npm install --save stateful-dynamic-interval`

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

## Interface 

### `run()`

Starts the interval. Instantiated `StatefulDyntervals` will automatically call `run` unless the `lazy` config property is set to `true`.

`play` is an alias method.

### `clear()`

Stops or clears out the interval. Once an interval has been cleared it cannot be resumed.

`stop` is an alias method.

### `pause()`

Pauses the interval so that it can be resumed at a later point.

### `resume()`

Resumes a previously paused interval.

### `add(interval)`

Synchronizes the parent interval with a child interval.

Child intervals automatically subscribe to the following topics of their parents:

 - `run`
 - `clear`
 - `pause`
 - `resume`

### `detach`

Desynchronizes a parent interval from all of its children by unsubscribing them from their parent topics.

## License

MIT
