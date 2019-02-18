import setDynterval from 'dynamic-interval'
import now from 'performance-now'
import EventEmitter from 'events'

// TODO: consider integrating https://github.com/medikoo/event-emitter#unifyemitter1-emitter2-event-emitterunify
export class StatefulDynterval extends EventEmitter {

  constructor (step, config = {}, api = { setInterval, clearInterval, setTimeout, clearTimeout }) {
    super()

    if (config.constructor === Number) {
      config = { wait: config }
    }

    const { wait, lazy } = config

    this.step = step
    this.config = config
    this.wait = wait
    this.api = api
    this.state = STATES.pristine
    this.time  = { start: null, end: null, remaining: null, clock: null }
    this.children = new Set()

    if (!lazy) this.run()
  }

  get context () {
    if (this.time.clock) {
      return Object.assign({}, this.time.clock.context)
    }

    return Object.assign({}, this.config, { state: this.state })
  }

  next (config) {
    const context = this.step(config)

    this.time.start = now()

    return context
  }

  play () {
    return this.run()
  }

  run () {
    this.time.start = now()
    this.time.clock = setDynterval(this.next.bind(this), this.context, this.api)
    this.state = STATES.running

    this.emit('run')

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
    const elapsed = now() - start

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

  stop () {
    return this.clear()
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

    const topics = ['run', 'clear', 'pause', 'resume']

    topics.forEach(topic => this.on(topic, interval[topic]))

    this.children.add(interval)

    return this
  }

  detach () {
    this.children.clear()

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

export default setStatefulDynterval
