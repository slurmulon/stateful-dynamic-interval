import chai from 'chai'
import chaiThings from 'chai-things'
import { StatefulDynterval, states } from '../dist/bundle'

const should = chai.should()

chai.use(chaiThings)

describe.only('StatefulDynterval', () => {
  describe('run', () => {
    let interval, stepped

    beforeEach(() => {
      interval = new StatefulDynterval(config => {
        stepped = true

        return Object.assign({ wait: config.wait * 2 })
      }, 50)

      interval.run()
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
      interval.state.should.equal(states.running)
    })
  })

  describe('pause', () => {
    let interval, stepped

    beforeEach(() => {
      interval = new StatefulDynterval(config => {
        stepped = true

        console.log('[pause] stepping', config)

        return Object.assign({ wait: config.wait * 2 })
      }, 50, true)
    })

    afterEach(() => stepped = false)

    it('should only run when in the running state', () => {
      const result = interval.pause()

      should.not.exist(result)
    })

    // TODO: create a similar test for ensuring that 
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
      interval.state.should.equal(states.paused)
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

      interval.state.should.equal(states.resumed)
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
  })

  xdescribe('pickup', () => {
    it('should only run when in the resumed state', () => {

    })

    it('should call the step function', () => {

    })

    it('should call the run function', () => {
      
    })
  })


})
