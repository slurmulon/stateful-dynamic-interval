import setDynterval from 'dynamic-interval'
import now from 'performance-now'

// TODO: consider integrating https://github.com/medikoo/event-emitter#unifyemitter1-emitter2-event-emitterunify
export class StatefulDynterval {

  constructor (step, config = {}, api = { setInterval, clearInterval, setTimeout, clearTimeout }) {
    if (config.constructor === Number) {
      config = { wait: config }
    }

    const { wait, defer } = config

    this.step  = step
    this.wait  = wait
    this.api   = api
    this.state = STATES.pristine
    this.time  = { start: null, end: null, remaining: null, clock: null }
    this.children = []

    if (!defer) this.run()
  }

  get context () {
    if (this.time.clock) {
      return Object.assign({}, this.time.clock.context)
    }

    return { wait: this.wait, state: this.state }
  }

  next (config) {
    const context = this.step(config)

    // TODO: can probably eliminate the need for this by supporting III (immediately invoked interval) in `dynamic-interval`
    // TODO: experiment with only doing this if `config` is `null`
    this.time.start = now() //new Date()
    this.time.clock.context = context || config

    return context
  }

  run () {
    this.time.start = now() //new Date()
    this.time.clock = setDynterval(this.next.bind(this), this.context, this.api) // TODO: play with just `this.context`
    this.state = STATES.running

    return this
  }

  pickup () {
    if (this.state !== STATES.resumed) return

    this.next()
    this.run()

    return this
  }

  // FIXME: if you pause too close to the next step the interval keeps going
  // - replacing `this.time.clock.context` with `this.time.clock.current.context` should resolve this. need to test thoroughly.
  pause () {
    if (this.state !== STATES.running) return

    const { wait }  = this.context
    const { start } = this.time
    const elapsed = now() - start //new Date() - this.time.start

    this.time.remaining = wait - elapsed
    this.time.clock.clear()

    this.state = STATES.paused

    this.emit('pause')

    return this
  }

  resume () {
    if (this.state !== STATES.paused) return

    this.state = STATES.resumed

    this.api.setTimeout(this.pickup.bind(this), this.time.remaining)

    this.emit('resume')

    return this
  }

  clear () {
    this.time.clock.clear()

    this.state = STATES.cleared

    this.emit('clear')

    return this
  }

  add (interval) {
    if (!(interval instanceof StatefulDynterval)) {
      throw TypeError('Child intervals must be instances of StatefulDynterval')
    }

    this.children.push(interval)

    return this
  }

  emit (key) {
    this.children.forEach(child => {
      const action = child[key]

      if (!(action instanceof Function)) {
        throw Error('Invalid action key, must be the name of a method defined on StatefulDynterval')
      }

      action()
    })

    return this
  }

}

export const setStatefulDynterval = (...args) => new StatefulDynterval(...args)

export const STATES = {
  pristine : Symbol('pristine'),
  running  : Symbol('running'),
  paused   : Symbol('paused'),
  resumed  : Symbol('resumed'),
  cleared  : Symbol('cleared')
}
