'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var setDynterval = _interopDefault(require('dynamic-interval'));
var now = _interopDefault(require('performance-now'));
var EventEmitter = _interopDefault(require('events'));

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









var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};





















babelHelpers;

// TODO: consider integrating https://github.com/medikoo/event-emitter#unifyemitter1-emitter2-event-emitterunify
var StatefulDynterval = function (_EventEmitter) {
  inherits(StatefulDynterval, _EventEmitter);

  function StatefulDynterval(step) {
    var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var api = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : { setInterval: setInterval, clearInterval: clearInterval, setTimeout: setTimeout, clearTimeout: clearTimeout };
    classCallCheck(this, StatefulDynterval);

    var _this = possibleConstructorReturn(this, (StatefulDynterval.__proto__ || Object.getPrototypeOf(StatefulDynterval)).call(this));

    if (!Number.isNaN(config)) {
      config = { wait: config };
    }

    var _config = config,
        wait = _config.wait,
        lazy = _config.lazy;


    _this.step = step;
    _this.config = config;
    _this.wait = wait;
    _this.api = api;
    _this.state = STATES.pristine;
    _this.time = { start: null, end: null, remaining: null, clock: null };
    _this.children = new Set();

    if (!lazy) _this.run();
    return _this;
  }

  createClass(StatefulDynterval, [{
    key: 'next',
    value: function next(config) {
      var context = this.step(config);

      this.time.start = now();

      return context;
    }
  }, {
    key: 'play',
    value: function play() {
      return this.run();
    }
  }, {
    key: 'run',
    value: function run() {
      this.time.start = now();
      this.time.clock = setDynterval(this.next.bind(this), this.context, this.api);
      this.state = STATES.running;

      this.emit('run');

      return this;
    }
  }, {
    key: 'pickup',
    value: function pickup() {
      if (this.state !== STATES.resumed) return;

      this.next();
      this.run();

      return this;
    }

    // FIXME: if you pause too close to the next step the interval keeps going
    // - replacing `this.time.clock.context` with `this.time.clock.current.context` should resolve this. need to test thoroughly.

  }, {
    key: 'pause',
    value: function pause() {
      if (this.state !== STATES.running) return;

      var wait = this.context.wait;
      var start = this.time.start;

      var elapsed = now() - start;

      this.time.remaining = wait - elapsed;
      this.time.clock.clear();

      this.state = STATES.paused;

      this.emit('pause');

      return this;
    }
  }, {
    key: 'resume',
    value: function resume() {
      if (this.state !== STATES.paused) return;

      this.state = STATES.resumed;

      this.api.setTimeout(this.pickup.bind(this), this.time.remaining);

      this.emit('resume');

      return this;
    }
  }, {
    key: 'stop',
    value: function stop() {
      return this.clear();
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.time.clock.clear();

      this.state = STATES.cleared;

      this.emit('clear');

      return this;
    }
  }, {
    key: 'add',
    value: function add(interval) {
      var _this2 = this;

      if (!(interval instanceof StatefulDynterval)) {
        throw TypeError('Child intervals must be instances of StatefulDynterval');
      }

      TOPICS.forEach(function (topic) {
        return _this2.on(topic, interval[topic]);
      });
      this.children.add(interval);

      return this;
    }
  }, {
    key: 'detach',
    value: function detach() {
      var _this3 = this;

      this.children.forEach(function (child) {
        TOPICS.forEach(function (topic) {
          return _this3.off(topic, child[topic]);
        });
      });

      this.children.clear();

      return this;
    }
  }, {
    key: 'context',
    get: function get$$1() {
      if (this.time.clock) {
        return Object.assign({}, this.time.clock.context);
      }

      return Object.assign({}, this.config, { state: this.state });
    }
  }]);
  return StatefulDynterval;
}(EventEmitter);

var setStatefulDynterval = function setStatefulDynterval() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return new (Function.prototype.bind.apply(StatefulDynterval, [null].concat(args)))();
};

var TOPICS = ['run', 'clear', 'pause', 'resume'];

var STATES = {
  pristine: Symbol('pristine'),
  running: Symbol('running'),
  paused: Symbol('paused'),
  resumed: Symbol('resumed'),
  cleared: Symbol('cleared')
};

exports.StatefulDynterval = StatefulDynterval;
exports.setStatefulDynterval = setStatefulDynterval;
exports.TOPICS = TOPICS;
exports.STATES = STATES;
exports['default'] = setStatefulDynterval;
