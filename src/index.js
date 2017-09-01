import setDynterval from 'dynamic-interval'

export class StatefulDynterval {

  constructor (step, wait, defer) {
    this.step  = step
    this.wait  = wait
    this.state = STATES.pristine
    this.time  = { start: null, end: null, remaining: null, clock: null }

    if (!defer) this.run()
  }

  next (config) {
    this.time.start = new Date()

    return this.step(config)
  }

  run () {
    this.time.start = new Date()
    this.time.clock = setDynterval(this.next.bind(this), this.wait)
    this.state = STATES.running
  }

  pause () {
    if (this.state !== STATES.running) return

    const wait = this.time.clock.context.wait || this.wait
    const elapsed = new Date() - this.time.start

    this.time.remaining = wait - elapsed
    this.time.clock.clear()

    this.state = STATES.paused
  }

  resume () {
    if (this.state !== STATES.paused) return

    this.state = STATES.resumed

    setTimeout(this.pickup, this.time.remaining)
  }

	// callback for when the interval is resumed
  pickup () {
    if (this.state !== STATES.resumed) return

    this.step()
    this.run()
  }

  clear () {
    this.time.clock.clear()

    this.state = STATES.cleared
  }

}

export const STATES = {
  pristine : Symbol('pristine'),
  running  : Symbol('running'),
  paused   : Symbol('paused'),
  resumed  : Symbol('resumed'),
  cleared  : Symbol('cleared')
}
