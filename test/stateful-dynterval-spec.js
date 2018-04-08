import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { StatefulDynterval, STATES } from '../dist/bundle'

const should = chai.should()

chai.use(sinonChai)

describe('StatefulDynterval', () => {
  describe('api', () => {
    it('should allow custom interval APIs to be provided', () => {
      let interval = new StatefulDynterval(() => {}, 25, { setInterval: sinon.spy(), clearInterval: sinon.spy() })

      interval.api.setInterval.should.have.been.called
    })
  })

  describe('run', () => {
    let interval, stepped

    beforeEach(() => {
      interval = new StatefulDynterval(config => {
        stepped = true

        return Object.assign({ wait: config.wait * 2 })
      }, 50)
    })

    afterEach(() => stepped = false)

    it('should set the starting time', () => {
      should.exist(interval.time.start)
    })

    it('should set the internal timer / interval', () => {
      should.exist(interval.time.clock)

      interval.time.clock.should.be.an('object')
    })

    it('should invoke the user `step` function inside of the interval', done => {
      stepped.should.be.false

      setTimeout(() => {
        stepped.should.be.true

        done()
      }, 1000)
    }).timeout(2000)

    it('should set the state to running', () => {
      interval.state.should.equal(STATES.running)
    })
  })

  describe('pause', () => {
    let interval, stepped

    beforeEach(() => {
      interval = new StatefulDynterval(config => {
        stepped = true

        console.log('[pause] stepping', config)

        return Object.assign({ wait: config.wait * 2 })
      }, { wait: 50, defer: true })
    })

    afterEach(() => stepped = false)

    it('should only run when in the running state', () => {
      const result = interval.pause()

      should.not.exist(result)
    })

    it('should set the remaining time to the current time minus the starting time', done => {
      interval.run()

      setTimeout(() => {
        interval.pause()
        interval.time.remaining.should.be.within(245, 256)
        done()
      }, 500)
    }).timeout(1000)

    it('should clear the internal timer / interval', () => {

    })

    it('should set the state to paused', () => {
      interval.run()
      interval.pause()
      interval.state.should.equal(STATES.paused)
    })
  })

  describe('resume', () => {
    let interval

    beforeEach(() => {
      interval = new StatefulDynterval(config => config, 1000)
    })

    it('should only run when the state is paused', () => {
      const result = interval.resume()

      should.not.exist(result)
    })

    it('should set the state to resumed', () => {
      interval.pause()
      interval.resume()

      interval.state.should.equal(STATES.resumed)
    })

    it('should call the next function delayed, in milliseconds, by the remaining time', done => {
      setTimeout(() => {
        let works = false

        interval.pickup = () => works = true
        interval.pause()

        const remaining = interval.time.remaining

        interval.resume()

        setTimeout(() => {
          works.should.be.true

          done()
        }, remaining + 1)
      }, 500)
    }).timeout(1500)

    // TODO: test pausing on an interval with a duration longer and shorter than the original interval (this.wait)

    // TODO/FIXME: support and test pausing a resume (tricky, might need to introduce `StatefulTimeout`)
  })

  describe('pickup', () => {
    let interval

    it('should only run when in the resumed state', () => {
      interval = new StatefulDynterval(() => {}, 1000)

      interval.state = null

      should.not.exist(interval.pickup())
    })

    it.only('should call the step (next) function', done => {
      interval = new StatefulDynterval(() => {}, 10)

      interval.next = sinon.spy()

      interval.pause()
      interval.resume()

      setTimeout(() => {
        console.log('NEXT CALL COUNT', interval.next.callCount)
        interval.next.should.have.been.called

        done()
      }, 10)
    }).timeout(25)

    it('should call the run function', done => {
      interval = new StatefulDynterval(() => {}, 10)

      interval.run = sinon.spy()

      interval.pause()
      interval.resume()

      setTimeout(() => {
        interval.run.should.have.been.called

        done()
      }, 10)
    }).timeout(25)
  })

  describe('emit', () => {
    const intervals = {
      parent: null,
      childA: null,
      childB: null
    }

    it('should fire events to any subscribers where the action (by string) is the method to call', () => {
      const spawn = () => new StatefulDynterval(() => {}, 50)

      intervals.parent = spawn()
      intervals.childA = spawn()
      intervals.childB = spawn()

      intervals.childA.pause = sinon.spy()
      intervals.childB.pause = sinon.spy()

      intervals.parent
        .add(intervals.childA)
        .add(intervals.childB)

      intervals.parent.emit('pause')

      intervals.childA.pause.should.have.been.called
      intervals.childB.pause.should.have.been.called
    })
  })

  describe('add', () => {
    const intervals = {
      parent: null,
      child: null
    }

    const spawn = () => new StatefulDynterval(() => {}, 10)

    it('should add children to the parent interval', () => {
      intervals.parent = spawn()
      intervals.child  = spawn()

      intervals.parent.add(intervals.child)

      intervals.parent.children.should.contain(intervals.child)
    })

    it('should only allow instances of StatefulDynterval to be specified as children', () => {
      (() => intervals.parent.add('invalid')).should.throw(TypeError, /Child intervals must be instances of StatefulDynterval/)
    })
  })

})
