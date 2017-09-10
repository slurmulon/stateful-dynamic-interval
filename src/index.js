import setDynterval from 'dynamic-interval'

export class StatefulDynterval {

  constructor (step, wait, defer) {
    this.step  = step
    this.wait  = wait
    this.state = STATES.pristine
    this.time  = { start: null, end: null, remaining: null, clock: null }

    if (!defer) this.run()
  }

  // FIXME: this is an issue because it gets called outside of the `setDynterval`, therefore
  // the dynamic interval aspect isn't respected (i.e. `this.time.clock.context.wait` is never properly set!
  next (config) {
    this.time.start = new Date()

    console.log('[stateful-dynterval] next (config)', config)

    // return this.step(config)

    // MEH: doesn't work
    const context = this.step(config)

    this.time.clock.context = context

    return context
  }

  // FIXME: I think using `this.wait` is causing problems, because this value can
  // change on each step. could use event hooks in `dynamic-interval`
  // FIXME: this is getting called later than it should when resuming from twice the default `this.wait`
  // TODO: possibly support `skip` (unlikely, complicates the interval since it only takes in one func)
  run () {
    console.log('[stateful-dynterval] run (wait, context.wait)', this.wait, this.time.clock ? this.time.clock.context : null)

    const wait = this.time.clock ? this.time.clock.context.wait : this.wait

    this.time.start = new Date()
    // this.time.clock = setDynterval(this.next.bind(this), this.wait) // FIXME: should use this.context.wait
    this.time.clock = setDynterval(this.next.bind(this), wait)
    this.state = STATES.running
  }

  pause () {
    if (this.state !== STATES.running) return

    const wait = this.time.clock.context.wait || this.wait
    const elapsed = new Date() - this.time.start

    this.time.remaining = wait - elapsed
    this.time.clock.clear()

    console.log('[stateful-dynterval] pause (wait, context.wait, elapsed, remaining)', wait, this.time.clock.context.wait, elapsed, this.time.remaining)

    this.state = STATES.paused
  }

  // FIXME: resume/pickup are messed up. when the beat is empty, it ends up playing it for
  // an amount of time greater than 0
  //  - the problem is that if `this.step` is stateful/linear (as it is with `juke`), then the current step ends up getting called twice instead of just once. as to why this only happens on 0 wait steps is still unclear
  //  - I think it mostly has to do with `this.wait` being different from the default (either greater or smaller)
  resume (skip) {
    if (this.state !== STATES.paused) return

    this.state = STATES.resumed

    console.log('[stateful-dynterval] resuming in', this.time.remaining)

    setTimeout(this.pickup.bind(this), this.time.remaining)
  }

  // callback for when the interval is resumed
  pickup () {
    if (this.state !== STATES.resumed) return

    console.log('[stateful-dynterval] picking up from resume')

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
