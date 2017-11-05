'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var setDynterval = _interopDefault(require('dynamic-interval'));

var babelHelpers = {};




var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();





var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();











































babelHelpers;

var StatefulDynterval = function () {
  function StatefulDynterval(step, wait, defer) {
    classCallCheck(this, StatefulDynterval);

    this.step = step;
    this.wait = wait;
    this.state = STATES.pristine;
    this.time = { start: null, end: null, remaining: null, clock: null };

    if (!defer) this.run();
  }

  createClass(StatefulDynterval, [{
    key: 'next',
    value: function next(config) {
      var context = this.step(config);

      // TODO: can probably eliminate the need for this by supporting III (immediately invoked interval) in `dynamic-interval`
      // TODO: experiment with only doing this if `config` is `null`
      this.time.start = new Date();
      this.time.clock.context = context || config;

      return context;
    }
  }, {
    key: 'run',
    value: function run() {
      this.time.start = new Date();
      this.time.clock = setDynterval(this.next.bind(this), this.context.wait); // TODO: play with just `this.context`
      this.state = STATES.running;
    }

    // FIXME: if you pause too close to the next step the interval keeps going
    // - replacing `this.time.clock.context` with `this.time.clock.current.context` should resolve this. need to test thoroughly.

  }, {
    key: 'pause',
    value: function pause() {
      if (this.state !== STATES.running) return;

      var wait = this.context.wait;
      var elapsed = new Date() - this.time.start;

      this.time.remaining = wait - elapsed;
      this.time.clock.clear();

      this.state = STATES.paused;
    }
  }, {
    key: 'resume',
    value: function resume() {
      if (this.state !== STATES.paused) return;

      this.state = STATES.resumed;

      setTimeout(this.pickup.bind(this), this.time.remaining);
    }
  }, {
    key: 'pickup',
    value: function pickup() {
      if (this.state !== STATES.resumed) return;

      this.next();
      this.run();
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.time.clock.clear();

      this.state = STATES.cleared;
    }
  }, {
    key: 'context',
    get: function get$$1() {
      if (this.time.clock) {
        return Object.assign({}, this.time.clock.context);
      }

      return { wait: this.wait, state: this.state };
    }
  }]);
  return StatefulDynterval;
}();

var setStatefulDynterval = function setStatefulDynterval() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return new (Function.prototype.bind.apply(StatefulDynterval, [null].concat(args)))();
};

var STATES = {
  pristine: Symbol('pristine'),
  running: Symbol('running'),
  paused: Symbol('paused'),
  resumed: Symbol('resumed'),
  cleared: Symbol('cleared')
};

exports.StatefulDynterval = StatefulDynterval;
exports.setStatefulDynterval = setStatefulDynterval;
exports.STATES = STATES;