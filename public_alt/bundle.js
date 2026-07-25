(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // node_modules/engine.io-parser/build/cjs/commons.js
  var require_commons = __commonJS({
    "node_modules/engine.io-parser/build/cjs/commons.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ERROR_PACKET = exports.PACKET_TYPES_REVERSE = exports.PACKET_TYPES = void 0;
      var PACKET_TYPES = /* @__PURE__ */ Object.create(null);
      exports.PACKET_TYPES = PACKET_TYPES;
      PACKET_TYPES["open"] = "0";
      PACKET_TYPES["close"] = "1";
      PACKET_TYPES["ping"] = "2";
      PACKET_TYPES["pong"] = "3";
      PACKET_TYPES["message"] = "4";
      PACKET_TYPES["upgrade"] = "5";
      PACKET_TYPES["noop"] = "6";
      var PACKET_TYPES_REVERSE = /* @__PURE__ */ Object.create(null);
      exports.PACKET_TYPES_REVERSE = PACKET_TYPES_REVERSE;
      Object.keys(PACKET_TYPES).forEach((key) => {
        PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
      });
      var ERROR_PACKET = { type: "error", data: "parser error" };
      exports.ERROR_PACKET = ERROR_PACKET;
    }
  });

  // node_modules/engine.io-parser/build/cjs/encodePacket.browser.js
  var require_encodePacket_browser = __commonJS({
    "node_modules/engine.io-parser/build/cjs/encodePacket.browser.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var commons_js_1 = require_commons();
      var withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
      var withNativeArrayBuffer = typeof ArrayBuffer === "function";
      var isView = (obj) => {
        return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
      };
      var encodePacket = ({ type, data }, supportsBinary, callback) => {
        if (withNativeBlob && data instanceof Blob) {
          if (supportsBinary) {
            return callback(data);
          } else {
            return encodeBlobAsBase64(data, callback);
          }
        } else if (withNativeArrayBuffer && (data instanceof ArrayBuffer || isView(data))) {
          if (supportsBinary) {
            return callback(data);
          } else {
            return encodeBlobAsBase64(new Blob([data]), callback);
          }
        }
        return callback(commons_js_1.PACKET_TYPES[type] + (data || ""));
      };
      var encodeBlobAsBase64 = (data, callback) => {
        const fileReader = new FileReader();
        fileReader.onload = function() {
          const content = fileReader.result.split(",")[1];
          callback("b" + content);
        };
        return fileReader.readAsDataURL(data);
      };
      exports.default = encodePacket;
    }
  });

  // node_modules/engine.io-parser/build/cjs/contrib/base64-arraybuffer.js
  var require_base64_arraybuffer = __commonJS({
    "node_modules/engine.io-parser/build/cjs/contrib/base64-arraybuffer.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.decode = exports.encode = void 0;
      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      var lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
      for (let i = 0; i < chars.length; i++) {
        lookup[chars.charCodeAt(i)] = i;
      }
      var encode = (arraybuffer) => {
        let bytes = new Uint8Array(arraybuffer), i, len = bytes.length, base64 = "";
        for (i = 0; i < len; i += 3) {
          base64 += chars[bytes[i] >> 2];
          base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
          base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
          base64 += chars[bytes[i + 2] & 63];
        }
        if (len % 3 === 2) {
          base64 = base64.substring(0, base64.length - 1) + "=";
        } else if (len % 3 === 1) {
          base64 = base64.substring(0, base64.length - 2) + "==";
        }
        return base64;
      };
      exports.encode = encode;
      var decode = (base64) => {
        let bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
        if (base64[base64.length - 1] === "=") {
          bufferLength--;
          if (base64[base64.length - 2] === "=") {
            bufferLength--;
          }
        }
        const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
        for (i = 0; i < len; i += 4) {
          encoded1 = lookup[base64.charCodeAt(i)];
          encoded2 = lookup[base64.charCodeAt(i + 1)];
          encoded3 = lookup[base64.charCodeAt(i + 2)];
          encoded4 = lookup[base64.charCodeAt(i + 3)];
          bytes[p++] = encoded1 << 2 | encoded2 >> 4;
          bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
          bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
        }
        return arraybuffer;
      };
      exports.decode = decode;
    }
  });

  // node_modules/engine.io-parser/build/cjs/decodePacket.browser.js
  var require_decodePacket_browser = __commonJS({
    "node_modules/engine.io-parser/build/cjs/decodePacket.browser.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var commons_js_1 = require_commons();
      var base64_arraybuffer_js_1 = require_base64_arraybuffer();
      var withNativeArrayBuffer = typeof ArrayBuffer === "function";
      var decodePacket = (encodedPacket, binaryType) => {
        if (typeof encodedPacket !== "string") {
          return {
            type: "message",
            data: mapBinary(encodedPacket, binaryType)
          };
        }
        const type = encodedPacket.charAt(0);
        if (type === "b") {
          return {
            type: "message",
            data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
          };
        }
        const packetType = commons_js_1.PACKET_TYPES_REVERSE[type];
        if (!packetType) {
          return commons_js_1.ERROR_PACKET;
        }
        return encodedPacket.length > 1 ? {
          type: commons_js_1.PACKET_TYPES_REVERSE[type],
          data: encodedPacket.substring(1)
        } : {
          type: commons_js_1.PACKET_TYPES_REVERSE[type]
        };
      };
      var decodeBase64Packet = (data, binaryType) => {
        if (withNativeArrayBuffer) {
          const decoded = (0, base64_arraybuffer_js_1.decode)(data);
          return mapBinary(decoded, binaryType);
        } else {
          return { base64: true, data };
        }
      };
      var mapBinary = (data, binaryType) => {
        switch (binaryType) {
          case "blob":
            return data instanceof ArrayBuffer ? new Blob([data]) : data;
          case "arraybuffer":
          default:
            return data;
        }
      };
      exports.default = decodePacket;
    }
  });

  // node_modules/engine.io-parser/build/cjs/index.js
  var require_cjs = __commonJS({
    "node_modules/engine.io-parser/build/cjs/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.decodePayload = exports.decodePacket = exports.encodePayload = exports.encodePacket = exports.protocol = void 0;
      var encodePacket_js_1 = require_encodePacket_browser();
      exports.encodePacket = encodePacket_js_1.default;
      var decodePacket_js_1 = require_decodePacket_browser();
      exports.decodePacket = decodePacket_js_1.default;
      var SEPARATOR = String.fromCharCode(30);
      var encodePayload = (packets, callback) => {
        const length = packets.length;
        const encodedPackets = new Array(length);
        let count = 0;
        packets.forEach((packet, i) => {
          (0, encodePacket_js_1.default)(packet, false, (encodedPacket) => {
            encodedPackets[i] = encodedPacket;
            if (++count === length) {
              callback(encodedPackets.join(SEPARATOR));
            }
          });
        });
      };
      exports.encodePayload = encodePayload;
      var decodePayload = (encodedPayload, binaryType) => {
        const encodedPackets = encodedPayload.split(SEPARATOR);
        const packets = [];
        for (let i = 0; i < encodedPackets.length; i++) {
          const decodedPacket = (0, decodePacket_js_1.default)(encodedPackets[i], binaryType);
          packets.push(decodedPacket);
          if (decodedPacket.type === "error") {
            break;
          }
        }
        return packets;
      };
      exports.decodePayload = decodePayload;
      exports.protocol = 4;
    }
  });

  // node_modules/@socket.io/component-emitter/index.js
  var require_component_emitter = __commonJS({
    "node_modules/@socket.io/component-emitter/index.js"(exports) {
      exports.Emitter = Emitter;
      function Emitter(obj) {
        if (obj) return mixin(obj);
      }
      function mixin(obj) {
        for (var key in Emitter.prototype) {
          obj[key] = Emitter.prototype[key];
        }
        return obj;
      }
      Emitter.prototype.on = Emitter.prototype.addEventListener = function(event2, fn) {
        this._callbacks = this._callbacks || {};
        (this._callbacks["$" + event2] = this._callbacks["$" + event2] || []).push(fn);
        return this;
      };
      Emitter.prototype.once = function(event2, fn) {
        function on() {
          this.off(event2, on);
          fn.apply(this, arguments);
        }
        on.fn = fn;
        this.on(event2, on);
        return this;
      };
      Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event2, fn) {
        this._callbacks = this._callbacks || {};
        if (0 == arguments.length) {
          this._callbacks = {};
          return this;
        }
        var callbacks = this._callbacks["$" + event2];
        if (!callbacks) return this;
        if (1 == arguments.length) {
          delete this._callbacks["$" + event2];
          return this;
        }
        var cb;
        for (var i = 0; i < callbacks.length; i++) {
          cb = callbacks[i];
          if (cb === fn || cb.fn === fn) {
            callbacks.splice(i, 1);
            break;
          }
        }
        if (callbacks.length === 0) {
          delete this._callbacks["$" + event2];
        }
        return this;
      };
      Emitter.prototype.emit = function(event2) {
        this._callbacks = this._callbacks || {};
        var args = new Array(arguments.length - 1), callbacks = this._callbacks["$" + event2];
        for (var i = 1; i < arguments.length; i++) {
          args[i - 1] = arguments[i];
        }
        if (callbacks) {
          callbacks = callbacks.slice(0);
          for (var i = 0, len = callbacks.length; i < len; ++i) {
            callbacks[i].apply(this, args);
          }
        }
        return this;
      };
      Emitter.prototype.emitReserved = Emitter.prototype.emit;
      Emitter.prototype.listeners = function(event2) {
        this._callbacks = this._callbacks || {};
        return this._callbacks["$" + event2] || [];
      };
      Emitter.prototype.hasListeners = function(event2) {
        return !!this.listeners(event2).length;
      };
    }
  });

  // node_modules/engine.io-client/build/cjs/globalThis.browser.js
  var require_globalThis_browser = __commonJS({
    "node_modules/engine.io-client/build/cjs/globalThis.browser.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.globalThisShim = void 0;
      exports.globalThisShim = (() => {
        if (typeof self !== "undefined") {
          return self;
        } else if (typeof window !== "undefined") {
          return window;
        } else {
          return Function("return this")();
        }
      })();
    }
  });

  // node_modules/engine.io-client/build/cjs/util.js
  var require_util = __commonJS({
    "node_modules/engine.io-client/build/cjs/util.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.byteLength = exports.installTimerFunctions = exports.pick = void 0;
      var globalThis_js_1 = require_globalThis_browser();
      function pick(obj, ...attr) {
        return attr.reduce((acc, k) => {
          if (obj.hasOwnProperty(k)) {
            acc[k] = obj[k];
          }
          return acc;
        }, {});
      }
      exports.pick = pick;
      var NATIVE_SET_TIMEOUT = setTimeout;
      var NATIVE_CLEAR_TIMEOUT = clearTimeout;
      function installTimerFunctions(obj, opts) {
        if (opts.useNativeTimers) {
          obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThis_js_1.globalThisShim);
          obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThis_js_1.globalThisShim);
        } else {
          obj.setTimeoutFn = setTimeout.bind(globalThis_js_1.globalThisShim);
          obj.clearTimeoutFn = clearTimeout.bind(globalThis_js_1.globalThisShim);
        }
      }
      exports.installTimerFunctions = installTimerFunctions;
      var BASE64_OVERHEAD = 1.33;
      function byteLength(obj) {
        if (typeof obj === "string") {
          return utf8Length(obj);
        }
        return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
      }
      exports.byteLength = byteLength;
      function utf8Length(str) {
        let c = 0, length = 0;
        for (let i = 0, l = str.length; i < l; i++) {
          c = str.charCodeAt(i);
          if (c < 128) {
            length += 1;
          } else if (c < 2048) {
            length += 2;
          } else if (c < 55296 || c >= 57344) {
            length += 3;
          } else {
            i++;
            length += 4;
          }
        }
        return length;
      }
    }
  });

  // node_modules/engine.io-client/node_modules/ms/index.js
  var require_ms = __commonJS({
    "node_modules/engine.io-client/node_modules/ms/index.js"(exports, module) {
      var s2 = 1e3;
      var m = s2 * 60;
      var h = m * 60;
      var d = h * 24;
      var w = d * 7;
      var y = d * 365.25;
      module.exports = function(val, options) {
        options = options || {};
        var type = typeof val;
        if (type === "string" && val.length > 0) {
          return parse(val);
        } else if (type === "number" && isFinite(val)) {
          return options.long ? fmtLong(val) : fmtShort(val);
        }
        throw new Error(
          "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
        );
      };
      function parse(str) {
        str = String(str);
        if (str.length > 100) {
          return;
        }
        var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
          str
        );
        if (!match) {
          return;
        }
        var n = parseFloat(match[1]);
        var type = (match[2] || "ms").toLowerCase();
        switch (type) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return n * y;
          case "weeks":
          case "week":
          case "w":
            return n * w;
          case "days":
          case "day":
          case "d":
            return n * d;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return n * h;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return n * m;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return n * s2;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return n;
          default:
            return void 0;
        }
      }
      function fmtShort(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return Math.round(ms / d) + "d";
        }
        if (msAbs >= h) {
          return Math.round(ms / h) + "h";
        }
        if (msAbs >= m) {
          return Math.round(ms / m) + "m";
        }
        if (msAbs >= s2) {
          return Math.round(ms / s2) + "s";
        }
        return ms + "ms";
      }
      function fmtLong(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return plural(ms, msAbs, d, "day");
        }
        if (msAbs >= h) {
          return plural(ms, msAbs, h, "hour");
        }
        if (msAbs >= m) {
          return plural(ms, msAbs, m, "minute");
        }
        if (msAbs >= s2) {
          return plural(ms, msAbs, s2, "second");
        }
        return ms + " ms";
      }
      function plural(ms, msAbs, n, name) {
        var isPlural = msAbs >= n * 1.5;
        return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
      }
    }
  });

  // node_modules/engine.io-client/node_modules/debug/src/common.js
  var require_common = __commonJS({
    "node_modules/engine.io-client/node_modules/debug/src/common.js"(exports, module) {
      function setup(env) {
        createDebug.debug = createDebug;
        createDebug.default = createDebug;
        createDebug.coerce = coerce;
        createDebug.disable = disable;
        createDebug.enable = enable;
        createDebug.enabled = enabled;
        createDebug.humanize = require_ms();
        createDebug.destroy = destroy;
        Object.keys(env).forEach((key) => {
          createDebug[key] = env[key];
        });
        createDebug.names = [];
        createDebug.skips = [];
        createDebug.formatters = {};
        function selectColor(namespace) {
          let hash = 0;
          for (let i = 0; i < namespace.length; i++) {
            hash = (hash << 5) - hash + namespace.charCodeAt(i);
            hash |= 0;
          }
          return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
        }
        createDebug.selectColor = selectColor;
        function createDebug(namespace) {
          let prevTime;
          let enableOverride = null;
          let namespacesCache;
          let enabledCache;
          function debug(...args) {
            if (!debug.enabled) {
              return;
            }
            const self2 = debug;
            const curr = Number(/* @__PURE__ */ new Date());
            const ms = curr - (prevTime || curr);
            self2.diff = ms;
            self2.prev = prevTime;
            self2.curr = curr;
            prevTime = curr;
            args[0] = createDebug.coerce(args[0]);
            if (typeof args[0] !== "string") {
              args.unshift("%O");
            }
            let index = 0;
            args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
              if (match === "%%") {
                return "%";
              }
              index++;
              const formatter = createDebug.formatters[format];
              if (typeof formatter === "function") {
                const val = args[index];
                match = formatter.call(self2, val);
                args.splice(index, 1);
                index--;
              }
              return match;
            });
            createDebug.formatArgs.call(self2, args);
            const logFn = self2.log || createDebug.log;
            logFn.apply(self2, args);
          }
          debug.namespace = namespace;
          debug.useColors = createDebug.useColors();
          debug.color = createDebug.selectColor(namespace);
          debug.extend = extend;
          debug.destroy = createDebug.destroy;
          Object.defineProperty(debug, "enabled", {
            enumerable: true,
            configurable: false,
            get: () => {
              if (enableOverride !== null) {
                return enableOverride;
              }
              if (namespacesCache !== createDebug.namespaces) {
                namespacesCache = createDebug.namespaces;
                enabledCache = createDebug.enabled(namespace);
              }
              return enabledCache;
            },
            set: (v) => {
              enableOverride = v;
            }
          });
          if (typeof createDebug.init === "function") {
            createDebug.init(debug);
          }
          return debug;
        }
        function extend(namespace, delimiter) {
          const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
          newDebug.log = this.log;
          return newDebug;
        }
        function enable(namespaces) {
          createDebug.save(namespaces);
          createDebug.namespaces = namespaces;
          createDebug.names = [];
          createDebug.skips = [];
          let i;
          const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
          const len = split.length;
          for (i = 0; i < len; i++) {
            if (!split[i]) {
              continue;
            }
            namespaces = split[i].replace(/\*/g, ".*?");
            if (namespaces[0] === "-") {
              createDebug.skips.push(new RegExp("^" + namespaces.slice(1) + "$"));
            } else {
              createDebug.names.push(new RegExp("^" + namespaces + "$"));
            }
          }
        }
        function disable() {
          const namespaces = [
            ...createDebug.names.map(toNamespace),
            ...createDebug.skips.map(toNamespace).map((namespace) => "-" + namespace)
          ].join(",");
          createDebug.enable("");
          return namespaces;
        }
        function enabled(name) {
          if (name[name.length - 1] === "*") {
            return true;
          }
          let i;
          let len;
          for (i = 0, len = createDebug.skips.length; i < len; i++) {
            if (createDebug.skips[i].test(name)) {
              return false;
            }
          }
          for (i = 0, len = createDebug.names.length; i < len; i++) {
            if (createDebug.names[i].test(name)) {
              return true;
            }
          }
          return false;
        }
        function toNamespace(regexp) {
          return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, "*");
        }
        function coerce(val) {
          if (val instanceof Error) {
            return val.stack || val.message;
          }
          return val;
        }
        function destroy() {
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
        createDebug.enable(createDebug.load());
        return createDebug;
      }
      module.exports = setup;
    }
  });

  // node_modules/engine.io-client/node_modules/debug/src/browser.js
  var require_browser = __commonJS({
    "node_modules/engine.io-client/node_modules/debug/src/browser.js"(exports, module) {
      exports.formatArgs = formatArgs;
      exports.save = save;
      exports.load = load;
      exports.useColors = useColors;
      exports.storage = localstorage();
      exports.destroy = /* @__PURE__ */ (() => {
        let warned = false;
        return () => {
          if (!warned) {
            warned = true;
            console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
          }
        };
      })();
      exports.colors = [
        "#0000CC",
        "#0000FF",
        "#0033CC",
        "#0033FF",
        "#0066CC",
        "#0066FF",
        "#0099CC",
        "#0099FF",
        "#00CC00",
        "#00CC33",
        "#00CC66",
        "#00CC99",
        "#00CCCC",
        "#00CCFF",
        "#3300CC",
        "#3300FF",
        "#3333CC",
        "#3333FF",
        "#3366CC",
        "#3366FF",
        "#3399CC",
        "#3399FF",
        "#33CC00",
        "#33CC33",
        "#33CC66",
        "#33CC99",
        "#33CCCC",
        "#33CCFF",
        "#6600CC",
        "#6600FF",
        "#6633CC",
        "#6633FF",
        "#66CC00",
        "#66CC33",
        "#9900CC",
        "#9900FF",
        "#9933CC",
        "#9933FF",
        "#99CC00",
        "#99CC33",
        "#CC0000",
        "#CC0033",
        "#CC0066",
        "#CC0099",
        "#CC00CC",
        "#CC00FF",
        "#CC3300",
        "#CC3333",
        "#CC3366",
        "#CC3399",
        "#CC33CC",
        "#CC33FF",
        "#CC6600",
        "#CC6633",
        "#CC9900",
        "#CC9933",
        "#CCCC00",
        "#CCCC33",
        "#FF0000",
        "#FF0033",
        "#FF0066",
        "#FF0099",
        "#FF00CC",
        "#FF00FF",
        "#FF3300",
        "#FF3333",
        "#FF3366",
        "#FF3399",
        "#FF33CC",
        "#FF33FF",
        "#FF6600",
        "#FF6633",
        "#FF9900",
        "#FF9933",
        "#FFCC00",
        "#FFCC33"
      ];
      function useColors() {
        if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
          return true;
        }
        if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
          return false;
        }
        return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
        typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
        // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
        typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
        typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
      }
      function formatArgs(args) {
        args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
        if (!this.useColors) {
          return;
        }
        const c = "color: " + this.color;
        args.splice(1, 0, c, "color: inherit");
        let index = 0;
        let lastC = 0;
        args[0].replace(/%[a-zA-Z%]/g, (match) => {
          if (match === "%%") {
            return;
          }
          index++;
          if (match === "%c") {
            lastC = index;
          }
        });
        args.splice(lastC, 0, c);
      }
      exports.log = console.debug || console.log || (() => {
      });
      function save(namespaces) {
        try {
          if (namespaces) {
            exports.storage.setItem("debug", namespaces);
          } else {
            exports.storage.removeItem("debug");
          }
        } catch (error) {
        }
      }
      function load() {
        let r;
        try {
          r = exports.storage.getItem("debug");
        } catch (error) {
        }
        if (!r && typeof process !== "undefined" && "env" in process) {
          r = process.env.DEBUG;
        }
        return r;
      }
      function localstorage() {
        try {
          return localStorage;
        } catch (error) {
        }
      }
      module.exports = require_common()(exports);
      var { formatters } = module.exports;
      formatters.j = function(v) {
        try {
          return JSON.stringify(v);
        } catch (error) {
          return "[UnexpectedJSONParseError]: " + error.message;
        }
      };
    }
  });

  // node_modules/engine.io-client/build/cjs/transport.js
  var require_transport = __commonJS({
    "node_modules/engine.io-client/build/cjs/transport.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Transport = void 0;
      var engine_io_parser_1 = require_cjs();
      var component_emitter_1 = require_component_emitter();
      var util_js_1 = require_util();
      var debug_1 = __importDefault(require_browser());
      var debug = (0, debug_1.default)("engine.io-client:transport");
      var TransportError = class extends Error {
        constructor(reason, description, context) {
          super(reason);
          this.description = description;
          this.context = context;
          this.type = "TransportError";
        }
      };
      var Transport = class extends component_emitter_1.Emitter {
        /**
         * Transport abstract constructor.
         *
         * @param {Object} options.
         * @api private
         */
        constructor(opts) {
          super();
          this.writable = false;
          (0, util_js_1.installTimerFunctions)(this, opts);
          this.opts = opts;
          this.query = opts.query;
          this.readyState = "";
          this.socket = opts.socket;
        }
        /**
         * Emits an error.
         *
         * @param {String} reason
         * @param description
         * @param context - the error context
         * @return {Transport} for chaining
         * @api protected
         */
        onError(reason, description, context) {
          super.emitReserved("error", new TransportError(reason, description, context));
          return this;
        }
        /**
         * Opens the transport.
         *
         * @api public
         */
        open() {
          if ("closed" === this.readyState || "" === this.readyState) {
            this.readyState = "opening";
            this.doOpen();
          }
          return this;
        }
        /**
         * Closes the transport.
         *
         * @api public
         */
        close() {
          if ("opening" === this.readyState || "open" === this.readyState) {
            this.doClose();
            this.onClose();
          }
          return this;
        }
        /**
         * Sends multiple packets.
         *
         * @param {Array} packets
         * @api public
         */
        send(packets) {
          if ("open" === this.readyState) {
            this.write(packets);
          } else {
            debug("transport is not open, discarding packets");
          }
        }
        /**
         * Called upon open
         *
         * @api protected
         */
        onOpen() {
          this.readyState = "open";
          this.writable = true;
          super.emitReserved("open");
        }
        /**
         * Called with data.
         *
         * @param {String} data
         * @api protected
         */
        onData(data) {
          const packet = (0, engine_io_parser_1.decodePacket)(data, this.socket.binaryType);
          this.onPacket(packet);
        }
        /**
         * Called with a decoded packet.
         *
         * @api protected
         */
        onPacket(packet) {
          super.emitReserved("packet", packet);
        }
        /**
         * Called upon close.
         *
         * @api protected
         */
        onClose(details) {
          this.readyState = "closed";
          super.emitReserved("close", details);
        }
      };
      exports.Transport = Transport;
    }
  });

  // node_modules/engine.io-client/build/cjs/contrib/yeast.js
  var require_yeast = __commonJS({
    "node_modules/engine.io-client/build/cjs/contrib/yeast.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.yeast = exports.decode = exports.encode = void 0;
      var alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split("");
      var length = 64;
      var map = {};
      var seed = 0;
      var i = 0;
      var prev;
      function encode(num) {
        let encoded = "";
        do {
          encoded = alphabet[num % length] + encoded;
          num = Math.floor(num / length);
        } while (num > 0);
        return encoded;
      }
      exports.encode = encode;
      function decode(str) {
        let decoded = 0;
        for (i = 0; i < str.length; i++) {
          decoded = decoded * length + map[str.charAt(i)];
        }
        return decoded;
      }
      exports.decode = decode;
      function yeast() {
        const now = encode(+/* @__PURE__ */ new Date());
        if (now !== prev)
          return seed = 0, prev = now;
        return now + "." + encode(seed++);
      }
      exports.yeast = yeast;
      for (; i < length; i++)
        map[alphabet[i]] = i;
    }
  });

  // node_modules/engine.io-client/build/cjs/contrib/parseqs.js
  var require_parseqs = __commonJS({
    "node_modules/engine.io-client/build/cjs/contrib/parseqs.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.decode = exports.encode = void 0;
      function encode(obj) {
        let str = "";
        for (let i in obj) {
          if (obj.hasOwnProperty(i)) {
            if (str.length)
              str += "&";
            str += encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]);
          }
        }
        return str;
      }
      exports.encode = encode;
      function decode(qs) {
        let qry = {};
        let pairs = qs.split("&");
        for (let i = 0, l = pairs.length; i < l; i++) {
          let pair = pairs[i].split("=");
          qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
        return qry;
      }
      exports.decode = decode;
    }
  });

  // node_modules/engine.io-client/build/cjs/contrib/has-cors.js
  var require_has_cors = __commonJS({
    "node_modules/engine.io-client/build/cjs/contrib/has-cors.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.hasCORS = void 0;
      var value = false;
      try {
        value = typeof XMLHttpRequest !== "undefined" && "withCredentials" in new XMLHttpRequest();
      } catch (err) {
      }
      exports.hasCORS = value;
    }
  });

  // node_modules/engine.io-client/build/cjs/transports/xmlhttprequest.browser.js
  var require_xmlhttprequest_browser = __commonJS({
    "node_modules/engine.io-client/build/cjs/transports/xmlhttprequest.browser.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.XHR = void 0;
      var has_cors_js_1 = require_has_cors();
      var globalThis_js_1 = require_globalThis_browser();
      function XHR(opts) {
        const xdomain = opts.xdomain;
        try {
          if ("undefined" !== typeof XMLHttpRequest && (!xdomain || has_cors_js_1.hasCORS)) {
            return new XMLHttpRequest();
          }
        } catch (e) {
        }
        if (!xdomain) {
          try {
            return new globalThis_js_1.globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
          } catch (e) {
          }
        }
      }
      exports.XHR = XHR;
    }
  });

  // node_modules/engine.io-client/build/cjs/transports/polling.js
  var require_polling = __commonJS({
    "node_modules/engine.io-client/build/cjs/transports/polling.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Request = exports.Polling = void 0;
      var transport_js_1 = require_transport();
      var debug_1 = __importDefault(require_browser());
      var yeast_js_1 = require_yeast();
      var parseqs_js_1 = require_parseqs();
      var engine_io_parser_1 = require_cjs();
      var xmlhttprequest_js_1 = require_xmlhttprequest_browser();
      var component_emitter_1 = require_component_emitter();
      var util_js_1 = require_util();
      var globalThis_js_1 = require_globalThis_browser();
      var debug = (0, debug_1.default)("engine.io-client:polling");
      function empty() {
      }
      var hasXHR2 = (function() {
        const xhr = new xmlhttprequest_js_1.XHR({
          xdomain: false
        });
        return null != xhr.responseType;
      })();
      var Polling = class extends transport_js_1.Transport {
        /**
         * XHR Polling constructor.
         *
         * @param {Object} opts
         * @api public
         */
        constructor(opts) {
          super(opts);
          this.polling = false;
          if (typeof location !== "undefined") {
            const isSSL = "https:" === location.protocol;
            let port = location.port;
            if (!port) {
              port = isSSL ? "443" : "80";
            }
            this.xd = typeof location !== "undefined" && opts.hostname !== location.hostname || port !== opts.port;
            this.xs = opts.secure !== isSSL;
          }
          const forceBase64 = opts && opts.forceBase64;
          this.supportsBinary = hasXHR2 && !forceBase64;
        }
        /**
         * Transport name.
         */
        get name() {
          return "polling";
        }
        /**
         * Opens the socket (triggers polling). We write a PING message to determine
         * when the transport is open.
         *
         * @api private
         */
        doOpen() {
          this.poll();
        }
        /**
         * Pauses polling.
         *
         * @param {Function} callback upon buffers are flushed and transport is paused
         * @api private
         */
        pause(onPause) {
          this.readyState = "pausing";
          const pause = () => {
            debug("paused");
            this.readyState = "paused";
            onPause();
          };
          if (this.polling || !this.writable) {
            let total = 0;
            if (this.polling) {
              debug("we are currently polling - waiting to pause");
              total++;
              this.once("pollComplete", function() {
                debug("pre-pause polling complete");
                --total || pause();
              });
            }
            if (!this.writable) {
              debug("we are currently writing - waiting to pause");
              total++;
              this.once("drain", function() {
                debug("pre-pause writing complete");
                --total || pause();
              });
            }
          } else {
            pause();
          }
        }
        /**
         * Starts polling cycle.
         *
         * @api public
         */
        poll() {
          debug("polling");
          this.polling = true;
          this.doPoll();
          this.emitReserved("poll");
        }
        /**
         * Overloads onData to detect payloads.
         *
         * @api private
         */
        onData(data) {
          debug("polling got data %s", data);
          const callback = (packet) => {
            if ("opening" === this.readyState && packet.type === "open") {
              this.onOpen();
            }
            if ("close" === packet.type) {
              this.onClose({ description: "transport closed by the server" });
              return false;
            }
            this.onPacket(packet);
          };
          (0, engine_io_parser_1.decodePayload)(data, this.socket.binaryType).forEach(callback);
          if ("closed" !== this.readyState) {
            this.polling = false;
            this.emitReserved("pollComplete");
            if ("open" === this.readyState) {
              this.poll();
            } else {
              debug('ignoring poll - transport state "%s"', this.readyState);
            }
          }
        }
        /**
         * For polling, send a close packet.
         *
         * @api private
         */
        doClose() {
          const close = () => {
            debug("writing close packet");
            this.write([{ type: "close" }]);
          };
          if ("open" === this.readyState) {
            debug("transport open - closing");
            close();
          } else {
            debug("transport not open - deferring close");
            this.once("open", close);
          }
        }
        /**
         * Writes a packets payload.
         *
         * @param {Array} data packets
         * @param {Function} drain callback
         * @api private
         */
        write(packets) {
          this.writable = false;
          (0, engine_io_parser_1.encodePayload)(packets, (data) => {
            this.doWrite(data, () => {
              this.writable = true;
              this.emitReserved("drain");
            });
          });
        }
        /**
         * Generates uri for connection.
         *
         * @api private
         */
        uri() {
          let query = this.query || {};
          const schema = this.opts.secure ? "https" : "http";
          let port = "";
          if (false !== this.opts.timestampRequests) {
            query[this.opts.timestampParam] = (0, yeast_js_1.yeast)();
          }
          if (!this.supportsBinary && !query.sid) {
            query.b64 = 1;
          }
          if (this.opts.port && ("https" === schema && Number(this.opts.port) !== 443 || "http" === schema && Number(this.opts.port) !== 80)) {
            port = ":" + this.opts.port;
          }
          const encodedQuery = (0, parseqs_js_1.encode)(query);
          const ipv6 = this.opts.hostname.indexOf(":") !== -1;
          return schema + "://" + (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) + port + this.opts.path + (encodedQuery.length ? "?" + encodedQuery : "");
        }
        /**
         * Creates a request.
         *
         * @param {String} method
         * @api private
         */
        request(opts = {}) {
          Object.assign(opts, { xd: this.xd, xs: this.xs }, this.opts);
          return new Request(this.uri(), opts);
        }
        /**
         * Sends data.
         *
         * @param {String} data to send.
         * @param {Function} called upon flush.
         * @api private
         */
        doWrite(data, fn) {
          const req = this.request({
            method: "POST",
            data
          });
          req.on("success", fn);
          req.on("error", (xhrStatus, context) => {
            this.onError("xhr post error", xhrStatus, context);
          });
        }
        /**
         * Starts a poll cycle.
         *
         * @api private
         */
        doPoll() {
          debug("xhr poll");
          const req = this.request();
          req.on("data", this.onData.bind(this));
          req.on("error", (xhrStatus, context) => {
            this.onError("xhr poll error", xhrStatus, context);
          });
          this.pollXhr = req;
        }
      };
      exports.Polling = Polling;
      var Request = class _Request extends component_emitter_1.Emitter {
        /**
         * Request constructor
         *
         * @param {Object} options
         * @api public
         */
        constructor(uri, opts) {
          super();
          (0, util_js_1.installTimerFunctions)(this, opts);
          this.opts = opts;
          this.method = opts.method || "GET";
          this.uri = uri;
          this.async = false !== opts.async;
          this.data = void 0 !== opts.data ? opts.data : null;
          this.create();
        }
        /**
         * Creates the XHR object and sends the request.
         *
         * @api private
         */
        create() {
          const opts = (0, util_js_1.pick)(this.opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
          opts.xdomain = !!this.opts.xd;
          opts.xscheme = !!this.opts.xs;
          const xhr = this.xhr = new xmlhttprequest_js_1.XHR(opts);
          try {
            debug("xhr open %s: %s", this.method, this.uri);
            xhr.open(this.method, this.uri, this.async);
            try {
              if (this.opts.extraHeaders) {
                xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
                for (let i in this.opts.extraHeaders) {
                  if (this.opts.extraHeaders.hasOwnProperty(i)) {
                    xhr.setRequestHeader(i, this.opts.extraHeaders[i]);
                  }
                }
              }
            } catch (e) {
            }
            if ("POST" === this.method) {
              try {
                xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
              } catch (e) {
              }
            }
            try {
              xhr.setRequestHeader("Accept", "*/*");
            } catch (e) {
            }
            if ("withCredentials" in xhr) {
              xhr.withCredentials = this.opts.withCredentials;
            }
            if (this.opts.requestTimeout) {
              xhr.timeout = this.opts.requestTimeout;
            }
            xhr.onreadystatechange = () => {
              if (4 !== xhr.readyState)
                return;
              if (200 === xhr.status || 1223 === xhr.status) {
                this.onLoad();
              } else {
                this.setTimeoutFn(() => {
                  this.onError(typeof xhr.status === "number" ? xhr.status : 0);
                }, 0);
              }
            };
            debug("xhr data %s", this.data);
            xhr.send(this.data);
          } catch (e) {
            this.setTimeoutFn(() => {
              this.onError(e);
            }, 0);
            return;
          }
          if (typeof document !== "undefined") {
            this.index = _Request.requestsCount++;
            _Request.requests[this.index] = this;
          }
        }
        /**
         * Called upon error.
         *
         * @api private
         */
        onError(err) {
          this.emitReserved("error", err, this.xhr);
          this.cleanup(true);
        }
        /**
         * Cleans up house.
         *
         * @api private
         */
        cleanup(fromError) {
          if ("undefined" === typeof this.xhr || null === this.xhr) {
            return;
          }
          this.xhr.onreadystatechange = empty;
          if (fromError) {
            try {
              this.xhr.abort();
            } catch (e) {
            }
          }
          if (typeof document !== "undefined") {
            delete _Request.requests[this.index];
          }
          this.xhr = null;
        }
        /**
         * Called upon load.
         *
         * @api private
         */
        onLoad() {
          const data = this.xhr.responseText;
          if (data !== null) {
            this.emitReserved("data", data);
            this.emitReserved("success");
            this.cleanup();
          }
        }
        /**
         * Aborts the request.
         *
         * @api public
         */
        abort() {
          this.cleanup();
        }
      };
      exports.Request = Request;
      Request.requestsCount = 0;
      Request.requests = {};
      if (typeof document !== "undefined") {
        if (typeof attachEvent === "function") {
          attachEvent("onunload", unloadHandler);
        } else if (typeof addEventListener === "function") {
          const terminationEvent = "onpagehide" in globalThis_js_1.globalThisShim ? "pagehide" : "unload";
          addEventListener(terminationEvent, unloadHandler, false);
        }
      }
      function unloadHandler() {
        for (let i in Request.requests) {
          if (Request.requests.hasOwnProperty(i)) {
            Request.requests[i].abort();
          }
        }
      }
    }
  });

  // node_modules/engine.io-client/build/cjs/transports/websocket-constructor.browser.js
  var require_websocket_constructor_browser = __commonJS({
    "node_modules/engine.io-client/build/cjs/transports/websocket-constructor.browser.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.defaultBinaryType = exports.usingBrowserWebSocket = exports.WebSocket = exports.nextTick = void 0;
      var globalThis_js_1 = require_globalThis_browser();
      exports.nextTick = (() => {
        const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
        if (isPromiseAvailable) {
          return (cb) => Promise.resolve().then(cb);
        } else {
          return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
        }
      })();
      exports.WebSocket = globalThis_js_1.globalThisShim.WebSocket || globalThis_js_1.globalThisShim.MozWebSocket;
      exports.usingBrowserWebSocket = true;
      exports.defaultBinaryType = "arraybuffer";
    }
  });

  // node_modules/engine.io-client/build/cjs/transports/websocket.js
  var require_websocket = __commonJS({
    "node_modules/engine.io-client/build/cjs/transports/websocket.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.WS = void 0;
      var transport_js_1 = require_transport();
      var parseqs_js_1 = require_parseqs();
      var yeast_js_1 = require_yeast();
      var util_js_1 = require_util();
      var websocket_constructor_js_1 = require_websocket_constructor_browser();
      var debug_1 = __importDefault(require_browser());
      var engine_io_parser_1 = require_cjs();
      var debug = (0, debug_1.default)("engine.io-client:websocket");
      var isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";
      var WS = class extends transport_js_1.Transport {
        /**
         * WebSocket transport constructor.
         *
         * @api {Object} connection options
         * @api public
         */
        constructor(opts) {
          super(opts);
          this.supportsBinary = !opts.forceBase64;
        }
        /**
         * Transport name.
         *
         * @api public
         */
        get name() {
          return "websocket";
        }
        /**
         * Opens socket.
         *
         * @api private
         */
        doOpen() {
          if (!this.check()) {
            return;
          }
          const uri = this.uri();
          const protocols = this.opts.protocols;
          const opts = isReactNative ? {} : (0, util_js_1.pick)(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
          if (this.opts.extraHeaders) {
            opts.headers = this.opts.extraHeaders;
          }
          try {
            this.ws = websocket_constructor_js_1.usingBrowserWebSocket && !isReactNative ? protocols ? new websocket_constructor_js_1.WebSocket(uri, protocols) : new websocket_constructor_js_1.WebSocket(uri) : new websocket_constructor_js_1.WebSocket(uri, protocols, opts);
          } catch (err) {
            return this.emitReserved("error", err);
          }
          this.ws.binaryType = this.socket.binaryType || websocket_constructor_js_1.defaultBinaryType;
          this.addEventListeners();
        }
        /**
         * Adds event listeners to the socket
         *
         * @api private
         */
        addEventListeners() {
          this.ws.onopen = () => {
            if (this.opts.autoUnref) {
              this.ws._socket.unref();
            }
            this.onOpen();
          };
          this.ws.onclose = (closeEvent) => this.onClose({
            description: "websocket connection closed",
            context: closeEvent
          });
          this.ws.onmessage = (ev) => this.onData(ev.data);
          this.ws.onerror = (e) => this.onError("websocket error", e);
        }
        /**
         * Writes data to socket.
         *
         * @param {Array} array of packets.
         * @api private
         */
        write(packets) {
          this.writable = false;
          for (let i = 0; i < packets.length; i++) {
            const packet = packets[i];
            const lastPacket = i === packets.length - 1;
            (0, engine_io_parser_1.encodePacket)(packet, this.supportsBinary, (data) => {
              const opts = {};
              if (!websocket_constructor_js_1.usingBrowserWebSocket) {
                if (packet.options) {
                  opts.compress = packet.options.compress;
                }
                if (this.opts.perMessageDeflate) {
                  const len = (
                    // @ts-ignore
                    "string" === typeof data ? Buffer.byteLength(data) : data.length
                  );
                  if (len < this.opts.perMessageDeflate.threshold) {
                    opts.compress = false;
                  }
                }
              }
              try {
                if (websocket_constructor_js_1.usingBrowserWebSocket) {
                  this.ws.send(data);
                } else {
                  this.ws.send(data, opts);
                }
              } catch (e) {
                debug("websocket closed before onclose event");
              }
              if (lastPacket) {
                (0, websocket_constructor_js_1.nextTick)(() => {
                  this.writable = true;
                  this.emitReserved("drain");
                }, this.setTimeoutFn);
              }
            });
          }
        }
        /**
         * Closes socket.
         *
         * @api private
         */
        doClose() {
          if (typeof this.ws !== "undefined") {
            this.ws.close();
            this.ws = null;
          }
        }
        /**
         * Generates uri for connection.
         *
         * @api private
         */
        uri() {
          let query = this.query || {};
          const schema = this.opts.secure ? "wss" : "ws";
          let port = "";
          if (this.opts.port && ("wss" === schema && Number(this.opts.port) !== 443 || "ws" === schema && Number(this.opts.port) !== 80)) {
            port = ":" + this.opts.port;
          }
          if (this.opts.timestampRequests) {
            query[this.opts.timestampParam] = (0, yeast_js_1.yeast)();
          }
          if (!this.supportsBinary) {
            query.b64 = 1;
          }
          const encodedQuery = (0, parseqs_js_1.encode)(query);
          const ipv6 = this.opts.hostname.indexOf(":") !== -1;
          return schema + "://" + (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) + port + this.opts.path + (encodedQuery.length ? "?" + encodedQuery : "");
        }
        /**
         * Feature detection for WebSocket.
         *
         * @return {Boolean} whether this transport is available.
         * @api public
         */
        check() {
          return !!websocket_constructor_js_1.WebSocket;
        }
      };
      exports.WS = WS;
    }
  });

  // node_modules/engine.io-client/build/cjs/transports/index.js
  var require_transports = __commonJS({
    "node_modules/engine.io-client/build/cjs/transports/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.transports = void 0;
      var polling_js_1 = require_polling();
      var websocket_js_1 = require_websocket();
      exports.transports = {
        websocket: websocket_js_1.WS,
        polling: polling_js_1.Polling
      };
    }
  });

  // node_modules/engine.io-client/build/cjs/contrib/parseuri.js
  var require_parseuri = __commonJS({
    "node_modules/engine.io-client/build/cjs/contrib/parseuri.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parse = void 0;
      var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
      var parts = [
        "source",
        "protocol",
        "authority",
        "userInfo",
        "user",
        "password",
        "host",
        "port",
        "relative",
        "path",
        "directory",
        "file",
        "query",
        "anchor"
      ];
      function parse(str) {
        const src = str, b = str.indexOf("["), e = str.indexOf("]");
        if (b != -1 && e != -1) {
          str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ";") + str.substring(e, str.length);
        }
        let m = re.exec(str || ""), uri = {}, i = 14;
        while (i--) {
          uri[parts[i]] = m[i] || "";
        }
        if (b != -1 && e != -1) {
          uri.source = src;
          uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ":");
          uri.authority = uri.authority.replace("[", "").replace("]", "").replace(/;/g, ":");
          uri.ipv6uri = true;
        }
        uri.pathNames = pathNames(uri, uri["path"]);
        uri.queryKey = queryKey(uri, uri["query"]);
        return uri;
      }
      exports.parse = parse;
      function pathNames(obj, path) {
        const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
        if (path.slice(0, 1) == "/" || path.length === 0) {
          names.splice(0, 1);
        }
        if (path.slice(-1) == "/") {
          names.splice(names.length - 1, 1);
        }
        return names;
      }
      function queryKey(uri, query) {
        const data = {};
        query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function($0, $1, $2) {
          if ($1) {
            data[$1] = $2;
          }
        });
        return data;
      }
    }
  });

  // node_modules/engine.io-client/build/cjs/socket.js
  var require_socket = __commonJS({
    "node_modules/engine.io-client/build/cjs/socket.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Socket = void 0;
      var index_js_1 = require_transports();
      var util_js_1 = require_util();
      var parseqs_js_1 = require_parseqs();
      var parseuri_js_1 = require_parseuri();
      var debug_1 = __importDefault(require_browser());
      var component_emitter_1 = require_component_emitter();
      var engine_io_parser_1 = require_cjs();
      var debug = (0, debug_1.default)("engine.io-client:socket");
      var Socket = class _Socket extends component_emitter_1.Emitter {
        /**
         * Socket constructor.
         *
         * @param {String|Object} uri or options
         * @param {Object} opts - options
         * @api public
         */
        constructor(uri, opts = {}) {
          super();
          if (uri && "object" === typeof uri) {
            opts = uri;
            uri = null;
          }
          if (uri) {
            uri = (0, parseuri_js_1.parse)(uri);
            opts.hostname = uri.host;
            opts.secure = uri.protocol === "https" || uri.protocol === "wss";
            opts.port = uri.port;
            if (uri.query)
              opts.query = uri.query;
          } else if (opts.host) {
            opts.hostname = (0, parseuri_js_1.parse)(opts.host).host;
          }
          (0, util_js_1.installTimerFunctions)(this, opts);
          this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;
          if (opts.hostname && !opts.port) {
            opts.port = this.secure ? "443" : "80";
          }
          this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
          this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : this.secure ? "443" : "80");
          this.transports = opts.transports || ["polling", "websocket"];
          this.readyState = "";
          this.writeBuffer = [];
          this.prevBufferLen = 0;
          this.opts = Object.assign({
            path: "/engine.io",
            agent: false,
            withCredentials: false,
            upgrade: true,
            timestampParam: "t",
            rememberUpgrade: false,
            rejectUnauthorized: true,
            perMessageDeflate: {
              threshold: 1024
            },
            transportOptions: {},
            closeOnBeforeunload: true
          }, opts);
          this.opts.path = this.opts.path.replace(/\/$/, "") + "/";
          if (typeof this.opts.query === "string") {
            this.opts.query = (0, parseqs_js_1.decode)(this.opts.query);
          }
          this.id = null;
          this.upgrades = null;
          this.pingInterval = null;
          this.pingTimeout = null;
          this.pingTimeoutTimer = null;
          if (typeof addEventListener === "function") {
            if (this.opts.closeOnBeforeunload) {
              this.beforeunloadEventListener = () => {
                if (this.transport) {
                  this.transport.removeAllListeners();
                  this.transport.close();
                }
              };
              addEventListener("beforeunload", this.beforeunloadEventListener, false);
            }
            if (this.hostname !== "localhost") {
              this.offlineEventListener = () => {
                this.onClose("transport close", {
                  description: "network connection lost"
                });
              };
              addEventListener("offline", this.offlineEventListener, false);
            }
          }
          this.open();
        }
        /**
         * Creates transport of the given type.
         *
         * @param {String} transport name
         * @return {Transport}
         * @api private
         */
        createTransport(name) {
          debug('creating transport "%s"', name);
          const query = Object.assign({}, this.opts.query);
          query.EIO = engine_io_parser_1.protocol;
          query.transport = name;
          if (this.id)
            query.sid = this.id;
          const opts = Object.assign({}, this.opts.transportOptions[name], this.opts, {
            query,
            socket: this,
            hostname: this.hostname,
            secure: this.secure,
            port: this.port
          });
          debug("options: %j", opts);
          return new index_js_1.transports[name](opts);
        }
        /**
         * Initializes transport to use and starts probe.
         *
         * @api private
         */
        open() {
          let transport;
          if (this.opts.rememberUpgrade && _Socket.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1) {
            transport = "websocket";
          } else if (0 === this.transports.length) {
            this.setTimeoutFn(() => {
              this.emitReserved("error", "No transports available");
            }, 0);
            return;
          } else {
            transport = this.transports[0];
          }
          this.readyState = "opening";
          try {
            transport = this.createTransport(transport);
          } catch (e) {
            debug("error while creating transport: %s", e);
            this.transports.shift();
            this.open();
            return;
          }
          transport.open();
          this.setTransport(transport);
        }
        /**
         * Sets the current transport. Disables the existing one (if any).
         *
         * @api private
         */
        setTransport(transport) {
          debug("setting transport %s", transport.name);
          if (this.transport) {
            debug("clearing existing transport %s", this.transport.name);
            this.transport.removeAllListeners();
          }
          this.transport = transport;
          transport.on("drain", this.onDrain.bind(this)).on("packet", this.onPacket.bind(this)).on("error", this.onError.bind(this)).on("close", (reason) => this.onClose("transport close", reason));
        }
        /**
         * Probes a transport.
         *
         * @param {String} transport name
         * @api private
         */
        probe(name) {
          debug('probing transport "%s"', name);
          let transport = this.createTransport(name);
          let failed = false;
          _Socket.priorWebsocketSuccess = false;
          const onTransportOpen = () => {
            if (failed)
              return;
            debug('probe transport "%s" opened', name);
            transport.send([{ type: "ping", data: "probe" }]);
            transport.once("packet", (msg) => {
              if (failed)
                return;
              if ("pong" === msg.type && "probe" === msg.data) {
                debug('probe transport "%s" pong', name);
                this.upgrading = true;
                this.emitReserved("upgrading", transport);
                if (!transport)
                  return;
                _Socket.priorWebsocketSuccess = "websocket" === transport.name;
                debug('pausing current transport "%s"', this.transport.name);
                this.transport.pause(() => {
                  if (failed)
                    return;
                  if ("closed" === this.readyState)
                    return;
                  debug("changing transport and sending upgrade packet");
                  cleanup();
                  this.setTransport(transport);
                  transport.send([{ type: "upgrade" }]);
                  this.emitReserved("upgrade", transport);
                  transport = null;
                  this.upgrading = false;
                  this.flush();
                });
              } else {
                debug('probe transport "%s" failed', name);
                const err = new Error("probe error");
                err.transport = transport.name;
                this.emitReserved("upgradeError", err);
              }
            });
          };
          function freezeTransport() {
            if (failed)
              return;
            failed = true;
            cleanup();
            transport.close();
            transport = null;
          }
          const onerror = (err) => {
            const error = new Error("probe error: " + err);
            error.transport = transport.name;
            freezeTransport();
            debug('probe transport "%s" failed because of error: %s', name, err);
            this.emitReserved("upgradeError", error);
          };
          function onTransportClose() {
            onerror("transport closed");
          }
          function onclose() {
            onerror("socket closed");
          }
          function onupgrade(to) {
            if (transport && to.name !== transport.name) {
              debug('"%s" works - aborting "%s"', to.name, transport.name);
              freezeTransport();
            }
          }
          const cleanup = () => {
            transport.removeListener("open", onTransportOpen);
            transport.removeListener("error", onerror);
            transport.removeListener("close", onTransportClose);
            this.off("close", onclose);
            this.off("upgrading", onupgrade);
          };
          transport.once("open", onTransportOpen);
          transport.once("error", onerror);
          transport.once("close", onTransportClose);
          this.once("close", onclose);
          this.once("upgrading", onupgrade);
          transport.open();
        }
        /**
         * Called when connection is deemed open.
         *
         * @api private
         */
        onOpen() {
          debug("socket open");
          this.readyState = "open";
          _Socket.priorWebsocketSuccess = "websocket" === this.transport.name;
          this.emitReserved("open");
          this.flush();
          if ("open" === this.readyState && this.opts.upgrade && this.transport.pause) {
            debug("starting upgrade probes");
            let i = 0;
            const l = this.upgrades.length;
            for (; i < l; i++) {
              this.probe(this.upgrades[i]);
            }
          }
        }
        /**
         * Handles a packet.
         *
         * @api private
         */
        onPacket(packet) {
          if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
            debug('socket receive: type "%s", data "%s"', packet.type, packet.data);
            this.emitReserved("packet", packet);
            this.emitReserved("heartbeat");
            switch (packet.type) {
              case "open":
                this.onHandshake(JSON.parse(packet.data));
                break;
              case "ping":
                this.resetPingTimeout();
                this.sendPacket("pong");
                this.emitReserved("ping");
                this.emitReserved("pong");
                break;
              case "error":
                const err = new Error("server error");
                err.code = packet.data;
                this.onError(err);
                break;
              case "message":
                this.emitReserved("data", packet.data);
                this.emitReserved("message", packet.data);
                break;
            }
          } else {
            debug('packet received with socket readyState "%s"', this.readyState);
          }
        }
        /**
         * Called upon handshake completion.
         *
         * @param {Object} data - handshake obj
         * @api private
         */
        onHandshake(data) {
          this.emitReserved("handshake", data);
          this.id = data.sid;
          this.transport.query.sid = data.sid;
          this.upgrades = this.filterUpgrades(data.upgrades);
          this.pingInterval = data.pingInterval;
          this.pingTimeout = data.pingTimeout;
          this.maxPayload = data.maxPayload;
          this.onOpen();
          if ("closed" === this.readyState)
            return;
          this.resetPingTimeout();
        }
        /**
         * Sets and resets ping timeout timer based on server pings.
         *
         * @api private
         */
        resetPingTimeout() {
          this.clearTimeoutFn(this.pingTimeoutTimer);
          this.pingTimeoutTimer = this.setTimeoutFn(() => {
            this.onClose("ping timeout");
          }, this.pingInterval + this.pingTimeout);
          if (this.opts.autoUnref) {
            this.pingTimeoutTimer.unref();
          }
        }
        /**
         * Called on `drain` event
         *
         * @api private
         */
        onDrain() {
          this.writeBuffer.splice(0, this.prevBufferLen);
          this.prevBufferLen = 0;
          if (0 === this.writeBuffer.length) {
            this.emitReserved("drain");
          } else {
            this.flush();
          }
        }
        /**
         * Flush write buffers.
         *
         * @api private
         */
        flush() {
          if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
            const packets = this.getWritablePackets();
            debug("flushing %d packets in socket", packets.length);
            this.transport.send(packets);
            this.prevBufferLen = packets.length;
            this.emitReserved("flush");
          }
        }
        /**
         * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
         * long-polling)
         *
         * @private
         */
        getWritablePackets() {
          const shouldCheckPayloadSize = this.maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1;
          if (!shouldCheckPayloadSize) {
            return this.writeBuffer;
          }
          let payloadSize = 1;
          for (let i = 0; i < this.writeBuffer.length; i++) {
            const data = this.writeBuffer[i].data;
            if (data) {
              payloadSize += (0, util_js_1.byteLength)(data);
            }
            if (i > 0 && payloadSize > this.maxPayload) {
              debug("only send %d out of %d packets", i, this.writeBuffer.length);
              return this.writeBuffer.slice(0, i);
            }
            payloadSize += 2;
          }
          debug("payload size is %d (max: %d)", payloadSize, this.maxPayload);
          return this.writeBuffer;
        }
        /**
         * Sends a message.
         *
         * @param {String} message.
         * @param {Function} callback function.
         * @param {Object} options.
         * @return {Socket} for chaining.
         * @api public
         */
        write(msg, options, fn) {
          this.sendPacket("message", msg, options, fn);
          return this;
        }
        send(msg, options, fn) {
          this.sendPacket("message", msg, options, fn);
          return this;
        }
        /**
         * Sends a packet.
         *
         * @param {String} packet type.
         * @param {String} data.
         * @param {Object} options.
         * @param {Function} callback function.
         * @api private
         */
        sendPacket(type, data, options, fn) {
          if ("function" === typeof data) {
            fn = data;
            data = void 0;
          }
          if ("function" === typeof options) {
            fn = options;
            options = null;
          }
          if ("closing" === this.readyState || "closed" === this.readyState) {
            return;
          }
          options = options || {};
          options.compress = false !== options.compress;
          const packet = {
            type,
            data,
            options
          };
          this.emitReserved("packetCreate", packet);
          this.writeBuffer.push(packet);
          if (fn)
            this.once("flush", fn);
          this.flush();
        }
        /**
         * Closes the connection.
         *
         * @api public
         */
        close() {
          const close = () => {
            this.onClose("forced close");
            debug("socket closing - telling transport to close");
            this.transport.close();
          };
          const cleanupAndClose = () => {
            this.off("upgrade", cleanupAndClose);
            this.off("upgradeError", cleanupAndClose);
            close();
          };
          const waitForUpgrade = () => {
            this.once("upgrade", cleanupAndClose);
            this.once("upgradeError", cleanupAndClose);
          };
          if ("opening" === this.readyState || "open" === this.readyState) {
            this.readyState = "closing";
            if (this.writeBuffer.length) {
              this.once("drain", () => {
                if (this.upgrading) {
                  waitForUpgrade();
                } else {
                  close();
                }
              });
            } else if (this.upgrading) {
              waitForUpgrade();
            } else {
              close();
            }
          }
          return this;
        }
        /**
         * Called upon transport error
         *
         * @api private
         */
        onError(err) {
          debug("socket error %j", err);
          _Socket.priorWebsocketSuccess = false;
          this.emitReserved("error", err);
          this.onClose("transport error", err);
        }
        /**
         * Called upon transport close.
         *
         * @api private
         */
        onClose(reason, description) {
          if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
            debug('socket close with reason: "%s"', reason);
            this.clearTimeoutFn(this.pingTimeoutTimer);
            this.transport.removeAllListeners("close");
            this.transport.close();
            this.transport.removeAllListeners();
            if (typeof removeEventListener === "function") {
              removeEventListener("beforeunload", this.beforeunloadEventListener, false);
              removeEventListener("offline", this.offlineEventListener, false);
            }
            this.readyState = "closed";
            this.id = null;
            this.emitReserved("close", reason, description);
            this.writeBuffer = [];
            this.prevBufferLen = 0;
          }
        }
        /**
         * Filters upgrades, returning only those matching client transports.
         *
         * @param {Array} server upgrades
         * @api private
         *
         */
        filterUpgrades(upgrades) {
          const filteredUpgrades = [];
          let i = 0;
          const j = upgrades.length;
          for (; i < j; i++) {
            if (~this.transports.indexOf(upgrades[i]))
              filteredUpgrades.push(upgrades[i]);
          }
          return filteredUpgrades;
        }
      };
      exports.Socket = Socket;
      Socket.protocol = engine_io_parser_1.protocol;
    }
  });

  // node_modules/engine.io-client/build/cjs/index.js
  var require_cjs2 = __commonJS({
    "node_modules/engine.io-client/build/cjs/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.nextTick = exports.parse = exports.installTimerFunctions = exports.transports = exports.Transport = exports.protocol = exports.Socket = void 0;
      var socket_js_1 = require_socket();
      Object.defineProperty(exports, "Socket", { enumerable: true, get: function() {
        return socket_js_1.Socket;
      } });
      exports.protocol = socket_js_1.Socket.protocol;
      var transport_js_1 = require_transport();
      Object.defineProperty(exports, "Transport", { enumerable: true, get: function() {
        return transport_js_1.Transport;
      } });
      var index_js_1 = require_transports();
      Object.defineProperty(exports, "transports", { enumerable: true, get: function() {
        return index_js_1.transports;
      } });
      var util_js_1 = require_util();
      Object.defineProperty(exports, "installTimerFunctions", { enumerable: true, get: function() {
        return util_js_1.installTimerFunctions;
      } });
      var parseuri_js_1 = require_parseuri();
      Object.defineProperty(exports, "parse", { enumerable: true, get: function() {
        return parseuri_js_1.parse;
      } });
      var websocket_constructor_js_1 = require_websocket_constructor_browser();
      Object.defineProperty(exports, "nextTick", { enumerable: true, get: function() {
        return websocket_constructor_js_1.nextTick;
      } });
    }
  });

  // node_modules/socket.io-client/node_modules/ms/index.js
  var require_ms2 = __commonJS({
    "node_modules/socket.io-client/node_modules/ms/index.js"(exports, module) {
      var s2 = 1e3;
      var m = s2 * 60;
      var h = m * 60;
      var d = h * 24;
      var w = d * 7;
      var y = d * 365.25;
      module.exports = function(val, options) {
        options = options || {};
        var type = typeof val;
        if (type === "string" && val.length > 0) {
          return parse(val);
        } else if (type === "number" && isFinite(val)) {
          return options.long ? fmtLong(val) : fmtShort(val);
        }
        throw new Error(
          "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
        );
      };
      function parse(str) {
        str = String(str);
        if (str.length > 100) {
          return;
        }
        var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
          str
        );
        if (!match) {
          return;
        }
        var n = parseFloat(match[1]);
        var type = (match[2] || "ms").toLowerCase();
        switch (type) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return n * y;
          case "weeks":
          case "week":
          case "w":
            return n * w;
          case "days":
          case "day":
          case "d":
            return n * d;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return n * h;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return n * m;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return n * s2;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return n;
          default:
            return void 0;
        }
      }
      function fmtShort(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return Math.round(ms / d) + "d";
        }
        if (msAbs >= h) {
          return Math.round(ms / h) + "h";
        }
        if (msAbs >= m) {
          return Math.round(ms / m) + "m";
        }
        if (msAbs >= s2) {
          return Math.round(ms / s2) + "s";
        }
        return ms + "ms";
      }
      function fmtLong(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return plural(ms, msAbs, d, "day");
        }
        if (msAbs >= h) {
          return plural(ms, msAbs, h, "hour");
        }
        if (msAbs >= m) {
          return plural(ms, msAbs, m, "minute");
        }
        if (msAbs >= s2) {
          return plural(ms, msAbs, s2, "second");
        }
        return ms + " ms";
      }
      function plural(ms, msAbs, n, name) {
        var isPlural = msAbs >= n * 1.5;
        return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
      }
    }
  });

  // node_modules/socket.io-client/node_modules/debug/src/common.js
  var require_common2 = __commonJS({
    "node_modules/socket.io-client/node_modules/debug/src/common.js"(exports, module) {
      function setup(env) {
        createDebug.debug = createDebug;
        createDebug.default = createDebug;
        createDebug.coerce = coerce;
        createDebug.disable = disable;
        createDebug.enable = enable;
        createDebug.enabled = enabled;
        createDebug.humanize = require_ms2();
        createDebug.destroy = destroy;
        Object.keys(env).forEach((key) => {
          createDebug[key] = env[key];
        });
        createDebug.names = [];
        createDebug.skips = [];
        createDebug.formatters = {};
        function selectColor(namespace) {
          let hash = 0;
          for (let i = 0; i < namespace.length; i++) {
            hash = (hash << 5) - hash + namespace.charCodeAt(i);
            hash |= 0;
          }
          return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
        }
        createDebug.selectColor = selectColor;
        function createDebug(namespace) {
          let prevTime;
          let enableOverride = null;
          let namespacesCache;
          let enabledCache;
          function debug(...args) {
            if (!debug.enabled) {
              return;
            }
            const self2 = debug;
            const curr = Number(/* @__PURE__ */ new Date());
            const ms = curr - (prevTime || curr);
            self2.diff = ms;
            self2.prev = prevTime;
            self2.curr = curr;
            prevTime = curr;
            args[0] = createDebug.coerce(args[0]);
            if (typeof args[0] !== "string") {
              args.unshift("%O");
            }
            let index = 0;
            args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
              if (match === "%%") {
                return "%";
              }
              index++;
              const formatter = createDebug.formatters[format];
              if (typeof formatter === "function") {
                const val = args[index];
                match = formatter.call(self2, val);
                args.splice(index, 1);
                index--;
              }
              return match;
            });
            createDebug.formatArgs.call(self2, args);
            const logFn = self2.log || createDebug.log;
            logFn.apply(self2, args);
          }
          debug.namespace = namespace;
          debug.useColors = createDebug.useColors();
          debug.color = createDebug.selectColor(namespace);
          debug.extend = extend;
          debug.destroy = createDebug.destroy;
          Object.defineProperty(debug, "enabled", {
            enumerable: true,
            configurable: false,
            get: () => {
              if (enableOverride !== null) {
                return enableOverride;
              }
              if (namespacesCache !== createDebug.namespaces) {
                namespacesCache = createDebug.namespaces;
                enabledCache = createDebug.enabled(namespace);
              }
              return enabledCache;
            },
            set: (v) => {
              enableOverride = v;
            }
          });
          if (typeof createDebug.init === "function") {
            createDebug.init(debug);
          }
          return debug;
        }
        function extend(namespace, delimiter) {
          const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
          newDebug.log = this.log;
          return newDebug;
        }
        function enable(namespaces) {
          createDebug.save(namespaces);
          createDebug.namespaces = namespaces;
          createDebug.names = [];
          createDebug.skips = [];
          let i;
          const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
          const len = split.length;
          for (i = 0; i < len; i++) {
            if (!split[i]) {
              continue;
            }
            namespaces = split[i].replace(/\*/g, ".*?");
            if (namespaces[0] === "-") {
              createDebug.skips.push(new RegExp("^" + namespaces.slice(1) + "$"));
            } else {
              createDebug.names.push(new RegExp("^" + namespaces + "$"));
            }
          }
        }
        function disable() {
          const namespaces = [
            ...createDebug.names.map(toNamespace),
            ...createDebug.skips.map(toNamespace).map((namespace) => "-" + namespace)
          ].join(",");
          createDebug.enable("");
          return namespaces;
        }
        function enabled(name) {
          if (name[name.length - 1] === "*") {
            return true;
          }
          let i;
          let len;
          for (i = 0, len = createDebug.skips.length; i < len; i++) {
            if (createDebug.skips[i].test(name)) {
              return false;
            }
          }
          for (i = 0, len = createDebug.names.length; i < len; i++) {
            if (createDebug.names[i].test(name)) {
              return true;
            }
          }
          return false;
        }
        function toNamespace(regexp) {
          return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, "*");
        }
        function coerce(val) {
          if (val instanceof Error) {
            return val.stack || val.message;
          }
          return val;
        }
        function destroy() {
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
        createDebug.enable(createDebug.load());
        return createDebug;
      }
      module.exports = setup;
    }
  });

  // node_modules/socket.io-client/node_modules/debug/src/browser.js
  var require_browser2 = __commonJS({
    "node_modules/socket.io-client/node_modules/debug/src/browser.js"(exports, module) {
      exports.formatArgs = formatArgs;
      exports.save = save;
      exports.load = load;
      exports.useColors = useColors;
      exports.storage = localstorage();
      exports.destroy = /* @__PURE__ */ (() => {
        let warned = false;
        return () => {
          if (!warned) {
            warned = true;
            console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
          }
        };
      })();
      exports.colors = [
        "#0000CC",
        "#0000FF",
        "#0033CC",
        "#0033FF",
        "#0066CC",
        "#0066FF",
        "#0099CC",
        "#0099FF",
        "#00CC00",
        "#00CC33",
        "#00CC66",
        "#00CC99",
        "#00CCCC",
        "#00CCFF",
        "#3300CC",
        "#3300FF",
        "#3333CC",
        "#3333FF",
        "#3366CC",
        "#3366FF",
        "#3399CC",
        "#3399FF",
        "#33CC00",
        "#33CC33",
        "#33CC66",
        "#33CC99",
        "#33CCCC",
        "#33CCFF",
        "#6600CC",
        "#6600FF",
        "#6633CC",
        "#6633FF",
        "#66CC00",
        "#66CC33",
        "#9900CC",
        "#9900FF",
        "#9933CC",
        "#9933FF",
        "#99CC00",
        "#99CC33",
        "#CC0000",
        "#CC0033",
        "#CC0066",
        "#CC0099",
        "#CC00CC",
        "#CC00FF",
        "#CC3300",
        "#CC3333",
        "#CC3366",
        "#CC3399",
        "#CC33CC",
        "#CC33FF",
        "#CC6600",
        "#CC6633",
        "#CC9900",
        "#CC9933",
        "#CCCC00",
        "#CCCC33",
        "#FF0000",
        "#FF0033",
        "#FF0066",
        "#FF0099",
        "#FF00CC",
        "#FF00FF",
        "#FF3300",
        "#FF3333",
        "#FF3366",
        "#FF3399",
        "#FF33CC",
        "#FF33FF",
        "#FF6600",
        "#FF6633",
        "#FF9900",
        "#FF9933",
        "#FFCC00",
        "#FFCC33"
      ];
      function useColors() {
        if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
          return true;
        }
        if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
          return false;
        }
        return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
        typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
        // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
        typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
        typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
      }
      function formatArgs(args) {
        args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
        if (!this.useColors) {
          return;
        }
        const c = "color: " + this.color;
        args.splice(1, 0, c, "color: inherit");
        let index = 0;
        let lastC = 0;
        args[0].replace(/%[a-zA-Z%]/g, (match) => {
          if (match === "%%") {
            return;
          }
          index++;
          if (match === "%c") {
            lastC = index;
          }
        });
        args.splice(lastC, 0, c);
      }
      exports.log = console.debug || console.log || (() => {
      });
      function save(namespaces) {
        try {
          if (namespaces) {
            exports.storage.setItem("debug", namespaces);
          } else {
            exports.storage.removeItem("debug");
          }
        } catch (error) {
        }
      }
      function load() {
        let r;
        try {
          r = exports.storage.getItem("debug");
        } catch (error) {
        }
        if (!r && typeof process !== "undefined" && "env" in process) {
          r = process.env.DEBUG;
        }
        return r;
      }
      function localstorage() {
        try {
          return localStorage;
        } catch (error) {
        }
      }
      module.exports = require_common2()(exports);
      var { formatters } = module.exports;
      formatters.j = function(v) {
        try {
          return JSON.stringify(v);
        } catch (error) {
          return "[UnexpectedJSONParseError]: " + error.message;
        }
      };
    }
  });

  // node_modules/socket.io-client/build/cjs/url.js
  var require_url = __commonJS({
    "node_modules/socket.io-client/build/cjs/url.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.url = void 0;
      var engine_io_client_1 = require_cjs2();
      var debug_1 = __importDefault(require_browser2());
      var debug = debug_1.default("socket.io-client:url");
      function url(uri, path = "", loc) {
        let obj = uri;
        loc = loc || typeof location !== "undefined" && location;
        if (null == uri)
          uri = loc.protocol + "//" + loc.host;
        if (typeof uri === "string") {
          if ("/" === uri.charAt(0)) {
            if ("/" === uri.charAt(1)) {
              uri = loc.protocol + uri;
            } else {
              uri = loc.host + uri;
            }
          }
          if (!/^(https?|wss?):\/\//.test(uri)) {
            debug("protocol-less url %s", uri);
            if ("undefined" !== typeof loc) {
              uri = loc.protocol + "//" + uri;
            } else {
              uri = "https://" + uri;
            }
          }
          debug("parse %s", uri);
          obj = engine_io_client_1.parse(uri);
        }
        if (!obj.port) {
          if (/^(http|ws)$/.test(obj.protocol)) {
            obj.port = "80";
          } else if (/^(http|ws)s$/.test(obj.protocol)) {
            obj.port = "443";
          }
        }
        obj.path = obj.path || "/";
        const ipv6 = obj.host.indexOf(":") !== -1;
        const host = ipv6 ? "[" + obj.host + "]" : obj.host;
        obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
        obj.href = obj.protocol + "://" + host + (loc && loc.port === obj.port ? "" : ":" + obj.port);
        return obj;
      }
      exports.url = url;
    }
  });

  // node_modules/socket.io-parser/build/cjs/is-binary.js
  var require_is_binary = __commonJS({
    "node_modules/socket.io-parser/build/cjs/is-binary.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.hasBinary = exports.isBinary = void 0;
      var withNativeArrayBuffer = typeof ArrayBuffer === "function";
      var isView = (obj) => {
        return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
      };
      var toString = Object.prototype.toString;
      var withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
      var withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
      function isBinary(obj) {
        return withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj)) || withNativeBlob && obj instanceof Blob || withNativeFile && obj instanceof File;
      }
      exports.isBinary = isBinary;
      function hasBinary(obj, toJSON) {
        if (!obj || typeof obj !== "object") {
          return false;
        }
        if (Array.isArray(obj)) {
          for (let i = 0, l = obj.length; i < l; i++) {
            if (hasBinary(obj[i])) {
              return true;
            }
          }
          return false;
        }
        if (isBinary(obj)) {
          return true;
        }
        if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) {
          return hasBinary(obj.toJSON(), true);
        }
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
            return true;
          }
        }
        return false;
      }
      exports.hasBinary = hasBinary;
    }
  });

  // node_modules/socket.io-parser/build/cjs/binary.js
  var require_binary = __commonJS({
    "node_modules/socket.io-parser/build/cjs/binary.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.reconstructPacket = exports.deconstructPacket = void 0;
      var is_binary_js_1 = require_is_binary();
      function deconstructPacket(packet) {
        const buffers = [];
        const packetData = packet.data;
        const pack = packet;
        pack.data = _deconstructPacket(packetData, buffers);
        pack.attachments = buffers.length;
        return { packet: pack, buffers };
      }
      exports.deconstructPacket = deconstructPacket;
      function _deconstructPacket(data, buffers) {
        if (!data)
          return data;
        if (is_binary_js_1.isBinary(data)) {
          const placeholder = { _placeholder: true, num: buffers.length };
          buffers.push(data);
          return placeholder;
        } else if (Array.isArray(data)) {
          const newData = new Array(data.length);
          for (let i = 0; i < data.length; i++) {
            newData[i] = _deconstructPacket(data[i], buffers);
          }
          return newData;
        } else if (typeof data === "object" && !(data instanceof Date)) {
          const newData = {};
          for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
              newData[key] = _deconstructPacket(data[key], buffers);
            }
          }
          return newData;
        }
        return data;
      }
      function reconstructPacket(packet, buffers) {
        packet.data = _reconstructPacket(packet.data, buffers);
        packet.attachments = void 0;
        return packet;
      }
      exports.reconstructPacket = reconstructPacket;
      function _reconstructPacket(data, buffers) {
        if (!data)
          return data;
        if (data && data._placeholder === true) {
          const isIndexValid = typeof data.num === "number" && data.num >= 0 && data.num < buffers.length;
          if (isIndexValid) {
            return buffers[data.num];
          } else {
            throw new Error("illegal attachments");
          }
        } else if (Array.isArray(data)) {
          for (let i = 0; i < data.length; i++) {
            data[i] = _reconstructPacket(data[i], buffers);
          }
        } else if (typeof data === "object") {
          for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
              data[key] = _reconstructPacket(data[key], buffers);
            }
          }
        }
        return data;
      }
    }
  });

  // node_modules/socket.io-parser/node_modules/ms/index.js
  var require_ms3 = __commonJS({
    "node_modules/socket.io-parser/node_modules/ms/index.js"(exports, module) {
      var s2 = 1e3;
      var m = s2 * 60;
      var h = m * 60;
      var d = h * 24;
      var w = d * 7;
      var y = d * 365.25;
      module.exports = function(val, options) {
        options = options || {};
        var type = typeof val;
        if (type === "string" && val.length > 0) {
          return parse(val);
        } else if (type === "number" && isFinite(val)) {
          return options.long ? fmtLong(val) : fmtShort(val);
        }
        throw new Error(
          "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
        );
      };
      function parse(str) {
        str = String(str);
        if (str.length > 100) {
          return;
        }
        var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
          str
        );
        if (!match) {
          return;
        }
        var n = parseFloat(match[1]);
        var type = (match[2] || "ms").toLowerCase();
        switch (type) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return n * y;
          case "weeks":
          case "week":
          case "w":
            return n * w;
          case "days":
          case "day":
          case "d":
            return n * d;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return n * h;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return n * m;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return n * s2;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return n;
          default:
            return void 0;
        }
      }
      function fmtShort(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return Math.round(ms / d) + "d";
        }
        if (msAbs >= h) {
          return Math.round(ms / h) + "h";
        }
        if (msAbs >= m) {
          return Math.round(ms / m) + "m";
        }
        if (msAbs >= s2) {
          return Math.round(ms / s2) + "s";
        }
        return ms + "ms";
      }
      function fmtLong(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return plural(ms, msAbs, d, "day");
        }
        if (msAbs >= h) {
          return plural(ms, msAbs, h, "hour");
        }
        if (msAbs >= m) {
          return plural(ms, msAbs, m, "minute");
        }
        if (msAbs >= s2) {
          return plural(ms, msAbs, s2, "second");
        }
        return ms + " ms";
      }
      function plural(ms, msAbs, n, name) {
        var isPlural = msAbs >= n * 1.5;
        return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
      }
    }
  });

  // node_modules/socket.io-parser/node_modules/debug/src/common.js
  var require_common3 = __commonJS({
    "node_modules/socket.io-parser/node_modules/debug/src/common.js"(exports, module) {
      function setup(env) {
        createDebug.debug = createDebug;
        createDebug.default = createDebug;
        createDebug.coerce = coerce;
        createDebug.disable = disable;
        createDebug.enable = enable;
        createDebug.enabled = enabled;
        createDebug.humanize = require_ms3();
        createDebug.destroy = destroy;
        Object.keys(env).forEach((key) => {
          createDebug[key] = env[key];
        });
        createDebug.names = [];
        createDebug.skips = [];
        createDebug.formatters = {};
        function selectColor(namespace) {
          let hash = 0;
          for (let i = 0; i < namespace.length; i++) {
            hash = (hash << 5) - hash + namespace.charCodeAt(i);
            hash |= 0;
          }
          return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
        }
        createDebug.selectColor = selectColor;
        function createDebug(namespace) {
          let prevTime;
          let enableOverride = null;
          let namespacesCache;
          let enabledCache;
          function debug(...args) {
            if (!debug.enabled) {
              return;
            }
            const self2 = debug;
            const curr = Number(/* @__PURE__ */ new Date());
            const ms = curr - (prevTime || curr);
            self2.diff = ms;
            self2.prev = prevTime;
            self2.curr = curr;
            prevTime = curr;
            args[0] = createDebug.coerce(args[0]);
            if (typeof args[0] !== "string") {
              args.unshift("%O");
            }
            let index = 0;
            args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
              if (match === "%%") {
                return "%";
              }
              index++;
              const formatter = createDebug.formatters[format];
              if (typeof formatter === "function") {
                const val = args[index];
                match = formatter.call(self2, val);
                args.splice(index, 1);
                index--;
              }
              return match;
            });
            createDebug.formatArgs.call(self2, args);
            const logFn = self2.log || createDebug.log;
            logFn.apply(self2, args);
          }
          debug.namespace = namespace;
          debug.useColors = createDebug.useColors();
          debug.color = createDebug.selectColor(namespace);
          debug.extend = extend;
          debug.destroy = createDebug.destroy;
          Object.defineProperty(debug, "enabled", {
            enumerable: true,
            configurable: false,
            get: () => {
              if (enableOverride !== null) {
                return enableOverride;
              }
              if (namespacesCache !== createDebug.namespaces) {
                namespacesCache = createDebug.namespaces;
                enabledCache = createDebug.enabled(namespace);
              }
              return enabledCache;
            },
            set: (v) => {
              enableOverride = v;
            }
          });
          if (typeof createDebug.init === "function") {
            createDebug.init(debug);
          }
          return debug;
        }
        function extend(namespace, delimiter) {
          const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
          newDebug.log = this.log;
          return newDebug;
        }
        function enable(namespaces) {
          createDebug.save(namespaces);
          createDebug.namespaces = namespaces;
          createDebug.names = [];
          createDebug.skips = [];
          let i;
          const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
          const len = split.length;
          for (i = 0; i < len; i++) {
            if (!split[i]) {
              continue;
            }
            namespaces = split[i].replace(/\*/g, ".*?");
            if (namespaces[0] === "-") {
              createDebug.skips.push(new RegExp("^" + namespaces.slice(1) + "$"));
            } else {
              createDebug.names.push(new RegExp("^" + namespaces + "$"));
            }
          }
        }
        function disable() {
          const namespaces = [
            ...createDebug.names.map(toNamespace),
            ...createDebug.skips.map(toNamespace).map((namespace) => "-" + namespace)
          ].join(",");
          createDebug.enable("");
          return namespaces;
        }
        function enabled(name) {
          if (name[name.length - 1] === "*") {
            return true;
          }
          let i;
          let len;
          for (i = 0, len = createDebug.skips.length; i < len; i++) {
            if (createDebug.skips[i].test(name)) {
              return false;
            }
          }
          for (i = 0, len = createDebug.names.length; i < len; i++) {
            if (createDebug.names[i].test(name)) {
              return true;
            }
          }
          return false;
        }
        function toNamespace(regexp) {
          return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, "*");
        }
        function coerce(val) {
          if (val instanceof Error) {
            return val.stack || val.message;
          }
          return val;
        }
        function destroy() {
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
        createDebug.enable(createDebug.load());
        return createDebug;
      }
      module.exports = setup;
    }
  });

  // node_modules/socket.io-parser/node_modules/debug/src/browser.js
  var require_browser3 = __commonJS({
    "node_modules/socket.io-parser/node_modules/debug/src/browser.js"(exports, module) {
      exports.formatArgs = formatArgs;
      exports.save = save;
      exports.load = load;
      exports.useColors = useColors;
      exports.storage = localstorage();
      exports.destroy = /* @__PURE__ */ (() => {
        let warned = false;
        return () => {
          if (!warned) {
            warned = true;
            console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
          }
        };
      })();
      exports.colors = [
        "#0000CC",
        "#0000FF",
        "#0033CC",
        "#0033FF",
        "#0066CC",
        "#0066FF",
        "#0099CC",
        "#0099FF",
        "#00CC00",
        "#00CC33",
        "#00CC66",
        "#00CC99",
        "#00CCCC",
        "#00CCFF",
        "#3300CC",
        "#3300FF",
        "#3333CC",
        "#3333FF",
        "#3366CC",
        "#3366FF",
        "#3399CC",
        "#3399FF",
        "#33CC00",
        "#33CC33",
        "#33CC66",
        "#33CC99",
        "#33CCCC",
        "#33CCFF",
        "#6600CC",
        "#6600FF",
        "#6633CC",
        "#6633FF",
        "#66CC00",
        "#66CC33",
        "#9900CC",
        "#9900FF",
        "#9933CC",
        "#9933FF",
        "#99CC00",
        "#99CC33",
        "#CC0000",
        "#CC0033",
        "#CC0066",
        "#CC0099",
        "#CC00CC",
        "#CC00FF",
        "#CC3300",
        "#CC3333",
        "#CC3366",
        "#CC3399",
        "#CC33CC",
        "#CC33FF",
        "#CC6600",
        "#CC6633",
        "#CC9900",
        "#CC9933",
        "#CCCC00",
        "#CCCC33",
        "#FF0000",
        "#FF0033",
        "#FF0066",
        "#FF0099",
        "#FF00CC",
        "#FF00FF",
        "#FF3300",
        "#FF3333",
        "#FF3366",
        "#FF3399",
        "#FF33CC",
        "#FF33FF",
        "#FF6600",
        "#FF6633",
        "#FF9900",
        "#FF9933",
        "#FFCC00",
        "#FFCC33"
      ];
      function useColors() {
        if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
          return true;
        }
        if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
          return false;
        }
        return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
        typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
        // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
        typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
        typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
      }
      function formatArgs(args) {
        args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
        if (!this.useColors) {
          return;
        }
        const c = "color: " + this.color;
        args.splice(1, 0, c, "color: inherit");
        let index = 0;
        let lastC = 0;
        args[0].replace(/%[a-zA-Z%]/g, (match) => {
          if (match === "%%") {
            return;
          }
          index++;
          if (match === "%c") {
            lastC = index;
          }
        });
        args.splice(lastC, 0, c);
      }
      exports.log = console.debug || console.log || (() => {
      });
      function save(namespaces) {
        try {
          if (namespaces) {
            exports.storage.setItem("debug", namespaces);
          } else {
            exports.storage.removeItem("debug");
          }
        } catch (error) {
        }
      }
      function load() {
        let r;
        try {
          r = exports.storage.getItem("debug");
        } catch (error) {
        }
        if (!r && typeof process !== "undefined" && "env" in process) {
          r = process.env.DEBUG;
        }
        return r;
      }
      function localstorage() {
        try {
          return localStorage;
        } catch (error) {
        }
      }
      module.exports = require_common3()(exports);
      var { formatters } = module.exports;
      formatters.j = function(v) {
        try {
          return JSON.stringify(v);
        } catch (error) {
          return "[UnexpectedJSONParseError]: " + error.message;
        }
      };
    }
  });

  // node_modules/socket.io-parser/build/cjs/index.js
  var require_cjs3 = __commonJS({
    "node_modules/socket.io-parser/build/cjs/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Decoder = exports.Encoder = exports.PacketType = exports.protocol = void 0;
      var component_emitter_1 = require_component_emitter();
      var binary_js_1 = require_binary();
      var is_binary_js_1 = require_is_binary();
      var debug_1 = require_browser3();
      var debug = debug_1.default("socket.io-parser");
      exports.protocol = 5;
      var PacketType;
      (function(PacketType2) {
        PacketType2[PacketType2["CONNECT"] = 0] = "CONNECT";
        PacketType2[PacketType2["DISCONNECT"] = 1] = "DISCONNECT";
        PacketType2[PacketType2["EVENT"] = 2] = "EVENT";
        PacketType2[PacketType2["ACK"] = 3] = "ACK";
        PacketType2[PacketType2["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
        PacketType2[PacketType2["BINARY_EVENT"] = 5] = "BINARY_EVENT";
        PacketType2[PacketType2["BINARY_ACK"] = 6] = "BINARY_ACK";
      })(PacketType = exports.PacketType || (exports.PacketType = {}));
      var Encoder = class {
        /**
         * Encoder constructor
         *
         * @param {function} replacer - custom replacer to pass down to JSON.parse
         */
        constructor(replacer) {
          this.replacer = replacer;
        }
        /**
         * Encode a packet as a single string if non-binary, or as a
         * buffer sequence, depending on packet type.
         *
         * @param {Object} obj - packet object
         */
        encode(obj) {
          debug("encoding packet %j", obj);
          if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
            if (is_binary_js_1.hasBinary(obj)) {
              obj.type = obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK;
              return this.encodeAsBinary(obj);
            }
          }
          return [this.encodeAsString(obj)];
        }
        /**
         * Encode packet as string.
         */
        encodeAsString(obj) {
          let str = "" + obj.type;
          if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) {
            str += obj.attachments + "-";
          }
          if (obj.nsp && "/" !== obj.nsp) {
            str += obj.nsp + ",";
          }
          if (null != obj.id) {
            str += obj.id;
          }
          if (null != obj.data) {
            str += JSON.stringify(obj.data, this.replacer);
          }
          debug("encoded %j as %s", obj, str);
          return str;
        }
        /**
         * Encode packet as 'buffer sequence' by removing blobs, and
         * deconstructing packet into object with placeholders and
         * a list of buffers.
         */
        encodeAsBinary(obj) {
          const deconstruction = binary_js_1.deconstructPacket(obj);
          const pack = this.encodeAsString(deconstruction.packet);
          const buffers = deconstruction.buffers;
          buffers.unshift(pack);
          return buffers;
        }
      };
      exports.Encoder = Encoder;
      var Decoder = class _Decoder extends component_emitter_1.Emitter {
        /**
         * Decoder constructor
         *
         * @param {function} reviver - custom reviver to pass down to JSON.stringify
         */
        constructor(reviver) {
          super();
          this.reviver = reviver;
        }
        /**
         * Decodes an encoded packet string into packet JSON.
         *
         * @param {String} obj - encoded packet
         */
        add(obj) {
          let packet;
          if (typeof obj === "string") {
            if (this.reconstructor) {
              throw new Error("got plaintext data when reconstructing a packet");
            }
            packet = this.decodeString(obj);
            if (packet.type === PacketType.BINARY_EVENT || packet.type === PacketType.BINARY_ACK) {
              this.reconstructor = new BinaryReconstructor(packet);
              if (packet.attachments === 0) {
                super.emitReserved("decoded", packet);
              }
            } else {
              super.emitReserved("decoded", packet);
            }
          } else if (is_binary_js_1.isBinary(obj) || obj.base64) {
            if (!this.reconstructor) {
              throw new Error("got binary data when not reconstructing a packet");
            } else {
              packet = this.reconstructor.takeBinaryData(obj);
              if (packet) {
                this.reconstructor = null;
                super.emitReserved("decoded", packet);
              }
            }
          } else {
            throw new Error("Unknown type: " + obj);
          }
        }
        /**
         * Decode a packet String (JSON data)
         *
         * @param {String} str
         * @return {Object} packet
         */
        decodeString(str) {
          let i = 0;
          const p = {
            type: Number(str.charAt(0))
          };
          if (PacketType[p.type] === void 0) {
            throw new Error("unknown packet type " + p.type);
          }
          if (p.type === PacketType.BINARY_EVENT || p.type === PacketType.BINARY_ACK) {
            const start = i + 1;
            while (str.charAt(++i) !== "-" && i != str.length) {
            }
            const buf = str.substring(start, i);
            if (buf != Number(buf) || str.charAt(i) !== "-") {
              throw new Error("Illegal attachments");
            }
            p.attachments = Number(buf);
          }
          if ("/" === str.charAt(i + 1)) {
            const start = i + 1;
            while (++i) {
              const c = str.charAt(i);
              if ("," === c)
                break;
              if (i === str.length)
                break;
            }
            p.nsp = str.substring(start, i);
          } else {
            p.nsp = "/";
          }
          const next = str.charAt(i + 1);
          if ("" !== next && Number(next) == next) {
            const start = i + 1;
            while (++i) {
              const c = str.charAt(i);
              if (null == c || Number(c) != c) {
                --i;
                break;
              }
              if (i === str.length)
                break;
            }
            p.id = Number(str.substring(start, i + 1));
          }
          if (str.charAt(++i)) {
            const payload = this.tryParse(str.substr(i));
            if (_Decoder.isPayloadValid(p.type, payload)) {
              p.data = payload;
            } else {
              throw new Error("invalid payload");
            }
          }
          debug("decoded %s as %j", str, p);
          return p;
        }
        tryParse(str) {
          try {
            return JSON.parse(str, this.reviver);
          } catch (e) {
            return false;
          }
        }
        static isPayloadValid(type, payload) {
          switch (type) {
            case PacketType.CONNECT:
              return typeof payload === "object";
            case PacketType.DISCONNECT:
              return payload === void 0;
            case PacketType.CONNECT_ERROR:
              return typeof payload === "string" || typeof payload === "object";
            case PacketType.EVENT:
            case PacketType.BINARY_EVENT:
              return Array.isArray(payload) && payload.length > 0;
            case PacketType.ACK:
            case PacketType.BINARY_ACK:
              return Array.isArray(payload);
          }
        }
        /**
         * Deallocates a parser's resources
         */
        destroy() {
          if (this.reconstructor) {
            this.reconstructor.finishedReconstruction();
          }
        }
      };
      exports.Decoder = Decoder;
      var BinaryReconstructor = class {
        constructor(packet) {
          this.packet = packet;
          this.buffers = [];
          this.reconPack = packet;
        }
        /**
         * Method to be called when binary data received from connection
         * after a BINARY_EVENT packet.
         *
         * @param {Buffer | ArrayBuffer} binData - the raw binary data received
         * @return {null | Object} returns null if more binary data is expected or
         *   a reconstructed packet object if all buffers have been received.
         */
        takeBinaryData(binData) {
          this.buffers.push(binData);
          if (this.buffers.length === this.reconPack.attachments) {
            const packet = binary_js_1.reconstructPacket(this.reconPack, this.buffers);
            this.finishedReconstruction();
            return packet;
          }
          return null;
        }
        /**
         * Cleans up binary packet reconstruction variables.
         */
        finishedReconstruction() {
          this.reconPack = null;
          this.buffers = [];
        }
      };
    }
  });

  // node_modules/socket.io-client/build/cjs/on.js
  var require_on = __commonJS({
    "node_modules/socket.io-client/build/cjs/on.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.on = void 0;
      function on(obj, ev, fn) {
        obj.on(ev, fn);
        return function subDestroy() {
          obj.off(ev, fn);
        };
      }
      exports.on = on;
    }
  });

  // node_modules/socket.io-client/build/cjs/socket.js
  var require_socket2 = __commonJS({
    "node_modules/socket.io-client/build/cjs/socket.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Socket = void 0;
      var socket_io_parser_1 = require_cjs3();
      var on_js_1 = require_on();
      var component_emitter_1 = require_component_emitter();
      var debug_1 = __importDefault(require_browser2());
      var debug = debug_1.default("socket.io-client:socket");
      var RESERVED_EVENTS = Object.freeze({
        connect: 1,
        connect_error: 1,
        disconnect: 1,
        disconnecting: 1,
        // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
        newListener: 1,
        removeListener: 1
      });
      var Socket = class extends component_emitter_1.Emitter {
        /**
         * `Socket` constructor.
         */
        constructor(io2, nsp, opts) {
          super();
          this.connected = false;
          this.receiveBuffer = [];
          this.sendBuffer = [];
          this.ids = 0;
          this.acks = {};
          this.flags = {};
          this.io = io2;
          this.nsp = nsp;
          if (opts && opts.auth) {
            this.auth = opts.auth;
          }
          if (this.io._autoConnect)
            this.open();
        }
        /**
         * Whether the socket is currently disconnected
         *
         * @example
         * const socket = io();
         *
         * socket.on("connect", () => {
         *   console.log(socket.disconnected); // false
         * });
         *
         * socket.on("disconnect", () => {
         *   console.log(socket.disconnected); // true
         * });
         */
        get disconnected() {
          return !this.connected;
        }
        /**
         * Subscribe to open, close and packet events
         *
         * @private
         */
        subEvents() {
          if (this.subs)
            return;
          const io2 = this.io;
          this.subs = [
            on_js_1.on(io2, "open", this.onopen.bind(this)),
            on_js_1.on(io2, "packet", this.onpacket.bind(this)),
            on_js_1.on(io2, "error", this.onerror.bind(this)),
            on_js_1.on(io2, "close", this.onclose.bind(this))
          ];
        }
        /**
         * Whether the Socket will try to reconnect when its Manager connects or reconnects.
         *
         * @example
         * const socket = io();
         *
         * console.log(socket.active); // true
         *
         * socket.on("disconnect", (reason) => {
         *   if (reason === "io server disconnect") {
         *     // the disconnection was initiated by the server, you need to manually reconnect
         *     console.log(socket.active); // false
         *   }
         *   // else the socket will automatically try to reconnect
         *   console.log(socket.active); // true
         * });
         */
        get active() {
          return !!this.subs;
        }
        /**
         * "Opens" the socket.
         *
         * @example
         * const socket = io({
         *   autoConnect: false
         * });
         *
         * socket.connect();
         */
        connect() {
          if (this.connected)
            return this;
          this.subEvents();
          if (!this.io["_reconnecting"])
            this.io.open();
          if ("open" === this.io._readyState)
            this.onopen();
          return this;
        }
        /**
         * Alias for {@link connect()}.
         */
        open() {
          return this.connect();
        }
        /**
         * Sends a `message` event.
         *
         * This method mimics the WebSocket.send() method.
         *
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
         *
         * @example
         * socket.send("hello");
         *
         * // this is equivalent to
         * socket.emit("message", "hello");
         *
         * @return self
         */
        send(...args) {
          args.unshift("message");
          this.emit.apply(this, args);
          return this;
        }
        /**
         * Override `emit`.
         * If the event is in `events`, it's emitted normally.
         *
         * @example
         * socket.emit("hello", "world");
         *
         * // all serializable datastructures are supported (no need to call JSON.stringify)
         * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
         *
         * // with an acknowledgement from the server
         * socket.emit("hello", "world", (val) => {
         *   // ...
         * });
         *
         * @return self
         */
        emit(ev, ...args) {
          if (RESERVED_EVENTS.hasOwnProperty(ev)) {
            throw new Error('"' + ev.toString() + '" is a reserved event name');
          }
          args.unshift(ev);
          const packet = {
            type: socket_io_parser_1.PacketType.EVENT,
            data: args
          };
          packet.options = {};
          packet.options.compress = this.flags.compress !== false;
          if ("function" === typeof args[args.length - 1]) {
            const id = this.ids++;
            debug("emitting packet with ack id %d", id);
            const ack = args.pop();
            this._registerAckCallback(id, ack);
            packet.id = id;
          }
          const isTransportWritable = this.io.engine && this.io.engine.transport && this.io.engine.transport.writable;
          const discardPacket = this.flags.volatile && (!isTransportWritable || !this.connected);
          if (discardPacket) {
            debug("discard packet as the transport is not currently writable");
          } else if (this.connected) {
            this.notifyOutgoingListeners(packet);
            this.packet(packet);
          } else {
            this.sendBuffer.push(packet);
          }
          this.flags = {};
          return this;
        }
        /**
         * @private
         */
        _registerAckCallback(id, ack) {
          const timeout = this.flags.timeout;
          if (timeout === void 0) {
            this.acks[id] = ack;
            return;
          }
          const timer = this.io.setTimeoutFn(() => {
            delete this.acks[id];
            for (let i = 0; i < this.sendBuffer.length; i++) {
              if (this.sendBuffer[i].id === id) {
                debug("removing packet with ack id %d from the buffer", id);
                this.sendBuffer.splice(i, 1);
              }
            }
            debug("event with ack id %d has timed out after %d ms", id, timeout);
            ack.call(this, new Error("operation has timed out"));
          }, timeout);
          this.acks[id] = (...args) => {
            this.io.clearTimeoutFn(timer);
            ack.apply(this, [null, ...args]);
          };
        }
        /**
         * Sends a packet.
         *
         * @param packet
         * @private
         */
        packet(packet) {
          packet.nsp = this.nsp;
          this.io._packet(packet);
        }
        /**
         * Called upon engine `open`.
         *
         * @private
         */
        onopen() {
          debug("transport is open - connecting");
          if (typeof this.auth == "function") {
            this.auth((data) => {
              this.packet({ type: socket_io_parser_1.PacketType.CONNECT, data });
            });
          } else {
            this.packet({ type: socket_io_parser_1.PacketType.CONNECT, data: this.auth });
          }
        }
        /**
         * Called upon engine or manager `error`.
         *
         * @param err
         * @private
         */
        onerror(err) {
          if (!this.connected) {
            this.emitReserved("connect_error", err);
          }
        }
        /**
         * Called upon engine `close`.
         *
         * @param reason
         * @param description
         * @private
         */
        onclose(reason, description) {
          debug("close (%s)", reason);
          this.connected = false;
          delete this.id;
          this.emitReserved("disconnect", reason, description);
        }
        /**
         * Called with socket packet.
         *
         * @param packet
         * @private
         */
        onpacket(packet) {
          const sameNamespace = packet.nsp === this.nsp;
          if (!sameNamespace)
            return;
          switch (packet.type) {
            case socket_io_parser_1.PacketType.CONNECT:
              if (packet.data && packet.data.sid) {
                const id = packet.data.sid;
                this.onconnect(id);
              } else {
                this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
              }
              break;
            case socket_io_parser_1.PacketType.EVENT:
            case socket_io_parser_1.PacketType.BINARY_EVENT:
              this.onevent(packet);
              break;
            case socket_io_parser_1.PacketType.ACK:
            case socket_io_parser_1.PacketType.BINARY_ACK:
              this.onack(packet);
              break;
            case socket_io_parser_1.PacketType.DISCONNECT:
              this.ondisconnect();
              break;
            case socket_io_parser_1.PacketType.CONNECT_ERROR:
              this.destroy();
              const err = new Error(packet.data.message);
              err.data = packet.data.data;
              this.emitReserved("connect_error", err);
              break;
          }
        }
        /**
         * Called upon a server event.
         *
         * @param packet
         * @private
         */
        onevent(packet) {
          const args = packet.data || [];
          debug("emitting event %j", args);
          if (null != packet.id) {
            debug("attaching ack callback to event");
            args.push(this.ack(packet.id));
          }
          if (this.connected) {
            this.emitEvent(args);
          } else {
            this.receiveBuffer.push(Object.freeze(args));
          }
        }
        emitEvent(args) {
          if (this._anyListeners && this._anyListeners.length) {
            const listeners = this._anyListeners.slice();
            for (const listener of listeners) {
              listener.apply(this, args);
            }
          }
          super.emit.apply(this, args);
        }
        /**
         * Produces an ack callback to emit with an event.
         *
         * @private
         */
        ack(id) {
          const self2 = this;
          let sent = false;
          return function(...args) {
            if (sent)
              return;
            sent = true;
            debug("sending ack %j", args);
            self2.packet({
              type: socket_io_parser_1.PacketType.ACK,
              id,
              data: args
            });
          };
        }
        /**
         * Called upon a server acknowlegement.
         *
         * @param packet
         * @private
         */
        onack(packet) {
          const ack = this.acks[packet.id];
          if ("function" === typeof ack) {
            debug("calling ack %s with %j", packet.id, packet.data);
            ack.apply(this, packet.data);
            delete this.acks[packet.id];
          } else {
            debug("bad ack %s", packet.id);
          }
        }
        /**
         * Called upon server connect.
         *
         * @private
         */
        onconnect(id) {
          debug("socket connected with id %s", id);
          this.id = id;
          this.connected = true;
          this.emitBuffered();
          this.emitReserved("connect");
        }
        /**
         * Emit buffered events (received and emitted).
         *
         * @private
         */
        emitBuffered() {
          this.receiveBuffer.forEach((args) => this.emitEvent(args));
          this.receiveBuffer = [];
          this.sendBuffer.forEach((packet) => {
            this.notifyOutgoingListeners(packet);
            this.packet(packet);
          });
          this.sendBuffer = [];
        }
        /**
         * Called upon server disconnect.
         *
         * @private
         */
        ondisconnect() {
          debug("server disconnect (%s)", this.nsp);
          this.destroy();
          this.onclose("io server disconnect");
        }
        /**
         * Called upon forced client/server side disconnections,
         * this method ensures the manager stops tracking us and
         * that reconnections don't get triggered for this.
         *
         * @private
         */
        destroy() {
          if (this.subs) {
            this.subs.forEach((subDestroy) => subDestroy());
            this.subs = void 0;
          }
          this.io["_destroy"](this);
        }
        /**
         * Disconnects the socket manually. In that case, the socket will not try to reconnect.
         *
         * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
         *
         * @example
         * const socket = io();
         *
         * socket.on("disconnect", (reason) => {
         *   // console.log(reason); prints "io client disconnect"
         * });
         *
         * socket.disconnect();
         *
         * @return self
         */
        disconnect() {
          if (this.connected) {
            debug("performing disconnect (%s)", this.nsp);
            this.packet({ type: socket_io_parser_1.PacketType.DISCONNECT });
          }
          this.destroy();
          if (this.connected) {
            this.onclose("io client disconnect");
          }
          return this;
        }
        /**
         * Alias for {@link disconnect()}.
         *
         * @return self
         */
        close() {
          return this.disconnect();
        }
        /**
         * Sets the compress flag.
         *
         * @example
         * socket.compress(false).emit("hello");
         *
         * @param compress - if `true`, compresses the sending data
         * @return self
         */
        compress(compress) {
          this.flags.compress = compress;
          return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
         * ready to send messages.
         *
         * @example
         * socket.volatile.emit("hello"); // the server may or may not receive it
         *
         * @returns self
         */
        get volatile() {
          this.flags.volatile = true;
          return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
         * given number of milliseconds have elapsed without an acknowledgement from the server:
         *
         * @example
         * socket.timeout(5000).emit("my-event", (err) => {
         *   if (err) {
         *     // the server did not acknowledge the event in the given delay
         *   }
         * });
         *
         * @returns self
         */
        timeout(timeout) {
          this.flags.timeout = timeout;
          return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * @example
         * socket.onAny((event, ...args) => {
         *   console.log(`got ${event}`);
         * });
         *
         * @param listener
         */
        onAny(listener) {
          this._anyListeners = this._anyListeners || [];
          this._anyListeners.push(listener);
          return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * @example
         * socket.prependAny((event, ...args) => {
         *   console.log(`got event ${event}`);
         * });
         *
         * @param listener
         */
        prependAny(listener) {
          this._anyListeners = this._anyListeners || [];
          this._anyListeners.unshift(listener);
          return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @example
         * const catchAllListener = (event, ...args) => {
         *   console.log(`got event ${event}`);
         * }
         *
         * socket.onAny(catchAllListener);
         *
         * // remove a specific listener
         * socket.offAny(catchAllListener);
         *
         * // or remove all listeners
         * socket.offAny();
         *
         * @param listener
         */
        offAny(listener) {
          if (!this._anyListeners) {
            return this;
          }
          if (listener) {
            const listeners = this._anyListeners;
            for (let i = 0; i < listeners.length; i++) {
              if (listener === listeners[i]) {
                listeners.splice(i, 1);
                return this;
              }
            }
          } else {
            this._anyListeners = [];
          }
          return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         */
        listenersAny() {
          return this._anyListeners || [];
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * Note: acknowledgements sent to the server are not included.
         *
         * @example
         * socket.onAnyOutgoing((event, ...args) => {
         *   console.log(`sent event ${event}`);
         * });
         *
         * @param listener
         */
        onAnyOutgoing(listener) {
          this._anyOutgoingListeners = this._anyOutgoingListeners || [];
          this._anyOutgoingListeners.push(listener);
          return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * Note: acknowledgements sent to the server are not included.
         *
         * @example
         * socket.prependAnyOutgoing((event, ...args) => {
         *   console.log(`sent event ${event}`);
         * });
         *
         * @param listener
         */
        prependAnyOutgoing(listener) {
          this._anyOutgoingListeners = this._anyOutgoingListeners || [];
          this._anyOutgoingListeners.unshift(listener);
          return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @example
         * const catchAllListener = (event, ...args) => {
         *   console.log(`sent event ${event}`);
         * }
         *
         * socket.onAnyOutgoing(catchAllListener);
         *
         * // remove a specific listener
         * socket.offAnyOutgoing(catchAllListener);
         *
         * // or remove all listeners
         * socket.offAnyOutgoing();
         *
         * @param [listener] - the catch-all listener (optional)
         */
        offAnyOutgoing(listener) {
          if (!this._anyOutgoingListeners) {
            return this;
          }
          if (listener) {
            const listeners = this._anyOutgoingListeners;
            for (let i = 0; i < listeners.length; i++) {
              if (listener === listeners[i]) {
                listeners.splice(i, 1);
                return this;
              }
            }
          } else {
            this._anyOutgoingListeners = [];
          }
          return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         */
        listenersAnyOutgoing() {
          return this._anyOutgoingListeners || [];
        }
        /**
         * Notify the listeners for each packet sent
         *
         * @param packet
         *
         * @private
         */
        notifyOutgoingListeners(packet) {
          if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
            const listeners = this._anyOutgoingListeners.slice();
            for (const listener of listeners) {
              listener.apply(this, packet.data);
            }
          }
        }
      };
      exports.Socket = Socket;
    }
  });

  // node_modules/socket.io-client/build/cjs/contrib/backo2.js
  var require_backo2 = __commonJS({
    "node_modules/socket.io-client/build/cjs/contrib/backo2.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Backoff = void 0;
      function Backoff(opts) {
        opts = opts || {};
        this.ms = opts.min || 100;
        this.max = opts.max || 1e4;
        this.factor = opts.factor || 2;
        this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
        this.attempts = 0;
      }
      exports.Backoff = Backoff;
      Backoff.prototype.duration = function() {
        var ms = this.ms * Math.pow(this.factor, this.attempts++);
        if (this.jitter) {
          var rand = Math.random();
          var deviation = Math.floor(rand * this.jitter * ms);
          ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
        }
        return Math.min(ms, this.max) | 0;
      };
      Backoff.prototype.reset = function() {
        this.attempts = 0;
      };
      Backoff.prototype.setMin = function(min) {
        this.ms = min;
      };
      Backoff.prototype.setMax = function(max) {
        this.max = max;
      };
      Backoff.prototype.setJitter = function(jitter) {
        this.jitter = jitter;
      };
    }
  });

  // node_modules/socket.io-client/build/cjs/manager.js
  var require_manager = __commonJS({
    "node_modules/socket.io-client/build/cjs/manager.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function() {
          return m[k];
        } });
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }) : function(o, v) {
        o["default"] = v;
      });
      var __importStar = exports && exports.__importStar || function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        }
        __setModuleDefault(result, mod);
        return result;
      };
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Manager = void 0;
      var engine_io_client_1 = require_cjs2();
      var socket_js_1 = require_socket2();
      var parser = __importStar(require_cjs3());
      var on_js_1 = require_on();
      var backo2_js_1 = require_backo2();
      var component_emitter_1 = require_component_emitter();
      var debug_1 = __importDefault(require_browser2());
      var debug = debug_1.default("socket.io-client:manager");
      var Manager = class extends component_emitter_1.Emitter {
        constructor(uri, opts) {
          var _a;
          super();
          this.nsps = {};
          this.subs = [];
          if (uri && "object" === typeof uri) {
            opts = uri;
            uri = void 0;
          }
          opts = opts || {};
          opts.path = opts.path || "/socket.io";
          this.opts = opts;
          engine_io_client_1.installTimerFunctions(this, opts);
          this.reconnection(opts.reconnection !== false);
          this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
          this.reconnectionDelay(opts.reconnectionDelay || 1e3);
          this.reconnectionDelayMax(opts.reconnectionDelayMax || 5e3);
          this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
          this.backoff = new backo2_js_1.Backoff({
            min: this.reconnectionDelay(),
            max: this.reconnectionDelayMax(),
            jitter: this.randomizationFactor()
          });
          this.timeout(null == opts.timeout ? 2e4 : opts.timeout);
          this._readyState = "closed";
          this.uri = uri;
          const _parser = opts.parser || parser;
          this.encoder = new _parser.Encoder();
          this.decoder = new _parser.Decoder();
          this._autoConnect = opts.autoConnect !== false;
          if (this._autoConnect)
            this.open();
        }
        reconnection(v) {
          if (!arguments.length)
            return this._reconnection;
          this._reconnection = !!v;
          return this;
        }
        reconnectionAttempts(v) {
          if (v === void 0)
            return this._reconnectionAttempts;
          this._reconnectionAttempts = v;
          return this;
        }
        reconnectionDelay(v) {
          var _a;
          if (v === void 0)
            return this._reconnectionDelay;
          this._reconnectionDelay = v;
          (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
          return this;
        }
        randomizationFactor(v) {
          var _a;
          if (v === void 0)
            return this._randomizationFactor;
          this._randomizationFactor = v;
          (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
          return this;
        }
        reconnectionDelayMax(v) {
          var _a;
          if (v === void 0)
            return this._reconnectionDelayMax;
          this._reconnectionDelayMax = v;
          (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
          return this;
        }
        timeout(v) {
          if (!arguments.length)
            return this._timeout;
          this._timeout = v;
          return this;
        }
        /**
         * Starts trying to reconnect if reconnection is enabled and we have not
         * started reconnecting yet
         *
         * @private
         */
        maybeReconnectOnOpen() {
          if (!this._reconnecting && this._reconnection && this.backoff.attempts === 0) {
            this.reconnect();
          }
        }
        /**
         * Sets the current transport `socket`.
         *
         * @param {Function} fn - optional, callback
         * @return self
         * @public
         */
        open(fn) {
          debug("readyState %s", this._readyState);
          if (~this._readyState.indexOf("open"))
            return this;
          debug("opening %s", this.uri);
          this.engine = new engine_io_client_1.Socket(this.uri, this.opts);
          const socket2 = this.engine;
          const self2 = this;
          this._readyState = "opening";
          this.skipReconnect = false;
          const openSubDestroy = on_js_1.on(socket2, "open", function() {
            self2.onopen();
            fn && fn();
          });
          const errorSub = on_js_1.on(socket2, "error", (err) => {
            debug("error");
            self2.cleanup();
            self2._readyState = "closed";
            this.emitReserved("error", err);
            if (fn) {
              fn(err);
            } else {
              self2.maybeReconnectOnOpen();
            }
          });
          if (false !== this._timeout) {
            const timeout = this._timeout;
            debug("connect attempt will timeout after %d", timeout);
            if (timeout === 0) {
              openSubDestroy();
            }
            const timer = this.setTimeoutFn(() => {
              debug("connect attempt timed out after %d", timeout);
              openSubDestroy();
              socket2.close();
              socket2.emit("error", new Error("timeout"));
            }, timeout);
            if (this.opts.autoUnref) {
              timer.unref();
            }
            this.subs.push(function subDestroy() {
              clearTimeout(timer);
            });
          }
          this.subs.push(openSubDestroy);
          this.subs.push(errorSub);
          return this;
        }
        /**
         * Alias for open()
         *
         * @return self
         * @public
         */
        connect(fn) {
          return this.open(fn);
        }
        /**
         * Called upon transport open.
         *
         * @private
         */
        onopen() {
          debug("open");
          this.cleanup();
          this._readyState = "open";
          this.emitReserved("open");
          const socket2 = this.engine;
          this.subs.push(on_js_1.on(socket2, "ping", this.onping.bind(this)), on_js_1.on(socket2, "data", this.ondata.bind(this)), on_js_1.on(socket2, "error", this.onerror.bind(this)), on_js_1.on(socket2, "close", this.onclose.bind(this)), on_js_1.on(this.decoder, "decoded", this.ondecoded.bind(this)));
        }
        /**
         * Called upon a ping.
         *
         * @private
         */
        onping() {
          this.emitReserved("ping");
        }
        /**
         * Called with data.
         *
         * @private
         */
        ondata(data) {
          try {
            this.decoder.add(data);
          } catch (e) {
            this.onclose("parse error", e);
          }
        }
        /**
         * Called when parser fully decodes a packet.
         *
         * @private
         */
        ondecoded(packet) {
          engine_io_client_1.nextTick(() => {
            this.emitReserved("packet", packet);
          }, this.setTimeoutFn);
        }
        /**
         * Called upon socket error.
         *
         * @private
         */
        onerror(err) {
          debug("error", err);
          this.emitReserved("error", err);
        }
        /**
         * Creates a new socket for the given `nsp`.
         *
         * @return {Socket}
         * @public
         */
        socket(nsp, opts) {
          let socket2 = this.nsps[nsp];
          if (!socket2) {
            socket2 = new socket_js_1.Socket(this, nsp, opts);
            this.nsps[nsp] = socket2;
          }
          return socket2;
        }
        /**
         * Called upon a socket close.
         *
         * @param socket
         * @private
         */
        _destroy(socket2) {
          const nsps = Object.keys(this.nsps);
          for (const nsp of nsps) {
            const socket3 = this.nsps[nsp];
            if (socket3.active) {
              debug("socket %s is still active, skipping close", nsp);
              return;
            }
          }
          this._close();
        }
        /**
         * Writes a packet.
         *
         * @param packet
         * @private
         */
        _packet(packet) {
          debug("writing packet %j", packet);
          const encodedPackets = this.encoder.encode(packet);
          for (let i = 0; i < encodedPackets.length; i++) {
            this.engine.write(encodedPackets[i], packet.options);
          }
        }
        /**
         * Clean up transport subscriptions and packet buffer.
         *
         * @private
         */
        cleanup() {
          debug("cleanup");
          this.subs.forEach((subDestroy) => subDestroy());
          this.subs.length = 0;
          this.decoder.destroy();
        }
        /**
         * Close the current socket.
         *
         * @private
         */
        _close() {
          debug("disconnect");
          this.skipReconnect = true;
          this._reconnecting = false;
          this.onclose("forced close");
          if (this.engine)
            this.engine.close();
        }
        /**
         * Alias for close()
         *
         * @private
         */
        disconnect() {
          return this._close();
        }
        /**
         * Called upon engine close.
         *
         * @private
         */
        onclose(reason, description) {
          debug("closed due to %s", reason);
          this.cleanup();
          this.backoff.reset();
          this._readyState = "closed";
          this.emitReserved("close", reason, description);
          if (this._reconnection && !this.skipReconnect) {
            this.reconnect();
          }
        }
        /**
         * Attempt a reconnection.
         *
         * @private
         */
        reconnect() {
          if (this._reconnecting || this.skipReconnect)
            return this;
          const self2 = this;
          if (this.backoff.attempts >= this._reconnectionAttempts) {
            debug("reconnect failed");
            this.backoff.reset();
            this.emitReserved("reconnect_failed");
            this._reconnecting = false;
          } else {
            const delay = this.backoff.duration();
            debug("will wait %dms before reconnect attempt", delay);
            this._reconnecting = true;
            const timer = this.setTimeoutFn(() => {
              if (self2.skipReconnect)
                return;
              debug("attempting reconnect");
              this.emitReserved("reconnect_attempt", self2.backoff.attempts);
              if (self2.skipReconnect)
                return;
              self2.open((err) => {
                if (err) {
                  debug("reconnect attempt error");
                  self2._reconnecting = false;
                  self2.reconnect();
                  this.emitReserved("reconnect_error", err);
                } else {
                  debug("reconnect success");
                  self2.onreconnect();
                }
              });
            }, delay);
            if (this.opts.autoUnref) {
              timer.unref();
            }
            this.subs.push(function subDestroy() {
              clearTimeout(timer);
            });
          }
        }
        /**
         * Called upon successful reconnect.
         *
         * @private
         */
        onreconnect() {
          const attempt = this.backoff.attempts;
          this._reconnecting = false;
          this.backoff.reset();
          this.emitReserved("reconnect", attempt);
        }
      };
      exports.Manager = Manager;
    }
  });

  // node_modules/socket.io-client/build/cjs/index.js
  var require_cjs4 = __commonJS({
    "node_modules/socket.io-client/build/cjs/index.js"(exports, module) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = exports.connect = exports.io = exports.Socket = exports.Manager = exports.protocol = void 0;
      var url_js_1 = require_url();
      var manager_js_1 = require_manager();
      Object.defineProperty(exports, "Manager", { enumerable: true, get: function() {
        return manager_js_1.Manager;
      } });
      var socket_js_1 = require_socket2();
      Object.defineProperty(exports, "Socket", { enumerable: true, get: function() {
        return socket_js_1.Socket;
      } });
      var debug_1 = __importDefault(require_browser2());
      var debug = debug_1.default("socket.io-client");
      var cache = {};
      function lookup(uri, opts) {
        if (typeof uri === "object") {
          opts = uri;
          uri = void 0;
        }
        opts = opts || {};
        const parsed = url_js_1.url(uri, opts.path || "/socket.io");
        const source = parsed.source;
        const id = parsed.id;
        const path = parsed.path;
        const sameNamespace = cache[id] && path in cache[id]["nsps"];
        const newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
        let io2;
        if (newConnection) {
          debug("ignoring socket cache for %s", source);
          io2 = new manager_js_1.Manager(source, opts);
        } else {
          if (!cache[id]) {
            debug("new io instance for %s", source);
            cache[id] = new manager_js_1.Manager(source, opts);
          }
          io2 = cache[id];
        }
        if (parsed.query && !opts.query) {
          opts.query = parsed.queryKey;
        }
        return io2.socket(parsed.path, opts);
      }
      exports.io = lookup;
      exports.connect = lookup;
      exports.default = lookup;
      Object.assign(lookup, {
        Manager: manager_js_1.Manager,
        Socket: socket_js_1.Socket,
        io: lookup,
        connect: lookup
      });
      var socket_io_parser_1 = require_cjs3();
      Object.defineProperty(exports, "protocol", { enumerable: true, get: function() {
        return socket_io_parser_1.protocol;
      } });
      module.exports = lookup;
    }
  });

  // public_alt/index.js
  var io = require_cjs4();
  function createLoadingModal() {
    let loadingModal = `<div class="modal fade loadingModal"  tabindex="-1" role="dialog" aria-labelledby="loadingModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document" >
      <div class="modal-content" style="background-color: #a0aab1;">
        <div class="modal-body">
          <div class="spinner-border" role="status" >
            <span class="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
    $("body").append(loadingModal);
    $(".loadingModal").modal({
      backdrop: "static",
      // Prevent dismissing the modal by clicking outside or pressing the Esc key
      keyboard: false
      // Disable keyboard events
    });
  }
  function hideLoadingModal() {
    $(".loadingModal").modal("hide");
    $(".modal-backdrop").remove();
    $(".loadingModal").remove();
    $("body").removeClass("modal-open");
  }
  createLoadingModal();
  var socket;
  socket = io("/media", { transports: ["websocket"] });
  var socket_ = socket;
  var apiKey = null;
  var apiUserName = null;
  var apiType = "test";
  var maxMeetingDuration = 2;
  var showRecording = false;
  var altSocketType = "test";
  var userName;
  var codeVisible = false;
  var existingNames = [];
  var existingBans = [];
  var newMeeting = false;
  var adminStarted = false;
  var waitingForAdmin = false;
  var disableJoin = false;
  var deferAlertForCapacity = false;
  var secureCode;
  var nameOfAdmin;
  var passWord;
  var urll;
  var userSecret;
  var pender;
  var passCodeClicked = false;
  var meetIDClicked = false;
  var audioPreference = null;
  var videoPreference = null;
  var audioOutputPreference = null;
  var waitRoom;
  var waitedRoom;
  var recordRoom;
  var checkForAdmin = false;
  var refRoomCapacity = 2;
  var eventID;
  var hostName = window.location.hostname;
  var hostProtocol = window.location.protocol;
  var actType = "webinar";
  var allowRecording = false;
  var videoAlreadyOn = false;
  var localStreamVideo = null;
  var recordingParams = {
    recordingAudioPausesLimit: 0,
    recordingAudioSupport: false,
    // allowed to record audio
    recordingAudioPeopleLimit: 0,
    recordingAudioParticipantsTimeLimit: 0,
    // (defaulted to seconds so 60 for 1 minute)
    recordingVideoPausesLimit: 0,
    recordingVideoSupport: false,
    //allowed to record video
    recordingVideoPeopleLimit: 0,
    recordingVideoParticipantsTimeLimit: 0,
    // (defaulted to seconds so 60 for 1 minute)
    recordingAllParticipantsSupport: false,
    //others other than host included (with media)
    recordingVideoParticipantsSupport: false,
    //video participants/participant (screensharer) in the room will be recorded
    recordingAllParticipantsFullRoomSupport: false,
    //all participants in the room will be recorded (with media or not)
    recordingVideoParticipantsFullRoomSupport: false,
    //all video participants in the room will be recorded
    recordingPreferredOrientation: "landscape",
    recordingSupportForOtherOrientation: false,
    recordingMultiFormatsSupport: false,
    //multiple formats support
    recordingHLSSupport: true
    //hls support
  };
  var refRecordingParams = {
    recordingAudioPausesLimit: 0,
    recordingAudioSupport: false,
    // allowed to record audio
    recordingAudioPeopleLimit: 0,
    recordingAudioParticipantsTimeLimit: 0,
    // (defaulted to seconds so 60 for 1 minute)
    recordingVideoPausesLimit: 0,
    recordingVideoSupport: false,
    //allowed to record video
    recordingVideoPeopleLimit: 0,
    recordingVideoParticipantsTimeLimit: 0,
    // (defaulted to seconds so 60 for 1 minute)
    recordingAllParticipantsSupport: false,
    //others other than host included (with media)
    recordingVideoParticipantsSupport: false,
    //video participants/participant (screensharer) in the room will be recorded
    recordingAllParticipantsFullRoomSupport: false,
    //all participants in the room will be recorded (with media or not)
    recordingVideoParticipantsFullRoomSupport: false,
    //all video participants in the room will be recorded
    recordingPreferredOrientation: "landscape",
    recordingSupportForOtherOrientation: false,
    recordingMultiFormatsSupport: false,
    //multiple formats support
    recordingHLSSupport: true
    //hls support
  };
  var meetingParams = {
    itemPageLimit: 4,
    mediaType: "video",
    //video,audio
    addCoHost: true,
    targetOrientation: "neutral",
    //landscape or neutral, portrait
    targetOrientationHost: "neutral",
    //landscape or neutral, portrait
    targetResolution: "sd",
    //hd,sd,QnHD
    targetResolutionHost: "sd",
    //hd,sd,QnHD
    type: `conference`,
    //'broadcast',//webinar,conference,broadcast,chat
    audioSetting: "allow",
    //approval,disallow,allow
    videoSetting: "allow",
    //approval,disallow,allow
    screenshareSetting: "allow",
    //approval,disallow,allow
    chatSetting: "allow"
    //disallow,allow
  };
  var refMeetingParams = {
    itemPageLimit: 4,
    mediaType: "video",
    //video,audio
    addCoHost: true,
    targetOrientation: "neutral",
    //landscape or neutral, portrait
    targetOrientationHost: "neutral",
    //landscape or neutral, portrait
    targetResolution: "sd",
    //hd,sd,QnHD
    targetResolutionHost: "sd",
    //hd,sd,QnHD
    type: `conference`,
    //'broadcast',//webinar,conference,broadcast,chat
    audioSetting: "allow",
    //approval,disallow,allow
    videoSetting: "allow",
    //approval,disallow,allow
    screenshareSetting: "allow",
    //approval,disallow,allow
    chatSetting: "allow"
    //disallow,allow
  };
  var event = window.location.pathname.split("/")[2];
  var eventIDInputField = document.getElementById("eventIDInput");
  if (event && event != "start") {
    eventIDInputField.value = event;
  }
  socket.on("connection-success", async (data) => {
    socketId = data.socketId;
    apiType_ = data.mode;
    apiUserName = data.apiUserName;
    apiKey = data.apiKey;
    allowRecording = data.allowRecord;
    await checkAndSetAPI(data.meetingRoomParams_, data.recordingParams_);
    await streamSuccessNull();
  });
  async function previewMedia() {
    try {
      const savedVideoDevice = getCookie("videoDevice");
      const savedAudioDevice = getCookie("audioDevice");
      const useBackground = getCookie("useBackground");
      const backgroundSrc = getCookie("backgroundSrc");
      await navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter(
          (device) => device.kind === "videoinput"
        );
        const audioInputs = devices.filter(
          (device) => device.kind === "audioinput"
        );
        const audioOutputs = devices.filter(
          (device) => device.kind === "audiooutput"
        );
        const videoDropdown = $("#cameraList");
        const audioInputDropdown = $("#microphoneList");
        const audioOutputDropdown = $("#audioOutputList");
        videoInputs.forEach((input) => {
          const option = $("<option></option>").attr("value", input.deviceId).text(input.label);
          videoDropdown.append(option);
          videoDropdown.trigger("change");
        });
        audioInputs.forEach((input) => {
          const option = $("<option></option>").attr("value", input.deviceId).text(input.label);
          audioInputDropdown.append(option);
          audioInputDropdown.trigger("change");
        });
        audioOutputs.forEach((output) => {
          const option = $("<option></option>").attr("value", output.deviceId).text(output.label);
          audioOutputDropdown.append(option);
          audioOutputDropdown.trigger("change");
        });
        if (savedVideoDevice) {
          const videoDevice = videoInputs.find(
            (device) => device.deviceId === savedVideoDevice
          );
          if (videoDevice) {
            videoDropdown.val(savedVideoDevice);
          }
        }
        if (savedAudioDevice) {
          const audioDevice = audioInputs.find(
            (device) => device.deviceId === savedAudioDevice
          );
          if (audioDevice) {
            audioInputDropdown.val(savedAudioDevice);
          }
        }
        audioOutputDropdown.css("max-width", "100%");
        audioInputDropdown.css("max-width", "100%");
        videoDropdown.css("max-width", "100%");
      }).catch((error) => {
      });
    } catch (error) {
    }
    document.removeEventListener("click", previewMedia);
  }
  document.addEventListener("click", previewMedia);
  async function closeStream() {
    try {
      if (localStreamVideo) {
        localStreamVideo.getTracks().forEach((track) => track.stop());
      }
      videoAlreadyOn = false;
      localStreamVideo = null;
      const videoElement = document.getElementById("videoOutputPreview");
      videoElement.srcObject = null;
      const audioElement = document.getElementById("audioOutputPreview");
      audioElement.srcObject = null;
    } catch (error) {
      console.log(error, "error closing stream");
    }
  }
  async function streamSuccessNull() {
    try {
      const useBackground = getCookie("useBackground");
      const backgroundSrc = getCookie("backgroundSrc");
      const videoDropdown = $("#cameraList");
      const audioInputDropdown = $("#microphoneList");
      const audioOutputDropdown = $("#audioOutputList");
      $("#videoOutputPreview").css("max-width", "500px");
      $("#audioOutputPreview").css("max-width", "auto");
      await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: videoDropdown.val(),
          width: { ideal: 960 },
          height: { ideal: 960 }
        },
        audio: { deviceId: audioInputDropdown.val() }
      }).then((stream) => {
        const videoElement = document.getElementById("videoOutputPreview");
        const audioElement = document.getElementById("audioOutputPreview");
        videoElement.srcObject = stream;
        audioElement.srcObject = stream;
        localStreamVideo = stream;
        videoAlreadyOn = true;
      }).catch((error) => {
        videoAlreadyOn = false;
        console.log(error);
      });
      videoDropdown.on("change", async () => {
        videoPreference = await videoDropdown.val();
        await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: videoDropdown.val(),
            width: { ideal: 960 },
            height: { ideal: 960 }
          },
          audio: { deviceId: audioInputDropdown.val() }
        }).then((stream) => {
          const videoElement = document.getElementById("videoOutputPreview");
          videoElement.srcObject = stream;
          setCookie("videoDevice", videoDropdown.val(), 365);
          videoAlreadyOn = true;
          localStreamVideo = stream;
          try {
            const facingMode = stream.getVideoTracks()[0].getSettings().facingMode;
            setCookie("facingMode", facingMode, 365);
          } catch (error) {
          }
        }).catch((error) => {
          videoAlreadyOn = false;
          console.log(error);
        });
      });
      audioInputDropdown.on("change", async () => {
        audioPreference = await audioInputDropdown.val();
        await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: videoDropdown.val(),
            width: { ideal: 960 },
            height: { ideal: 960 }
          },
          audio: { deviceId: audioInputDropdown.val() }
        }).then((stream) => {
          const audioElement = document.getElementById("audioOutputPreview");
          audioElement.srcObject = stream;
          setCookie("audioDevice", audioInputDropdown.val(), 365);
          try {
            const facingMode = stream.getVideoTracks()[0].getSettings().facingMode;
            setCookie("facingMode", facingMode, 365);
          } catch (error) {
          }
        }).catch((error) => {
          console.log(error);
        });
      });
      audioOutputDropdown.on("change", async () => {
        audioOutputPreference = await audioOutputDropdown.val();
        const audioElement = document.getElementById("audioOutputPreview");
        const selectedDeviceId = audioOutputDropdown.val();
        if (selectedDeviceId === "") {
          audioElement.pause();
          audioElement.srcObject = null;
        } else {
          await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: audioOutputDropdown.val() }
          }).then((stream) => {
            audioElement.srcObject = stream;
            audioElement.play();
            setCookie("audioOutputDevice", audioOutputDropdown.val(), 365);
          }).catch((error) => {
            console.log(error);
          });
        }
      });
    } catch (error) {
    }
    const eventIDInputField2 = await document.getElementById("eventIDInput");
    if (event && event != "start") {
      eventIDInputField2.value = event;
    }
    hideLoadingModal();
    await showAlert(
      "Join an existing meeting by entering the ID, clicking confirm, then proceeding to enter your name and click join.",
      "success",
      6e6
    );
    function updateDateTime() {
      let currentTime = moment();
      let setDateTime = $("#datetimePicker").datetimepicker("date");
      let maxDateTime = moment().add(3, "months");
      if (currentTime.isAfter(setDateTime)) {
        $("#datetimePicker").datetimepicker("date", currentTime);
      }
      if (setDateTime.isAfter(maxDateTime)) {
        showAlert(
          "An Event cannot be scheduled more than 3 months from now.",
          "danger"
        );
        $("#datetimePicker").datetimepicker("date", maxDateTime);
      }
    }
    setInterval(updateDateTime, 1e3);
    $("#datetimePicker").datetimepicker({
      format: "MMMM Do YYYY, h:mm a",
      defaultDate: moment()
    });
  }
  function showAlert(message, state, duration = 4e3) {
    $("#alertMessage").text(message);
    if (state === "success") {
      $("#alertModal").find(".modal-body .alert").removeClass("alert-danger").addClass("alert-success");
    } else {
      $("#alertModal").find(".modal-body .alert").removeClass("alert-success").addClass("alert-danger");
    }
    $("#alertModal").modal("show");
    setTimeout(function() {
      $("#alertModal").modal("hide");
    }, duration);
  }
  var toggleBtn = document.getElementById("toggleButton");
  toggleBtn.addEventListener("click", () => {
    $("#startMeetingModal").modal("show");
    showAlert(
      "To start an event, enter the room capacity, your name, and date. Then click start event; the event will only start after you click the copy field to get the Passcode then the ID.",
      "success",
      1e4
    );
    try {
      $(".detailed").each(function() {
        $(this).hide();
      });
    } catch (error) {
    }
  });
  function generateIncrements(maxValue) {
    const increments = [0.25];
    let currentValue = 0.25;
    while (currentValue < maxValue) {
      if (currentValue < 3) {
        currentValue += 0.25;
      } else if (currentValue < 6) {
        currentValue += 0.5;
      } else if (currentValue < 12) {
        currentValue += 1;
      } else if (currentValue < 24) {
        currentValue += 3;
      }
      if (currentValue <= maxValue) {
        increments.push(currentValue);
      }
    }
    return increments;
  }
  function populateDuration() {
    const increments = generateIncrements(maxMeetingDuration);
    const durationSelect = document.getElementById("durationSelect");
    durationSelect.innerHTML = "";
    for (let i = 0; i < increments.length; i++) {
      const option = document.createElement("option");
      const hours = increments[i];
      const label = `${hours} hrs`;
      option.value = hours * 60;
      option.textContent = label;
      durationSelect.appendChild(option);
    }
  }
  populateDuration();
  var eventIDInput = document.getElementById("eventIDInputModal");
  var eventIDCopyBtn = document.getElementById("eventIDCopyBtn");
  var PassIDInput = document.getElementById("PassIDInputModal");
  var PassIDCopyBtn = document.getElementById("PassIDCopyBtn");
  function generateEventID() {
    const now = /* @__PURE__ */ new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();
    const ms = now.getMilliseconds();
    const randomDigits = Math.floor(10 + Math.random() * 99);
    eventID = (/* @__PURE__ */ new Date()).getTime().toString(30) + (/* @__PURE__ */ new Date()).getUTCMilliseconds() + randomDigits.toString();
    eventID = "m" + eventID;
    secureCode = Math.random().toString(30).substring(2, 14) + Math.random().toString(30).substring(2, 14);
    eventIDInput.value = eventID;
    PassIDInput.value = secureCode;
  }
  var cancelMeetingBtn = document.getElementById("cancelMeetingBtn");
  cancelMeetingBtn.addEventListener("click", () => {
    newMeeting = false;
  });
  var userNameInputAlt = document.getElementById("userNameInputMain");
  userNameInputAlt.addEventListener("input", function() {
    let modifiedValue = this.value.replace(/[^\w\s]/g, "").replace(/\s/g, "");
    let firstChar = modifiedValue.charAt(0);
    let alphabeticValue = /^[A-Za-z]/.test(firstChar) ? modifiedValue : "";
    this.value = alphabeticValue;
  });
  var userNameInput = document.getElementById("userNameInputModal");
  userNameInput.addEventListener("input", function() {
    let modifiedValue = this.value.replace(/[^\w\s]/g, "").replace(/\s/g, "");
    let firstChar = modifiedValue.charAt(0);
    let alphabeticValue = /^[A-Za-z]/.test(firstChar) ? modifiedValue : "";
    this.value = alphabeticValue;
  });
  function hideQRCode(id = "qrcode", id1 = "start-guide") {
    let qrCodeElement = document.getElementById(id);
    if (qrCodeElement) {
      qrCodeElement.style.display = "none";
      codeVisible = false;
    }
    let guideElement = document.getElementById(id1);
    if (guideElement) {
      guideElement.style.display = "none";
    }
    if (id1 == "start-guide") {
      let guideElementAlt = document.getElementById("start-guide-ins");
      if (guideElementAlt) {
        guideElementAlt.style.display = "none";
        guideElementAlt.style.maxWidth = "260px";
      }
    }
  }
  var startMeetingBtn = document.getElementById("startMeetingBtn");
  startMeetingBtn.addEventListener("click", () => {
    const durationSelect = document.getElementById("durationSelect");
    const capacityInput = document.getElementById("capacityInput");
    const capacity = parseInt(inputCapacity.value, 10);
    let warningMessage2 = document.getElementById("copyMessageFailed");
    let warningMessageAlt = document.getElementById("copyMessageFailedAlt");
    if (capacity < 2 || capacity > refRoomCapacity) {
      inputCapacity.setCustomValidity(
        `Room capacity must be between 2 and ${refRoomCapacity}.`
      );
      warningMessage2.textContent = `Room capacity must be between 2 and ${refRoomCapacity}.`;
      warningMessageAlt.textContent = `Room capacity must be between 2 and ${refRoomCapacity}.`;
      inputCapacity.value = refRoomCapacity;
    } else {
      inputCapacity.setCustomValidity("");
      warningMessage2.textContent = "";
      warningMessageAlt.textContent = "";
    }
    capacityInput.max = refRoomCapacity;
    const userNameInput2 = document.getElementById("userNameInputModal");
    if (!durationSelect.value || !capacityInput.value || !userNameInput2 || !userNameInput2.value) {
      warningMessage2.textContent = "Fill in all fields.";
      warningMessageAlt.textContent = "Fill in all fields.";
      return;
    }
    if (capacityInput.value > refRoomCapacity) {
      warningMessage2.textContent = `Room capacity cannot be more than ${refRoomCapacity}.`;
      warningMessageAlt.textContent = `Room capacity cannot be more than ${refRoomCapacity}.`;
      return;
    }
    const userNam = userNameInput2.value.trim();
    if (userNam.length < 2) {
      warningMessage2.textContent = "Username must be at least 2 characters long.";
      warningMessageAlt.textContent = "Username must be at least 2 characters long.";
      return;
    }
    if (isReservedKeyword(userNam)) {
      warningMessage2.textContent = "Username cannot be a reserved keyword.";
      warningMessageAlt.textContent = "Username cannot be a reserved keyword.";
      return;
    }
    generateEventID();
    warningMessage2.textContent = "Click copy to get the Event ID and continue!";
    const warnedMessage = document.getElementById("copyPassMessageFailed");
    warnedMessage.textContent = "Click copy to get the Passcode!";
    startMeetingBtn.disabled = true;
    let selectedDateTime = $("#datetimePicker").datetimepicker("date");
    let scheduledDate = selectedDateTime.toDate();
    let currentTime = moment();
    if (selectedDateTime.isAfter(currentTime.add(5, "minutes"))) {
      hideQRCode();
      startMeetingBtn.textContent = "Scheduling...";
    } else {
      hideQRCode();
      startMeetingBtn.textContent = "Starting...";
    }
    $("#PassIDCopyBtn").trigger("click");
    $("#eventIDCopyBtn").trigger("click");
  });
  PassIDCopyBtn.addEventListener("click", async () => {
    if (PassIDInput.value) {
      PassIDInput.select();
      document.execCommand("copy");
      const warningMessage2 = document.getElementById("copyPassMessageFailed");
      warningMessage2.textContent = "Passcode copied to clipboard!";
      passCodeClicked = true;
    }
  });
  eventIDCopyBtn.addEventListener("click", async () => {
    if (eventIDInput.value) {
      if (codeVisible) {
        eventIDInput.select();
        document.execCommand("copy");
        const warningMessage3 = document.getElementById("copyMessageFailed");
        warningMessage3.textContent = "Event ID copied to clipboard!";
        return;
      }
      if (!passCodeClicked) {
        showAlert("Click the copy button to get the Passcode first!", "danger");
        return;
      }
      eventIDInput.select();
      document.execCommand("copy");
      const warningMessage2 = document.getElementById("copyMessageFailed");
      warningMessage2.textContent = "Event ID copied to clipboard!";
      meetIDClicked = true;
      const durationSelect = document.getElementById("durationSelect");
      const capacityInput = document.getElementById("capacityInput");
      const userNameInput2 = document.getElementById("userNameInputModal");
      let selectedDateTime = $("#datetimePicker").datetimepicker("date");
      let scheduledDate = selectedDateTime.toDate();
      let currentTime = moment();
      eventID = await eventIDInput.value;
      const duration = await durationSelect.value;
      let capacity = await capacityInput.value;
      if (capacity > refRoomCapacity) {
        showAlert(
          `Room capacity cannot be more than ${refRoomCapacity}.`,
          "danger"
        );
        capacity = refRoomCapacity;
      }
      userName = await userNameInput2.value;
      userName = userName.replace(/\s/g, "");
      const url = `/meeting/${eventID}/0`;
      if (showRecording && recordRoom) {
      } else {
        recordingParams.recordingAudioSupport = false;
        recordingParams.recordingVideoSupport = false;
      }
      await createLoadingModal();
      let mediasfuURL = "";
      if (showRecording && recordRoom) {
        const payload = {
          duration,
          capacity,
          userName,
          scheduledDate,
          secureCode,
          recordingParams,
          meetingRoomParams: meetingParams,
          recordOnly: true,
          action: "create"
        };
        const response = await createRoomOnMediaSFU(payload, apiUserName, apiKey);
        if (response.success && response.data.success) {
          eventID = response.data.roomName;
          mediasfuURL = response.data.publicURL;
        } else {
          recordingParams.recordingAudioSupport = false;
          recordingParams.recordingVideoSupport = false;
          recordingParams = null;
        }
      }
      await socket.emit(
        "createRoom",
        {
          eventID,
          duration,
          capacity,
          userName,
          scheduledDate,
          secureCode,
          waitRoom,
          recordingParams,
          eventRoomParams: meetingParams,
          videoPreference,
          audioPreference,
          audioOutputPreference,
          mediasfuURL
        },
        ({ success, secret, reason, url: url2 }) => {
          hideLoadingModal();
          urll = url2;
          userSecret = secret;
          if (success) {
            if (selectedDateTime.isAfter(currentTime.add(5, "minutes"))) {
              $("#startMeetingModal").modal("hide");
              let alertMessage = `Event scheduled. Passcode: ${secureCode}      ID: ${eventID}`;
              showAlert(alertMessage, "success", 6e3);
              const warningMessage3 = document.getElementById("warningMessage");
              warningMessage3.textContent = alertMessage;
            } else {
              $("#startMeetingModal").modal("hide");
              closeStream();
              window.location.href = urll;
            }
          } else {
            hideLoadingModal();
            const warningMessage3 = document.getElementById("copyMessageFailed");
            warningMessage3.textContent = "The Event could not be scheduled, retry!";
            showAlert("The Event could not be scheduled, retry!", "danger");
            return;
          }
        }
      );
    }
  });
  var inputCapacity = document.getElementById("capacityInput");
  inputCapacity.max = refRoomCapacity;
  inputCapacity.addEventListener("input", () => {
    const capacity = parseInt(inputCapacity.value, 10);
    const warningMessage2 = document.getElementById("copyMessageFailedAlt");
    if (capacity < 0 || capacity > refRoomCapacity) {
      inputCapacity.setCustomValidity(
        `Room capacity must be between 0 and ${refRoomCapacity}.`
      );
      warningMessage2.textContent = `Room capacity must be between 0 and ${refRoomCapacity}.`;
      inputCapacity.value = refRoomCapacity;
    } else {
      inputCapacity.setCustomValidity("");
      warningMessage2.textContent = "";
    }
  });
  var nameInput = document.getElementById("userNameInputMain");
  nameInput.addEventListener("keyup", checkUserNameValidity);
  async function createRoomOnMediaSFU(payload, apiUserName2, apiKey2) {
    try {
      const response = await fetch("/createRoom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiUserName2 + ":" + apiKey2
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      return { data: null, success: false };
    }
  }
  function isReservedKeyword(keyword) {
    const jsReservedKeywords = [
      "break",
      "case",
      "catch",
      "class",
      "const",
      "continue",
      "debugger",
      "default",
      "delete",
      "do",
      "else",
      "export",
      "extends",
      "finally",
      "for",
      "function",
      "if",
      "import",
      "in",
      "instanceof",
      "new",
      "return",
      "super",
      "switch",
      "this",
      "throw",
      "try",
      "typeof",
      "var",
      "void",
      "while",
      "with",
      "yield",
      "enum",
      "implements",
      "interface",
      "let",
      "package",
      "private",
      "protected",
      "public",
      "static",
      "await",
      "abstract",
      "boolean",
      "byte",
      "char",
      "double",
      "final",
      "float",
      "goto",
      "int",
      "long",
      "native",
      "short",
      "synchronized",
      "throws",
      "transient",
      "volatile",
      "true",
      "false",
      "null",
      "undefined",
      "NaN",
      "Infinity"
    ];
    const bashReservedKeywords = [
      "if",
      "then",
      "else",
      "elif",
      "fi",
      "case",
      "esac",
      "for",
      "while",
      "do",
      "done",
      "in",
      "function",
      "time",
      "return",
      "exit",
      "shift",
      "export",
      "readonly",
      "alias",
      "eval",
      "unset",
      "local",
      "declare",
      "typeset",
      "readonly",
      "trap",
      "wait",
      "until",
      "select",
      "continue",
      "break",
      "test",
      "[[",
      "]]",
      "source",
      "true",
      "false",
      "null"
    ];
    const allReservedKeywords = [...jsReservedKeywords, ...bashReservedKeywords];
    return allReservedKeywords.includes(keyword.toLowerCase());
  }
  function checkUserNameValidity() {
    const nameInput2 = document.getElementById("userNameInputMain");
    const nameWarn = document.getElementById("userNameWarn");
    const joinButton2 = document.getElementById("joinButton");
    const eventIDInput2 = document.getElementById("eventIDInput");
    if (nameInput2.value.length === 0 || nameInput2.readOnly) {
      nameWarn.innerText = "Enter an Event ID and click confirm first.";
      joinButton2.disabled = true;
      return;
    }
    if (nameInput2.value.length < 2 || nameInput2.value.length > 10) {
      nameWarn.innerText = "Name must be between 2 and 10 characters long.";
      joinButton2.disabled = true;
      return;
    }
    if (isReservedKeyword(nameInput2.value)) {
      nameWarn.innerText = "Name cannot be a reserved keyword.";
      joinButton2.disabled = true;
      return;
    }
    let named = nameInput2.value.replace(/[^\w\s]/gi, "").replace(/\s/g, "");
    if (existingBans.includes(named)) {
      nameWarn.innerText = "You are banned from this event.";
      joinButton2.disabled = true;
      return;
    }
    if (adminStarted) {
      if (named != nameOfAdmin) {
        nameWarn.innerText = "Host has not started the event yet.";
        joinButton2.disabled = true;
        return;
      }
    }
    if (existingNames.some(
      (existingName) => existingName.toLowerCase() === named.toLowerCase()
    )) {
      if (nameOfAdmin != named) {
        nameWarn.innerText = "Name is already taken.";
        joinButton2.disabled = true;
        return;
      } else {
        if (!pender) {
          nameWarn.innerText = "Name is already taken.";
          joinButton2.disabled = true;
          return;
        }
      }
    }
    nameWarn.innerText = "";
    joinButton2.disabled = false;
  }
  function addChangeListeners(fieldId, paramName, paramType) {
    document.getElementById(fieldId).addEventListener("change", function() {
      let refValue;
      let refMedia = refMeetingParams.mediaType;
      if (!refMedia) {
        refMedia = "video";
      }
      if (fieldId.includes("recording")) {
        refValue = refRecordingParams[paramName];
      } else {
        refValue = refMeetingParams[paramName];
      }
      let selectedValue = this.value;
      if (paramType === "boolean") {
        selectedValue = selectedValue === "true";
        if (selectedValue && !refValue) {
          this.value = "false";
          showAlert(`Enabling of this feature is not supported.`, "danger");
          selectedValue = false;
        }
      }
      if (paramType === "number") {
        selectedValue = parseInt(selectedValue, 10);
        if (isNaN(selectedValue)) {
          showAlert(`Please enter a valid number`);
          this.value = refValue.toString();
          return;
        }
        if (selectedValue > refValue) {
          showAlert(`This cannot be greater than ${refValue}.`);
          this.value = refValue.toString();
          selectedValue = refValue;
        }
      } else if (paramType === "string") {
        if (paramName === "mediaType") {
          if (selectedValue == "video" && refValue !== "video") {
            showAlert(`This cannot be changed to ${selectedValue}.`);
            this.value = refValue.toString();
            selectedValue = refValue;
          }
        }
        if ((paramName === "targetResolution" || paramName === "targetResolutionHost") && refMedia == "video") {
          if (selectedValue === "hd") {
            if (refValue != "hd") {
              showAlert(`This cannot be changed to ${selectedValue}.`);
              this.value = refValue.toString();
              selectedValue = refValue;
            }
          } else if (selectedValue === "sd") {
            if (refValue === "qnhd") {
              showAlert(`This cannot be changed to ${selectedValue}.`);
              this.value = refValue.toString();
              selectedValue = refValue;
            }
          }
        }
      }
      if (fieldId.includes("recording")) {
        recordingParams[paramName] = selectedValue;
      } else {
        meetingParams[paramName] = selectedValue;
      }
    });
  }
  function populateAdvancedSettings() {
    if (meetingParams.type == "broadcast") {
      recordingParams.recordingVideoPeopleLimit = 1;
      recordingParams.recordingAudioPeopleLimit = 1;
      meetingParams.itemPageLimit = 1;
    }
    if (actType != "chat") {
      document.getElementById("recordingAudioPausesLimit").value = recordingParams.recordingAudioPausesLimit;
      document.getElementById("recordingAudioSupport").value = recordingParams.recordingAudioSupport.toString();
      document.getElementById("recordingAudioPeopleLimit").value = recordingParams.recordingAudioPeopleLimit;
      document.getElementById("recordingAudioParticipantsTimeLimit").value = recordingParams.recordingAudioParticipantsTimeLimit;
      document.getElementById("recordingVideoPausesLimit").value = recordingParams.recordingVideoPausesLimit;
      document.getElementById("recordingVideoSupport").value = recordingParams.recordingVideoSupport.toString();
      document.getElementById("recordingVideoPeopleLimit").value = recordingParams.recordingVideoPeopleLimit;
      document.getElementById("recordingVideoParticipantsTimeLimit").value = recordingParams.recordingVideoParticipantsTimeLimit;
      document.getElementById("recordingAllParticipantsSupport").value = recordingParams.recordingAllParticipantsSupport.toString();
      document.getElementById("recordingVideoParticipantsSupport").value = recordingParams.recordingVideoParticipantsSupport.toString();
      document.getElementById("recordingAllParticipantsFullRoomSupport").value = recordingParams.recordingAllParticipantsFullRoomSupport.toString();
      document.getElementById("recordingVideoParticipantsFullRoomSupport").value = recordingParams.recordingVideoParticipantsFullRoomSupport.toString();
      document.getElementById("recordingPreferredOrientation").value = recordingParams.recordingPreferredOrientation;
      document.getElementById("recordingSupportForOtherOrientation").value = recordingParams.recordingSupportForOtherOrientation.toString();
      document.getElementById("recordingMultiFormatsSupport").value = recordingParams.recordingMultiFormatsSupport.toString();
      document.getElementById("recordingHLSSupport").value = recordingParams.recordingHLSSupport.toString();
    }
    document.getElementById("itemPageLimit").value = meetingParams.itemPageLimit;
    document.getElementById("mediaType").value = meetingParams.mediaType;
    document.getElementById("addCoHost").value = meetingParams.addCoHost.toString();
    document.getElementById("targetOrientation").value = meetingParams.targetOrientation;
    document.getElementById("targetOrientationHost").value = meetingParams.targetOrientationHost;
    document.getElementById("targetResolution").value = meetingParams.targetResolution;
    document.getElementById("targetResolutionHost").value = meetingParams.targetResolutionHost;
    document.getElementById("audioSetting").value = meetingParams.audioSetting;
    document.getElementById("videoSetting").value = meetingParams.videoSetting;
    document.getElementById("screenshareSetting").value = meetingParams.screenshareSetting;
    document.getElementById("chatSetting").value = meetingParams.chatSetting;
  }
  var advancedSettingsBtn = document.getElementById("advancedSettingsBtn");
  var recordingParamsPanel = document.getElementById("recordingParamsPanel");
  var meetingParamsPanel = document.getElementById("meetingParamsPanel");
  advancedSettingsBtn.addEventListener("click", () => {
    if (meetingParamsPanel.style.display === "none") {
      if (actType != "chat" && showRecording) {
        recordingParamsPanel.style.display = "block";
      }
      meetingParamsPanel.style.display = "block";
      advancedSettingsBtn.textContent = "Hide Advanced Settings";
      populateAdvancedSettings();
      if (actType !== "chat") {
        addChangeListeners(
          "recordingAudioSupport",
          "recordingAudioSupport",
          "boolean"
        );
        addChangeListeners(
          "recordingAudioPausesLimit",
          "recordingAudioPausesLimit",
          "number"
        );
        addChangeListeners(
          "recordingAudioPeopleLimit",
          "recordingAudioPeopleLimit",
          "number"
        );
        addChangeListeners(
          "recordingAudioParticipantsTimeLimit",
          "recordingAudioParticipantsTimeLimit",
          "number"
        );
        addChangeListeners(
          "recordingVideoSupport",
          "recordingVideoSupport",
          "boolean"
        );
        addChangeListeners(
          "recordingVideoPausesLimit",
          "recordingVideoPausesLimit",
          "number"
        );
        addChangeListeners(
          "recordingVideoPeopleLimit",
          "recordingVideoPeopleLimit",
          "number"
        );
        addChangeListeners(
          "recordingVideoParticipantsTimeLimit",
          "recordingVideoParticipantsTimeLimit",
          "number"
        );
        addChangeListeners(
          "recordingAllParticipantsSupport",
          "recordingAllParticipantsSupport",
          "boolean"
        );
        addChangeListeners(
          "recordingVideoParticipantsSupport",
          "recordingVideoParticipantsSupport",
          "boolean"
        );
        addChangeListeners(
          "recordingAllParticipantsFullRoomSupport",
          "recordingAllParticipantsFullRoomSupport",
          "boolean"
        );
        addChangeListeners(
          "recordingVideoParticipantsFullRoomSupport",
          "recordingVideoParticipantsFullRoomSupport",
          "boolean"
        );
        addChangeListeners(
          "recordingPreferredOrientation",
          "recordingPreferredOrientation",
          "string"
        );
        addChangeListeners(
          "recordingSupportForOtherOrientation",
          "recordingSupportForOtherOrientation",
          "boolean"
        );
        addChangeListeners(
          "recordingMultiFormatsSupport",
          "recordingMultiFormatsSupport",
          "boolean"
        );
        addChangeListeners(
          "recordingHLSSupport",
          "recordingHLSSupport",
          "boolean"
        );
      }
      addChangeListeners("itemPageLimit", "itemPageLimit", "number");
      addChangeListeners("mediaType", "mediaType", "string");
      addChangeListeners("addCoHost", "addCoHost", "boolean");
      addChangeListeners("targetOrientation", "targetOrientation", "string");
      addChangeListeners(
        "targetOrientationHost",
        "targetOrientationHost",
        "string"
      );
      addChangeListeners("targetResolution", "targetResolution", "string");
      addChangeListeners(
        "targetResolutionHost",
        "targetResolutionHost",
        "string"
      );
      addChangeListeners("actType", "actType", "string");
      if (altSocketType == "test") {
        document.getElementById("audioSetting").value = meetingParams.audioSetting;
        document.getElementById("audioSetting").disabled = true;
        document.getElementById("videoSetting").value = meetingParams.videoSetting;
        document.getElementById("videoSetting").disabled = true;
        document.getElementById("screenshareSetting").value = meetingParams.screenshareSetting;
        document.getElementById("screenshareSetting").disabled = true;
        document.getElementById("chatSetting").value = meetingParams.chatSetting;
        document.getElementById("chatSetting").disabled = true;
      } else {
        addChangeListeners("audioSetting", "audioSetting", "string");
        addChangeListeners("videoSetting", "videoSetting", "string");
        addChangeListeners("screenshareSetting", "screenshareSetting", "string");
        addChangeListeners("chatSetting", "chatSetting", "string");
      }
    } else {
      try {
        if (actType != "chat" && showRecording) {
          recordingParamsPanel.style.display = "none";
        }
        meetingParamsPanel.style.display = "none";
        advancedSettingsBtn.textContent = "Show Advanced Settings";
      } catch (error) {
      }
    }
  });
  function isValidDomain(domain, protocol) {
    if (domain.includes("localhost") || domain.includes("127.0.0.1")) {
      return false;
    }
    if (protocol === "http:") {
      return false;
    }
    return true;
  }
  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = /* @__PURE__ */ new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1e3);
      expires = "; expires=" + date.toUTCString();
    }
    const domain = document.domain ? "; domain=" + document.domain : "";
    document.cookie = name + "=" + (value || "") + expires + domain + "; path=/";
  }
  var checkAndSetAPI = (meetingRoomParams_, recordingParams_) => {
    try {
      if (apiType_ == "production") {
        if (isValidDomain(hostName, hostProtocol)) {
        } else {
          showAlert(
            "Invalid domain for production, please use a secured valid domain.",
            "danger"
          );
          apiKey = null;
          apiUserName = null;
          showRecording = false;
        }
      }
      updateRecordState(false);
      if (apiKey && apiKey.length == 64) {
        if (allowRecording) {
          showRecording = true;
          updateRecordState(true);
        } else {
          showRecording = false;
        }
      }
      if (apiType_ === "sandbox") {
        apiType = "sandbox";
      } else if (apiType_ === "production") {
        apiType = "production";
      }
      if (apiType_ === "sandbox") {
        maxMeetingDuration = 2;
        if (actType == "broadcast") {
          actType = "broadcast";
          refRoomCapacity = meetingRoomParams_.refRoomCapacity_broadcast;
        } else if (actType == "webinar" || actType == "conference") {
          refRoomCapacity = meetingRoomParams_.refRoomCapacity_meeting;
        } else if (actType == "chat") {
          refRoomCapacity = 2;
        }
        populateDuration();
      } else if (apiType_ === "production") {
        if (actType == "broadcast") {
          actType = "broadcast";
          refRoomCapacity = meetingRoomParams_.refRoomCapacity_broadcast;
        } else if (actType == "webinar" || actType == "conference") {
          refRoomCapacity = meetingRoomParams_.refRoomCapacity_meeting;
        } else if (actType == "chat") {
          refRoomCapacity = 2;
        }
        maxMeetingDuration = 24;
        populateDuration();
      }
      refMeetingParams = { ...meetingRoomParams_ };
      refRecordingParams = { ...recordingParams_ };
      meetingParams = { ...meetingRoomParams_ };
      recordingParams = { ...recordingParams_ };
      meetingParams.type = actType;
      inputCapacity.max = refRoomCapacity;
      updateWaitingRoomState();
    } catch (error) {
      apiKey = null;
      apiUserName = null;
    }
  };
  function showWaitingModal() {
    $("#waitingModal").modal({
      backdrop: "static",
      // Prevent dismissing the modal by clicking outside or pressing the Esc key
      keyboard: false
      // Disable keyboard events
    });
  }
  function hideWaitingModal() {
    $("#waitingModal").modal("hide");
  }
  function showAdminWelcomeModal() {
    disableJoin = true;
    $("#adminWelcomeModal").modal("show");
    const joinMeetingBtn2 = document.getElementById("joinButton");
    joinButton.disabled = true;
  }
  function hideAdminWelcomeModal() {
    $("#adminWelcomeModal").modal("hide");
  }
  $("#submitPasscodeBtn").click(function() {
    let passcode = $("#passcodeInput").val();
    if (passcode === passWord) {
      hideAdminWelcomeModal();
      closeStream();
      window.location.href = urll;
    } else {
      const warningMessage2 = document.getElementById("warningAdmin");
      warningMessage2.textContent = "Incorrect passcode. Try again.";
    }
  });
  var joinMeetingBtn = document.getElementById("joinButton");
  joinMeetingBtn.addEventListener("click", async () => {
    const nameInput2 = document.getElementById("userNameInputMain");
    const nameWarn = document.getElementById("userNameWarn");
    const joinButton2 = document.getElementById("joinButton");
    if (disableJoin) {
      joinButton2.disabled = true;
      return;
    }
    const eventIDInput2 = document.getElementById("eventIDInput");
    if (nameInput2.value.length === 0 || nameInput2.readOnly) {
      nameWarn.innerText = "Enter an Event ID and click confirm first.";
      joinButton2.disabled = true;
      return;
    }
    if (nameInput2.value.length < 2 || nameInput2.value.length > 10) {
      nameWarn.innerText = "Name must be between 2 and 10 characters long.";
      joinButton2.disabled = true;
      return;
    }
    let named = nameInput2.value.replace(/\s/g, "");
    if (existingNames.some(
      (existingName) => existingName.toLowerCase() === named.toLowerCase()
    )) {
      if (nameOfAdmin != named) {
        nameWarn.innerText = "Name is already taken.";
        joinButton2.disabled = true;
        return;
      } else {
        if (!pender) {
          nameWarn.innerText = "Name is already taken.";
          joinButton2.disabled = true;
          return;
        }
      }
    }
    nameWarn.innerText = "";
    joinButton2.disabled = false;
    if (deferAlertForCapacity) {
      if (named != nameOfAdmin) {
        s;
        showAlert("Event room is full, try again later.", "danger");
        return;
      }
    }
    eventID = await eventIDInput2.value;
    userName = await nameInput2.value;
    userName = userName.replace(/\s/g, "");
    const url = `/meeting/${eventID}/0`;
    let duration = 0;
    let capacity = 0;
    let scheduledDate = null;
    secureCode = null;
    await createLoadingModal();
    await socket_.emit(
      "joinEventRoom",
      {
        eventID,
        userName,
        secureCode,
        videoPreference,
        audioPreference,
        audioOutputPreference
      },
      async ({ success, secret, reason, url: url2 }) => {
        urll = url2;
        userSecret = secret;
        await hideLoadingModal();
        warningMessage.textContent = "";
        if (success) {
          const warningMessage2 = document.getElementById("warningMessage");
          if (waitingForAdmin || waitedRoom || checkForAdmin) {
            if (named == nameOfAdmin) {
              showAdminWelcomeModal();
              waitingForAdmin = false;
            } else {
              showWaitingModal();
            }
          } else {
            closeStream();
            window.location.href = urll;
          }
        } else {
          warningMessage.textContent = "The Event could not be joined, retry!";
          return;
        }
      }
    );
  });
  function handleWaitingRoomState(isChecked) {
    const label = document.querySelector(
      '.custom-control-label[for="waitingRoomToggle"]'
    );
    if (isChecked) {
      waitRoom = true;
      label.textContent = "Enabled";
    } else {
      waitRoom = false;
      label.textContent = "Disabled";
    }
  }
  function handleRecordState(isChecked) {
    const label = document.querySelector(
      '.custom-control-label[for="recordToggle"]'
    );
    if (isChecked) {
      recordRoom = true;
      label.textContent = "Enabled";
    } else {
      recordRoom = false;
      label.textContent = "Disabled";
    }
  }
  function updateWaitingRoomState() {
    let waitingRoomToggle = document.getElementById("waitingRoomToggle");
    if (actType == "chat" || apiType == "test") {
      handleWaitingRoomState(false);
      waitingRoomToggle.removeAttribute("checked");
    } else {
      handleWaitingRoomState(waitingRoomToggle.checked);
    }
    if (actType == "chat" || apiType == "test") {
      waitingRoomToggle.disabled = true;
    } else {
      waitingRoomToggle.disabled = false;
      waitingRoomToggle.addEventListener("change", function() {
        handleWaitingRoomState(waitingRoomToggle.checked);
      });
    }
  }
  function updateRecordState() {
    let recordToggle = document.getElementById("recordToggle");
    if (actType == "chat" || !showRecording) {
      handleRecordState(false);
      recordToggle.removeAttribute("checked");
    } else {
      handleRecordState(recordToggle.checked);
    }
    if (actType == "chat" || !showRecording) {
      recordToggle.disabled = true;
    } else {
      recordToggle.disabled = false;
      recordToggle.addEventListener("change", function() {
        handleRecordState(recordToggle.checked);
      });
    }
  }
  updateWaitingRoomState();
  updateRecordState();
  var confirmEventIDBtn = document.getElementById("confirmEventIDBtn");
  confirmEventIDBtn.addEventListener("click", async () => {
    const eventIDInput2 = document.getElementById("eventIDInput");
    eventID = eventIDInput2.value;
    eventID = eventID.toLowerCase();
    const warningMessage2 = document.getElementById("warningMessage");
    if (eventID.length > 6) {
      warningMessage2.textContent = "";
      await createLoadingModal();
      await socket_.disconnect(true);
      socket_ = io("/media", { transports: ["websocket"] });
      await loadSocket();
      await socket_.emit(
        "getRoomInfo",
        { eventID },
        async ({
          exists,
          names,
          bans,
          eventCapacity,
          eventEndedAt,
          eventStartedAt,
          eventEnded,
          eventStarted,
          hostName: hostName2,
          scheduledDate,
          pending,
          secureCode: secureCode2,
          waitRoom: waitRoom2,
          checkHost
        }) => {
          passWord = secureCode2;
          waitingForAdmin = false;
          nameOfAdmin = hostName2;
          pender = pending;
          waitRoom2 = waitRoom2;
          waitedRoom = waitRoom2;
          checkForAdmin = checkHost;
          await hideLoadingModal();
          eventStarted = eventStarted;
          if (exists) {
            hostName2 = hostName2.replace(/\s/g, "");
            if (!pending) {
              hostName2 = hostName2.replace(/\s/g, "");
              const currentDate = /* @__PURE__ */ new Date();
              const eventStartedDate = new Date(eventStartedAt);
              const eventEndedDate = new Date(eventEndedAt);
              if (!eventStarted || currentDate < eventStartedDate) {
                adminStarted = true;
              } else {
                adminStarted = false;
              }
              eventCapacity = parseInt(eventCapacity);
              const diff = names.length - bans.length;
              if (diff >= eventCapacity) {
                warningMessage2.textContent = "Event room is already at capacity";
                return;
              }
            } else {
              hostName2 = hostName2.replace(/\s/g, "");
              const currentDate = /* @__PURE__ */ new Date();
              const scheduledMeetingDate = new Date(scheduledDate);
              const diff = scheduledMeetingDate - currentDate;
              const minutes = Math.floor(diff / 1e3 / 60);
              if (minutes > 5) {
                warningMessage2.textContent = "This meeting has not started yet, you can join 5 minutes to time.";
                const scheduledMeetingDateReadable = scheduledMeetingDate.toLocaleString();
                const alertMessage = `Meeting will start at ${scheduledMeetingDateReadable}`;
                showAlert(alertMessage, "danger");
                return;
              } else {
                eventCapacity = parseInt(eventCapacity);
                const diff2 = names.length - bans.length;
                if (diff2 > eventCapacity) {
                  deferAlertForCapacity = true;
                }
                waitingForAdmin = true;
              }
            }
            if (eventEnded) {
              warningMessage2.textContent = "This event has already ended";
              return;
            }
            existingNames = names;
            existingBans = bans;
            warningMessage2.textContent = "The event ID is valid. Proceed to enter your name.";
            const userNameInputMain = document.getElementById("userNameInputMain");
            userNameInputMain.readOnly = false;
          } else {
            warningMessage2.textContent = "The Event ID does not exist. Enter a valid Event ID.";
            const userNameInputMain = document.getElementById("userNameInputMain");
            userNameInputMain.value = "";
            userNameInputMain.readOnly = true;
            const joinButton2 = document.getElementById("joinButton");
            joinButton2.disabled = true;
            return;
          }
        }
      );
    } else {
      const warningMessage3 = document.getElementById("warningMessage");
      warningMessage3.textContent = "Enter a valid Event ID.";
      const userNameInputMain = document.getElementById("userNameInputMain");
      userNameInputMain.readOnly = true;
      const joinButton2 = document.getElementById("joinButton");
      joinButton2.disabled = true;
      return;
    }
  });
  function loadSocket() {
    socket_.on("exitWaitRoomUser", async ({ typed, name }) => {
      let secret = userSecret;
      if (typed) {
        await socket_.emit(
          "exitWaitRoomURL",
          { eventID, userName: name, secret },
          ({ success, url }) => {
            urll = url;
            hideWaitingModal();
            if (success) {
              showAlert(
                "Host has allowed you entry. Redirecting to meeting room in 2 seconds."
              );
              setTimeout(function() {
                closeStream();
                window.location.href = urll;
              }, 2e3);
            } else {
              showAlert("You cannot join this event.");
            }
          }
        );
      } else {
        hideWaitingModal();
        showAlert("Host has denied you entry.", "danger");
      }
    });
    socket_.on("exitWaitRoom", async ({ name }) => {
      if (waitingForAdmin || checkForAdmin) {
        if (waitingForAdmin && !waitRoom || checkForAdmin) {
          let secret = userSecret;
          await socket_.emit(
            "exitWaitRoomURL",
            { eventID, userName: name, secret },
            ({ success, url }) => {
              hideWaitingModal();
              if (success) {
                showAlert(
                  "Host has started the meeting and/or allowed you entry. Redirecting to meeting room in 2 seconds.",
                  "success"
                );
                setTimeout(function() {
                  closeStream();
                  window.location.href = urll;
                }, 2e3);
              } else {
                showAlert("You cannot join this event.", "danger");
              }
            }
          );
        } else {
          waitingForAdmin = false;
        }
      }
    });
  }
  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
  var selfieSegmentation = null;
  async function addSelfieSegmentation() {
    let selectedImage = null;
    let processedStream = null;
    let mainCanvas = null;
    const defaultImages = ["wall", "wall2", "shelf", "clock", "desert", "flower"];
    const defaultImagesContainer = document.getElementById("defaultImages");
    const uploadImageInput = document.getElementById("uploadImage");
    const loadingSpinner = document.getElementById("loadingSpinner");
    async function preloadModel() {
      selfieSegmentation = new SelfieSegmentation({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
      });
      selfieSegmentation.setOptions({
        modelSelection: 1,
        selfieMode: true
      });
      await selfieSegmentation.initialize();
    }
    preloadModel().catch((err) => console.log("Error preloading model:", err));
    defaultImages.forEach((baseName) => {
      const thumb = `/images/backgrounds/${baseName}_thumbnail.jpg`;
      const full = `/images/backgrounds/${baseName}.jpg`;
      const img = document.createElement("img");
      img.src = thumb;
      img.classList.add("img-thumbnail", "m-1");
      img.style.width = "80px";
      img.style.cursor = "pointer";
      img.addEventListener("click", () => {
        loadImageToCanvas(full);
        setCookie2("backgroundSrc", full, 7);
        setCookie2("useBackground", "true", 7);
      });
      defaultImagesContainer.appendChild(img);
    });
    const noBackgroundButton = document.createElement("div");
    noBackgroundButton.innerHTML = "None";
    noBackgroundButton.classList.add(
      "img-thumbnail",
      "m-1",
      "d-flex",
      "align-items-center",
      "justify-content-center"
    );
    noBackgroundButton.style.width = "80px";
    noBackgroundButton.style.height = "80px";
    noBackgroundButton.style.cursor = "pointer";
    noBackgroundButton.style.backgroundColor = "white";
    noBackgroundButton.addEventListener("click", () => {
      selectedImage = null;
      setCookie2("useBackground", "false", 7);
      segmentationPreview(false);
    });
    defaultImagesContainer.appendChild(noBackgroundButton);
    uploadImageInput.addEventListener("change", (event2) => {
      try {
        const file = event2.target.files[0];
        if (file) {
          if (file.size > 2048 * 1024) {
            showAlert("File size must be less than 2MB.", "danger");
            return;
          }
          const validMimeTypes = ["image/jpeg", "image/png"];
          if (!validMimeTypes.includes(file.type)) {
            showAlert(
              "Invalid file type. Only JPEG and PNG are allowed.",
              "danger"
            );
            return;
          }
          const img = new Image();
          img.onload = () => {
            if (img.width !== 1920 || img.height !== 1920) {
              showAlert("Image dimensions must be 1920x1920.", "danger");
              return;
            }
            const reader2 = new FileReader();
            reader2.onloadend = () => {
              selectedImage = reader2.result;
              const baseCode = reader2.result.split(",")[1];
              const basePrefix = reader2.result.split(",")[0];
              loadImageToCanvas(reader2.result);
            };
            reader2.readAsDataURL(file);
          };
          const reader = new FileReader();
          reader.onload = (e) => {
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
          showAlert(
            "Custom images need to be uploaded again when you join the meeting.",
            "success"
          );
        }
      } catch (error) {
        console.log("Error uploading:", error);
      }
    });
    async function segmentationPreview(doSegmentation) {
      const videoPreview = document.getElementById("videoOutputPreview");
      if (!mainCanvas) {
        mainCanvas = document.createElement("canvas");
      }
      const virtualImage = new Image();
      virtualImage.src = selectedImage;
      const ctx = mainCanvas.getContext("2d");
      if (!doSegmentation) {
        processedStream = null;
        videoPreview.srcObject = localStreamVideo;
        setCookie2("useBackground", "false", 7);
        setCookie2("backgroundSrc", "", 7);
        return;
      }
      if (videoAlreadyOn) {
        const segmentVideo = localStreamVideo;
        try {
          await segmentImage(segmentVideo.getVideoTracks()[0]);
          setCookie2("useBackground", "true", 7);
        } catch (error) {
          setCookie2("useBackground", "false", 7);
        }
      } else {
        setTimeout(async () => {
          if (videoAlreadyOn) {
            const segmentVideo = localStreamVideo;
            try {
              await segmentImage(segmentVideo.getVideoTracks()[0]);
              setCookie2("useBackground", "true", 7);
            } catch (error) {
              setCookie2("useBackground", "false", 7);
            }
          }
        }, 4e3);
      }
      async function segmentImage(videoTrack) {
        if (!selfieSegmentation) {
          await preloadModel();
        }
        selfieSegmentation.onResults(onResults);
        const trackProcessor = new MediaStreamTrackProcessor({
          track: videoTrack
        });
        const trackGenerator = new MediaStreamTrackGenerator({
          kind: "video"
        });
        const transformer = new TransformStream({
          async transform(videoFrame, controller) {
            if (selfieSegmentation) {
              videoFrame.width = videoFrame.displayWidth;
              videoFrame.height = videoFrame.displayHeight;
              await selfieSegmentation.send({ image: videoFrame });
              const timestamp = videoFrame.timestamp;
              const newFrame = new VideoFrame(mainCanvas, { timestamp });
              videoFrame.close();
              controller.enqueue(newFrame);
            }
          }
        });
        trackProcessor.readable.pipeThrough(transformer).pipeTo(trackGenerator.writable).catch(() => {
        });
        processedStream = new MediaStream();
        processedStream.addTrack(trackGenerator);
        videoPreview.srcObject = processedStream;
      }
      function onResults(results) {
        ctx.save();
        ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
        ctx.drawImage(
          results.segmentationMask,
          0,
          0,
          mainCanvas.width,
          mainCanvas.height
        );
        ctx.globalCompositeOperation = "source-out";
        const pat = ctx.createPattern(virtualImage, "no-repeat");
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
        ctx.globalCompositeOperation = "destination-atop";
        ctx.drawImage(results.image, 0, 0, mainCanvas.width, mainCanvas.height);
        ctx.restore();
      }
    }
    function loadImageToCanvas(src) {
      const img = new Image();
      img.onload = () => {
        selectedImage = src;
        segmentationPreview(true);
      };
      img.src = src;
    }
    function getCookie2(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(";").shift();
    }
    function setCookie2(name, value, days) {
      let expires = "";
      if (days) {
        const date = /* @__PURE__ */ new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1e3);
        expires = "; expires=" + date.toUTCString();
      }
      const domain = document.domain ? "; domain=" + document.domain : "";
      document.cookie = name + "=" + (value || "") + expires + domain + "; path=/";
    }
    const useBackground = getCookie2("useBackground");
    let backgroundSrc = getCookie2("backgroundSrc");
    if (useBackground === "true") {
      if (backgroundSrc) {
        loadImageToCanvas(backgroundSrc);
      } else {
        backgroundSrc = "/images/backgrounds/wall.png";
        loadImageToCanvas(backgroundSrc);
      }
    }
  }
  addSelfieSegmentation();
})();
