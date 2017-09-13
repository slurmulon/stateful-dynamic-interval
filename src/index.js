import setDynterval from 'dynamic-interval'

export class StatefulDynterval {

  constructor (step, wait, defer) {
    this.step  = step
    this.wait  = wait
    this.state = STATES.pristine
    this.time  = { start: null, end: null, remaining: null, clock: null }

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

    // TODO: can probably eliminate the need for this by supporting IEI (immediately invoked interval) in `dynamic-interval`
    // TODO: experiment with only doing this if `config` is `null`
    this.time.start = new Date()
    this.time.clock.context = context || config

    return context
  }

  run () {
    this.time.start = new Date()
    this.time.clock = setDynterval(this.next.bind(this), this.context.wait) // TODO: play with just `this.context`
    this.state = STATES.running
  }

  // FIXME: if you pause too close to the next step the interval keeps going
  // - replacing `this.time.clock.context` with `this.time.clock.current.context` should resolve this. need to test thoroughly.
  pause () {
    if (this.state !== STATES.running) return

    const wait    = this.context.wait
    const elapsed = new Date() - this.time.start

    this.time.remaining = wait - elapsed
    this.time.clock.clear()

    this.state = STATES.paused
  }

  resume () {
    if (this.state !== STATES.paused) return

    this.state = STATES.resumed

    setTimeout(this.pickup.bind(this), this.time.remaining)
  }

  pickup () {
    if (this.state !== STATES.resumed) return

    this.next()
    this.run()
  }

  clear () {
    this.time.clock.clear()

    this.state = STATES.cleared
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
