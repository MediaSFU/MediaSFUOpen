(function () {
  function r(e, n, t) {
    function o(i, f) {
      if (!n[i]) {
        if (!e[i]) {
          var c = "function" == typeof require && require;
          if (!f && c) return c(i, !0);
          if (u) return u(i, !0);
          var a = new Error("Cannot find module '" + i + "'");
          throw ((a.code = "MODULE_NOT_FOUND"), a);
        }
        var p = (n[i] = { exports: {} });
        e[i][0].call(
          p.exports,
          function (r) {
            var n = e[i][1][r];
            return o(n || r);
          },
          p,
          p.exports,
          r,
          e,
          n,
          t
        );
      }
      return n[i].exports;
    }
    for (
      var u = "function" == typeof require && require, i = 0;
      i < t.length;
      i++
    )
      o(t[i]);
    return o;
  }
  return r;
})()(
  {
    1: [
      function (require, module, exports) {
        /**
         * Expose `Emitter`.
         */

        exports.Emitter = Emitter;

        /**
         * Initialize a new `Emitter`.
         *
         * @api public
         */

        function Emitter(obj) {
          if (obj) return mixin(obj);
        }

        /**
         * Mixin the emitter properties.
         *
         * @param {Object} obj
         * @return {Object}
         * @api private
         */

        function mixin(obj) {
          for (var key in Emitter.prototype) {
            obj[key] = Emitter.prototype[key];
          }
          return obj;
        }

        /**
         * Listen on the given `event` with `fn`.
         *
         * @param {String} event
         * @param {Function} fn
         * @return {Emitter}
         * @api public
         */

        Emitter.prototype.on = Emitter.prototype.addEventListener = function (
          event,
          fn
        ) {
          this._callbacks = this._callbacks || {};
          (this._callbacks["$" + event] =
            this._callbacks["$" + event] || []).push(fn);
          return this;
        };

        /**
         * Adds an `event` listener that will be invoked a single
         * time then automatically removed.
         *
         * @param {String} event
         * @param {Function} fn
         * @return {Emitter}
         * @api public
         */

        Emitter.prototype.once = function (event, fn) {
          function on() {
            this.off(event, on);
            fn.apply(this, arguments);
          }

          on.fn = fn;
          this.on(event, on);
          return this;
        };

        /**
         * Remove the given callback for `event` or all
         * registered callbacks.
         *
         * @param {String} event
         * @param {Function} fn
         * @return {Emitter}
         * @api public
         */

        Emitter.prototype.off =
          Emitter.prototype.removeListener =
          Emitter.prototype.removeAllListeners =
          Emitter.prototype.removeEventListener =
            function (event, fn) {
              this._callbacks = this._callbacks || {};

              // all
              if (0 == arguments.length) {
                this._callbacks = {};
                return this;
              }

              // specific event
              var callbacks = this._callbacks["$" + event];
              if (!callbacks) return this;

              // remove all handlers
              if (1 == arguments.length) {
                delete this._callbacks["$" + event];
                return this;
              }

              // remove specific handler
              var cb;
              for (var i = 0; i < callbacks.length; i++) {
                cb = callbacks[i];
                if (cb === fn || cb.fn === fn) {
                  callbacks.splice(i, 1);
                  break;
                }
              }

              // Remove event specific arrays for event types that no
              // one is subscribed for to avoid memory leak.
              if (callbacks.length === 0) {
                delete this._callbacks["$" + event];
              }

              return this;
            };

        /**
         * Emit `event` with the given args.
         *
         * @param {String} event
         * @param {Mixed} ...
         * @return {Emitter}
         */

        Emitter.prototype.emit = function (event) {
          this._callbacks = this._callbacks || {};

          var args = new Array(arguments.length - 1),
            callbacks = this._callbacks["$" + event];

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

        // alias used for reserved events (protected method)
        Emitter.prototype.emitReserved = Emitter.prototype.emit;

        /**
         * Return array of callbacks for `event`.
         *
         * @param {String} event
         * @return {Array}
         * @api public
         */

        Emitter.prototype.listeners = function (event) {
          this._callbacks = this._callbacks || {};
          return this._callbacks["$" + event] || [];
        };

        /**
         * Check if this emitter has `event` handlers.
         *
         * @param {String} event
         * @return {Boolean}
         * @api public
         */

        Emitter.prototype.hasListeners = function (event) {
          return !!this.listeners(event).length;
        };
      },
      {},
    ],
    2: [
      function (require, module, exports) {
        "use strict";

        exports.byteLength = byteLength;
        exports.toByteArray = toByteArray;
        exports.fromByteArray = fromByteArray;

        var lookup = [];
        var revLookup = [];
        var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;

        var code =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        for (var i = 0, len = code.length; i < len; ++i) {
          lookup[i] = code[i];
          revLookup[code.charCodeAt(i)] = i;
        }

        // Support decoding URL-safe base64 strings, as Node.js does.
        // See: https://en.wikipedia.org/wiki/Base64#URL_applications
        revLookup["-".charCodeAt(0)] = 62;
        revLookup["_".charCodeAt(0)] = 63;

        function getLens(b64) {
          var len = b64.length;

          if (len % 4 > 0) {
            throw new Error("Invalid string. Length must be a multiple of 4");
          }

          // Trim off extra bytes after placeholder bytes are found
          // See: https://github.com/beatgammit/base64-js/issues/42
          var validLen = b64.indexOf("=");
          if (validLen === -1) validLen = len;

          var placeHoldersLen = validLen === len ? 0 : 4 - (validLen % 4);

          return [validLen, placeHoldersLen];
        }

        // base64 is 4/3 + up to two characters of the original data
        function byteLength(b64) {
          var lens = getLens(b64);
          var validLen = lens[0];
          var placeHoldersLen = lens[1];
          return ((validLen + placeHoldersLen) * 3) / 4 - placeHoldersLen;
        }

        function _byteLength(b64, validLen, placeHoldersLen) {
          return ((validLen + placeHoldersLen) * 3) / 4 - placeHoldersLen;
        }

        function toByteArray(b64) {
          var tmp;
          var lens = getLens(b64);
          var validLen = lens[0];
          var placeHoldersLen = lens[1];

          var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));

          var curByte = 0;

          // if there are placeholders, only get up to the last complete 4 chars
          var len = placeHoldersLen > 0 ? validLen - 4 : validLen;

          var i;
          for (i = 0; i < len; i += 4) {
            tmp =
              (revLookup[b64.charCodeAt(i)] << 18) |
              (revLookup[b64.charCodeAt(i + 1)] << 12) |
              (revLookup[b64.charCodeAt(i + 2)] << 6) |
              revLookup[b64.charCodeAt(i + 3)];
            arr[curByte++] = (tmp >> 16) & 0xff;
            arr[curByte++] = (tmp >> 8) & 0xff;
            arr[curByte++] = tmp & 0xff;
          }

          if (placeHoldersLen === 2) {
            tmp =
              (revLookup[b64.charCodeAt(i)] << 2) |
              (revLookup[b64.charCodeAt(i + 1)] >> 4);
            arr[curByte++] = tmp & 0xff;
          }

          if (placeHoldersLen === 1) {
            tmp =
              (revLookup[b64.charCodeAt(i)] << 10) |
              (revLookup[b64.charCodeAt(i + 1)] << 4) |
              (revLookup[b64.charCodeAt(i + 2)] >> 2);
            arr[curByte++] = (tmp >> 8) & 0xff;
            arr[curByte++] = tmp & 0xff;
          }

          return arr;
        }

        function tripletToBase64(num) {
          return (
            lookup[(num >> 18) & 0x3f] +
            lookup[(num >> 12) & 0x3f] +
            lookup[(num >> 6) & 0x3f] +
            lookup[num & 0x3f]
          );
        }

        function encodeChunk(uint8, start, end) {
          var tmp;
          var output = [];
          for (var i = start; i < end; i += 3) {
            tmp =
              ((uint8[i] << 16) & 0xff0000) +
              ((uint8[i + 1] << 8) & 0xff00) +
              (uint8[i + 2] & 0xff);
            output.push(tripletToBase64(tmp));
          }
          return output.join("");
        }

        function fromByteArray(uint8) {
          var tmp;
          var len = uint8.length;
          var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
          var parts = [];
          var maxChunkLength = 16383; // must be multiple of 3

          // go through the array every three bytes, we'll deal with trailing stuff later
          for (
            var i = 0, len2 = len - extraBytes;
            i < len2;
            i += maxChunkLength
          ) {
            parts.push(
              encodeChunk(
                uint8,
                i,
                i + maxChunkLength > len2 ? len2 : i + maxChunkLength
              )
            );
          }

          // pad the end with zeros, but make sure to not forget the extra bytes
          if (extraBytes === 1) {
            tmp = uint8[len - 1];
            parts.push(lookup[tmp >> 2] + lookup[(tmp << 4) & 0x3f] + "==");
          } else if (extraBytes === 2) {
            tmp = (uint8[len - 2] << 8) + uint8[len - 1];
            parts.push(
              lookup[tmp >> 10] +
                lookup[(tmp >> 4) & 0x3f] +
                lookup[(tmp << 2) & 0x3f] +
                "="
            );
          }

          return parts.join("");
        }
      },
      {},
    ],
    3: [
      function (require, module, exports) {
        (function (Buffer) {
          (function () {
            /*!
             * The buffer module from node.js, for the browser.
             *
             * @author   Feross Aboukhadijeh <https://feross.org>
             * @license  MIT
             */
            /* eslint-disable no-proto */

            "use strict";

            var base64 = require("base64-js");
            var ieee754 = require("ieee754");

            exports.Buffer = Buffer;
            exports.SlowBuffer = SlowBuffer;
            exports.INSPECT_MAX_BYTES = 50;

            var K_MAX_LENGTH = 0x7fffffff;
            exports.kMaxLength = K_MAX_LENGTH;

            /**
             * If `Buffer.TYPED_ARRAY_SUPPORT`:
             *   === true    Use Uint8Array implementation (fastest)
             *   === false   Print warning and recommend using `buffer` v4.x which has an Object
             *               implementation (most compatible, even IE6)
             *
             * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
             * Opera 11.6+, iOS 4.2+.
             *
             * We report that the browser does not support typed arrays if the are not subclassable
             * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
             * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
             * for __proto__ and has a buggy typed array implementation.
             */
            Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();

            if (
              !Buffer.TYPED_ARRAY_SUPPORT &&
              typeof console !== "undefined" &&
              typeof console.error === "function"
            ) {
              console.error(
                "This browser lacks typed array (Uint8Array) support which is required by " +
                  "`buffer` v5.x. Use `buffer` v4.x if you require old browser support."
              );
            }

            function typedArraySupport() {
              // Can typed array instances can be augmented?
              try {
                var arr = new Uint8Array(1);
                arr.__proto__ = {
                  __proto__: Uint8Array.prototype,
                  foo: function () {
                    return 42;
                  },
                };
                return arr.foo() === 42;
              } catch (e) {
                return false;
              }
            }

            Object.defineProperty(Buffer.prototype, "parent", {
              enumerable: true,
              get: function () {
                if (!Buffer.isBuffer(this)) return undefined;
                return this.buffer;
              },
            });

            Object.defineProperty(Buffer.prototype, "offset", {
              enumerable: true,
              get: function () {
                if (!Buffer.isBuffer(this)) return undefined;
                return this.byteOffset;
              },
            });

            function createBuffer(length) {
              if (length > K_MAX_LENGTH) {
                throw new RangeError(
                  'The value "' + length + '" is invalid for option "size"'
                );
              }
              // Return an augmented `Uint8Array` instance
              var buf = new Uint8Array(length);
              buf.__proto__ = Buffer.prototype;
              return buf;
            }

            /**
             * The Buffer constructor returns instances of `Uint8Array` that have their
             * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
             * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
             * and the `Uint8Array` methods. Square bracket notation works as expected -- it
             * returns a single octet.
             *
             * The `Uint8Array` prototype remains unmodified.
             */

            function Buffer(arg, encodingOrOffset, length) {
              // Common case.
              if (typeof arg === "number") {
                if (typeof encodingOrOffset === "string") {
                  throw new TypeError(
                    'The "string" argument must be of type string. Received type number'
                  );
                }
                return allocUnsafe(arg);
              }
              return from(arg, encodingOrOffset, length);
            }

            // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
            if (
              typeof Symbol !== "undefined" &&
              Symbol.species != null &&
              Buffer[Symbol.species] === Buffer
            ) {
              Object.defineProperty(Buffer, Symbol.species, {
                value: null,
                configurable: true,
                enumerable: false,
                writable: false,
              });
            }

            Buffer.poolSize = 8192; // not used by this implementation

            function from(value, encodingOrOffset, length) {
              if (typeof value === "string") {
                return fromString(value, encodingOrOffset);
              }

              if (ArrayBuffer.isView(value)) {
                return fromArrayLike(value);
              }

              if (value == null) {
                throw TypeError(
                  "The first argument must be one of type string, Buffer, ArrayBuffer, Array, " +
                    "or Array-like Object. Received type " +
                    typeof value
                );
              }

              if (
                isInstance(value, ArrayBuffer) ||
                (value && isInstance(value.buffer, ArrayBuffer))
              ) {
                return fromArrayBuffer(value, encodingOrOffset, length);
              }

              if (typeof value === "number") {
                throw new TypeError(
                  'The "value" argument must not be of type number. Received type number'
                );
              }

              var valueOf = value.valueOf && value.valueOf();
              if (valueOf != null && valueOf !== value) {
                return Buffer.from(valueOf, encodingOrOffset, length);
              }

              var b = fromObject(value);
              if (b) return b;

              if (
                typeof Symbol !== "undefined" &&
                Symbol.toPrimitive != null &&
                typeof value[Symbol.toPrimitive] === "function"
              ) {
                return Buffer.from(
                  value[Symbol.toPrimitive]("string"),
                  encodingOrOffset,
                  length
                );
              }

              throw new TypeError(
                "The first argument must be one of type string, Buffer, ArrayBuffer, Array, " +
                  "or Array-like Object. Received type " +
                  typeof value
              );
            }

            /**
             * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
             * if value is a number.
             * Buffer.from(str[, encoding])
             * Buffer.from(array)
             * Buffer.from(buffer)
             * Buffer.from(arrayBuffer[, byteOffset[, length]])
             **/
            Buffer.from = function (value, encodingOrOffset, length) {
              return from(value, encodingOrOffset, length);
            };

            // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
            // https://github.com/feross/buffer/pull/148
            Buffer.prototype.__proto__ = Uint8Array.prototype;
            Buffer.__proto__ = Uint8Array;

            function assertSize(size) {
              if (typeof size !== "number") {
                throw new TypeError('"size" argument must be of type number');
              } else if (size < 0) {
                throw new RangeError(
                  'The value "' + size + '" is invalid for option "size"'
                );
              }
            }

            function alloc(size, fill, encoding) {
              assertSize(size);
              if (size <= 0) {
                return createBuffer(size);
              }
              if (fill !== undefined) {
                // Only pay attention to encoding if it's a string. This
                // prevents accidentally sending in a number that would
                // be interpretted as a start offset.
                return typeof encoding === "string"
                  ? createBuffer(size).fill(fill, encoding)
                  : createBuffer(size).fill(fill);
              }
              return createBuffer(size);
            }

            /**
             * Creates a new filled Buffer instance.
             * alloc(size[, fill[, encoding]])
             **/
            Buffer.alloc = function (size, fill, encoding) {
              return alloc(size, fill, encoding);
            };

            function allocUnsafe(size) {
              assertSize(size);
              return createBuffer(size < 0 ? 0 : checked(size) | 0);
            }

            /**
             * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
             * */
            Buffer.allocUnsafe = function (size) {
              return allocUnsafe(size);
            };
            /**
             * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
             */
            Buffer.allocUnsafeSlow = function (size) {
              return allocUnsafe(size);
            };

            function fromString(string, encoding) {
              if (typeof encoding !== "string" || encoding === "") {
                encoding = "utf8";
              }

              if (!Buffer.isEncoding(encoding)) {
                throw new TypeError("Unknown encoding: " + encoding);
              }

              var length = byteLength(string, encoding) | 0;
              var buf = createBuffer(length);

              var actual = buf.write(string, encoding);

              if (actual !== length) {
                // Writing a hex string, for example, that contains invalid characters will
                // cause everything after the first invalid character to be ignored. (e.g.
                // 'abxxcd' will be treated as 'ab')
                buf = buf.slice(0, actual);
              }

              return buf;
            }

            function fromArrayLike(array) {
              var length = array.length < 0 ? 0 : checked(array.length) | 0;
              var buf = createBuffer(length);
              for (var i = 0; i < length; i += 1) {
                buf[i] = array[i] & 255;
              }
              return buf;
            }

            function fromArrayBuffer(array, byteOffset, length) {
              if (byteOffset < 0 || array.byteLength < byteOffset) {
                throw new RangeError('"offset" is outside of buffer bounds');
              }

              if (array.byteLength < byteOffset + (length || 0)) {
                throw new RangeError('"length" is outside of buffer bounds');
              }

              var buf;
              if (byteOffset === undefined && length === undefined) {
                buf = new Uint8Array(array);
              } else if (length === undefined) {
                buf = new Uint8Array(array, byteOffset);
              } else {
                buf = new Uint8Array(array, byteOffset, length);
              }

              // Return an augmented `Uint8Array` instance
              buf.__proto__ = Buffer.prototype;
              return buf;
            }

            function fromObject(obj) {
              if (Buffer.isBuffer(obj)) {
                var len = checked(obj.length) | 0;
                var buf = createBuffer(len);

                if (buf.length === 0) {
                  return buf;
                }

                obj.copy(buf, 0, 0, len);
                return buf;
              }

              if (obj.length !== undefined) {
                if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
                  return createBuffer(0);
                }
                return fromArrayLike(obj);
              }

              if (obj.type === "Buffer" && Array.isArray(obj.data)) {
                return fromArrayLike(obj.data);
              }
            }

            function checked(length) {
              // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
              // length is NaN (which is otherwise coerced to zero.)
              if (length >= K_MAX_LENGTH) {
                throw new RangeError(
                  "Attempt to allocate Buffer larger than maximum " +
                    "size: 0x" +
                    K_MAX_LENGTH.toString(16) +
                    " bytes"
                );
              }
              return length | 0;
            }

            function SlowBuffer(length) {
              if (+length != length) {
                // eslint-disable-line eqeqeq
                length = 0;
              }
              return Buffer.alloc(+length);
            }

            Buffer.isBuffer = function isBuffer(b) {
              return (
                b != null && b._isBuffer === true && b !== Buffer.prototype
              ); // so Buffer.isBuffer(Buffer.prototype) will be false
            };

            Buffer.compare = function compare(a, b) {
              if (isInstance(a, Uint8Array))
                a = Buffer.from(a, a.offset, a.byteLength);
              if (isInstance(b, Uint8Array))
                b = Buffer.from(b, b.offset, b.byteLength);
              if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
                throw new TypeError(
                  'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
                );
              }

              if (a === b) return 0;

              var x = a.length;
              var y = b.length;

              for (var i = 0, len = Math.min(x, y); i < len; ++i) {
                if (a[i] !== b[i]) {
                  x = a[i];
                  y = b[i];
                  break;
                }
              }

              if (x < y) return -1;
              if (y < x) return 1;
              return 0;
            };

            Buffer.isEncoding = function isEncoding(encoding) {
              switch (String(encoding).toLowerCase()) {
                case "hex":
                case "utf8":
                case "utf-8":
                case "ascii":
                case "latin1":
                case "binary":
                case "base64":
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return true;
                default:
                  return false;
              }
            };

            Buffer.concat = function concat(list, length) {
              if (!Array.isArray(list)) {
                throw new TypeError(
                  '"list" argument must be an Array of Buffers'
                );
              }

              if (list.length === 0) {
                return Buffer.alloc(0);
              }

              var i;
              if (length === undefined) {
                length = 0;
                for (i = 0; i < list.length; ++i) {
                  length += list[i].length;
                }
              }

              var buffer = Buffer.allocUnsafe(length);
              var pos = 0;
              for (i = 0; i < list.length; ++i) {
                var buf = list[i];
                if (isInstance(buf, Uint8Array)) {
                  buf = Buffer.from(buf);
                }
                if (!Buffer.isBuffer(buf)) {
                  throw new TypeError(
                    '"list" argument must be an Array of Buffers'
                  );
                }
                buf.copy(buffer, pos);
                pos += buf.length;
              }
              return buffer;
            };

            function byteLength(string, encoding) {
              if (Buffer.isBuffer(string)) {
                return string.length;
              }
              if (
                ArrayBuffer.isView(string) ||
                isInstance(string, ArrayBuffer)
              ) {
                return string.byteLength;
              }
              if (typeof string !== "string") {
                throw new TypeError(
                  'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
                    "Received type " +
                    typeof string
                );
              }

              var len = string.length;
              var mustMatch = arguments.length > 2 && arguments[2] === true;
              if (!mustMatch && len === 0) return 0;

              // Use a for loop to avoid recursion
              var loweredCase = false;
              for (;;) {
                switch (encoding) {
                  case "ascii":
                  case "latin1":
                  case "binary":
                    return len;
                  case "utf8":
                  case "utf-8":
                    return utf8ToBytes(string).length;
                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return len * 2;
                  case "hex":
                    return len >>> 1;
                  case "base64":
                    return base64ToBytes(string).length;
                  default:
                    if (loweredCase) {
                      return mustMatch ? -1 : utf8ToBytes(string).length; // assume utf8
                    }
                    encoding = ("" + encoding).toLowerCase();
                    loweredCase = true;
                }
              }
            }
            Buffer.byteLength = byteLength;

            function slowToString(encoding, start, end) {
              var loweredCase = false;

              // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
              // property of a typed array.

              // This behaves neither like String nor Uint8Array in that we set start/end
              // to their upper/lower bounds if the value passed is out of range.
              // undefined is handled specially as per ECMA-262 6th Edition,
              // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
              if (start === undefined || start < 0) {
                start = 0;
              }
              // Return early if start > this.length. Done here to prevent potential uint32
              // coercion fail below.
              if (start > this.length) {
                return "";
              }

              if (end === undefined || end > this.length) {
                end = this.length;
              }

              if (end <= 0) {
                return "";
              }

              // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
              end >>>= 0;
              start >>>= 0;

              if (end <= start) {
                return "";
              }

              if (!encoding) encoding = "utf8";

              while (true) {
                switch (encoding) {
                  case "hex":
                    return hexSlice(this, start, end);

                  case "utf8":
                  case "utf-8":
                    return utf8Slice(this, start, end);

                  case "ascii":
                    return asciiSlice(this, start, end);

                  case "latin1":
                  case "binary":
                    return latin1Slice(this, start, end);

                  case "base64":
                    return base64Slice(this, start, end);

                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return utf16leSlice(this, start, end);

                  default:
                    if (loweredCase)
                      throw new TypeError("Unknown encoding: " + encoding);
                    encoding = (encoding + "").toLowerCase();
                    loweredCase = true;
                }
              }
            }

            // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
            // to detect a Buffer instance. It's not possible to use `instanceof Buffer`
            // reliably in a browserify context because there could be multiple different
            // copies of the 'buffer' package in use. This method works even for Buffer
            // instances that were created from another copy of the `buffer` package.
            // See: https://github.com/feross/buffer/issues/154
            Buffer.prototype._isBuffer = true;

            function swap(b, n, m) {
              var i = b[n];
              b[n] = b[m];
              b[m] = i;
            }

            Buffer.prototype.swap16 = function swap16() {
              var len = this.length;
              if (len % 2 !== 0) {
                throw new RangeError(
                  "Buffer size must be a multiple of 16-bits"
                );
              }
              for (var i = 0; i < len; i += 2) {
                swap(this, i, i + 1);
              }
              return this;
            };

            Buffer.prototype.swap32 = function swap32() {
              var len = this.length;
              if (len % 4 !== 0) {
                throw new RangeError(
                  "Buffer size must be a multiple of 32-bits"
                );
              }
              for (var i = 0; i < len; i += 4) {
                swap(this, i, i + 3);
                swap(this, i + 1, i + 2);
              }
              return this;
            };

            Buffer.prototype.swap64 = function swap64() {
              var len = this.length;
              if (len % 8 !== 0) {
                throw new RangeError(
                  "Buffer size must be a multiple of 64-bits"
                );
              }
              for (var i = 0; i < len; i += 8) {
                swap(this, i, i + 7);
                swap(this, i + 1, i + 6);
                swap(this, i + 2, i + 5);
                swap(this, i + 3, i + 4);
              }
              return this;
            };

            Buffer.prototype.toString = function toString() {
              var length = this.length;
              if (length === 0) return "";
              if (arguments.length === 0) return utf8Slice(this, 0, length);
              return slowToString.apply(this, arguments);
            };

            Buffer.prototype.toLocaleString = Buffer.prototype.toString;

            Buffer.prototype.equals = function equals(b) {
              if (!Buffer.isBuffer(b))
                throw new TypeError("Argument must be a Buffer");
              if (this === b) return true;
              return Buffer.compare(this, b) === 0;
            };

            Buffer.prototype.inspect = function inspect() {
              var str = "";
              var max = exports.INSPECT_MAX_BYTES;
              str = this.toString("hex", 0, max)
                .replace(/(.{2})/g, "$1 ")
                .trim();
              if (this.length > max) str += " ... ";
              return "<Buffer " + str + ">";
            };

            Buffer.prototype.compare = function compare(
              target,
              start,
              end,
              thisStart,
              thisEnd
            ) {
              if (isInstance(target, Uint8Array)) {
                target = Buffer.from(target, target.offset, target.byteLength);
              }
              if (!Buffer.isBuffer(target)) {
                throw new TypeError(
                  'The "target" argument must be one of type Buffer or Uint8Array. ' +
                    "Received type " +
                    typeof target
                );
              }

              if (start === undefined) {
                start = 0;
              }
              if (end === undefined) {
                end = target ? target.length : 0;
              }
              if (thisStart === undefined) {
                thisStart = 0;
              }
              if (thisEnd === undefined) {
                thisEnd = this.length;
              }

              if (
                start < 0 ||
                end > target.length ||
                thisStart < 0 ||
                thisEnd > this.length
              ) {
                throw new RangeError("out of range index");
              }

              if (thisStart >= thisEnd && start >= end) {
                return 0;
              }
              if (thisStart >= thisEnd) {
                return -1;
              }
              if (start >= end) {
                return 1;
              }

              start >>>= 0;
              end >>>= 0;
              thisStart >>>= 0;
              thisEnd >>>= 0;

              if (this === target) return 0;

              var x = thisEnd - thisStart;
              var y = end - start;
              var len = Math.min(x, y);

              var thisCopy = this.slice(thisStart, thisEnd);
              var targetCopy = target.slice(start, end);

              for (var i = 0; i < len; ++i) {
                if (thisCopy[i] !== targetCopy[i]) {
                  x = thisCopy[i];
                  y = targetCopy[i];
                  break;
                }
              }

              if (x < y) return -1;
              if (y < x) return 1;
              return 0;
            };

            // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
            // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
            //
            // Arguments:
            // - buffer - a Buffer to search
            // - val - a string, Buffer, or number
            // - byteOffset - an index into `buffer`; will be clamped to an int32
            // - encoding - an optional encoding, relevant is val is a string
            // - dir - true for indexOf, false for lastIndexOf
            function bidirectionalIndexOf(
              buffer,
              val,
              byteOffset,
              encoding,
              dir
            ) {
              // Empty buffer means no match
              if (buffer.length === 0) return -1;

              // Normalize byteOffset
              if (typeof byteOffset === "string") {
                encoding = byteOffset;
                byteOffset = 0;
              } else if (byteOffset > 0x7fffffff) {
                byteOffset = 0x7fffffff;
              } else if (byteOffset < -0x80000000) {
                byteOffset = -0x80000000;
              }
              byteOffset = +byteOffset; // Coerce to Number.
              if (numberIsNaN(byteOffset)) {
                // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
                byteOffset = dir ? 0 : buffer.length - 1;
              }

              // Normalize byteOffset: negative offsets start from the end of the buffer
              if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
              if (byteOffset >= buffer.length) {
                if (dir) return -1;
                else byteOffset = buffer.length - 1;
              } else if (byteOffset < 0) {
                if (dir) byteOffset = 0;
                else return -1;
              }

              // Normalize val
              if (typeof val === "string") {
                val = Buffer.from(val, encoding);
              }

              // Finally, search either indexOf (if dir is true) or lastIndexOf
              if (Buffer.isBuffer(val)) {
                // Special case: looking for empty string/buffer always fails
                if (val.length === 0) {
                  return -1;
                }
                return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
              } else if (typeof val === "number") {
                val = val & 0xff; // Search for a byte value [0-255]
                if (typeof Uint8Array.prototype.indexOf === "function") {
                  if (dir) {
                    return Uint8Array.prototype.indexOf.call(
                      buffer,
                      val,
                      byteOffset
                    );
                  } else {
                    return Uint8Array.prototype.lastIndexOf.call(
                      buffer,
                      val,
                      byteOffset
                    );
                  }
                }
                return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
              }

              throw new TypeError("val must be string, number or Buffer");
            }

            function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
              var indexSize = 1;
              var arrLength = arr.length;
              var valLength = val.length;

              if (encoding !== undefined) {
                encoding = String(encoding).toLowerCase();
                if (
                  encoding === "ucs2" ||
                  encoding === "ucs-2" ||
                  encoding === "utf16le" ||
                  encoding === "utf-16le"
                ) {
                  if (arr.length < 2 || val.length < 2) {
                    return -1;
                  }
                  indexSize = 2;
                  arrLength /= 2;
                  valLength /= 2;
                  byteOffset /= 2;
                }
              }

              function read(buf, i) {
                if (indexSize === 1) {
                  return buf[i];
                } else {
                  return buf.readUInt16BE(i * indexSize);
                }
              }

              var i;
              if (dir) {
                var foundIndex = -1;
                for (i = byteOffset; i < arrLength; i++) {
                  if (
                    read(arr, i) ===
                    read(val, foundIndex === -1 ? 0 : i - foundIndex)
                  ) {
                    if (foundIndex === -1) foundIndex = i;
                    if (i - foundIndex + 1 === valLength)
                      return foundIndex * indexSize;
                  } else {
                    if (foundIndex !== -1) i -= i - foundIndex;
                    foundIndex = -1;
                  }
                }
              } else {
                if (byteOffset + valLength > arrLength)
                  byteOffset = arrLength - valLength;
                for (i = byteOffset; i >= 0; i--) {
                  var found = true;
                  for (var j = 0; j < valLength; j++) {
                    if (read(arr, i + j) !== read(val, j)) {
                      found = false;
                      break;
                    }
                  }
                  if (found) return i;
                }
              }

              return -1;
            }

            Buffer.prototype.includes = function includes(
              val,
              byteOffset,
              encoding
            ) {
              return this.indexOf(val, byteOffset, encoding) !== -1;
            };

            Buffer.prototype.indexOf = function indexOf(
              val,
              byteOffset,
              encoding
            ) {
              return bidirectionalIndexOf(
                this,
                val,
                byteOffset,
                encoding,
                true
              );
            };

            Buffer.prototype.lastIndexOf = function lastIndexOf(
              val,
              byteOffset,
              encoding
            ) {
              return bidirectionalIndexOf(
                this,
                val,
                byteOffset,
                encoding,
                false
              );
            };

            function hexWrite(buf, string, offset, length) {
              offset = Number(offset) || 0;
              var remaining = buf.length - offset;
              if (!length) {
                length = remaining;
              } else {
                length = Number(length);
                if (length > remaining) {
                  length = remaining;
                }
              }

              var strLen = string.length;

              if (length > strLen / 2) {
                length = strLen / 2;
              }
              for (var i = 0; i < length; ++i) {
                var parsed = parseInt(string.substr(i * 2, 2), 16);
                if (numberIsNaN(parsed)) return i;
                buf[offset + i] = parsed;
              }
              return i;
            }

            function utf8Write(buf, string, offset, length) {
              return blitBuffer(
                utf8ToBytes(string, buf.length - offset),
                buf,
                offset,
                length
              );
            }

            function asciiWrite(buf, string, offset, length) {
              return blitBuffer(asciiToBytes(string), buf, offset, length);
            }

            function latin1Write(buf, string, offset, length) {
              return asciiWrite(buf, string, offset, length);
            }

            function base64Write(buf, string, offset, length) {
              return blitBuffer(base64ToBytes(string), buf, offset, length);
            }

            function ucs2Write(buf, string, offset, length) {
              return blitBuffer(
                utf16leToBytes(string, buf.length - offset),
                buf,
                offset,
                length
              );
            }

            Buffer.prototype.write = function write(
              string,
              offset,
              length,
              encoding
            ) {
              // Buffer#write(string)
              if (offset === undefined) {
                encoding = "utf8";
                length = this.length;
                offset = 0;
                // Buffer#write(string, encoding)
              } else if (length === undefined && typeof offset === "string") {
                encoding = offset;
                length = this.length;
                offset = 0;
                // Buffer#write(string, offset[, length][, encoding])
              } else if (isFinite(offset)) {
                offset = offset >>> 0;
                if (isFinite(length)) {
                  length = length >>> 0;
                  if (encoding === undefined) encoding = "utf8";
                } else {
                  encoding = length;
                  length = undefined;
                }
              } else {
                throw new Error(
                  "Buffer.write(string, encoding, offset[, length]) is no longer supported"
                );
              }

              var remaining = this.length - offset;
              if (length === undefined || length > remaining)
                length = remaining;

              if (
                (string.length > 0 && (length < 0 || offset < 0)) ||
                offset > this.length
              ) {
                throw new RangeError("Attempt to write outside buffer bounds");
              }

              if (!encoding) encoding = "utf8";

              var loweredCase = false;
              for (;;) {
                switch (encoding) {
                  case "hex":
                    return hexWrite(this, string, offset, length);

                  case "utf8":
                  case "utf-8":
                    return utf8Write(this, string, offset, length);

                  case "ascii":
                    return asciiWrite(this, string, offset, length);

                  case "latin1":
                  case "binary":
                    return latin1Write(this, string, offset, length);

                  case "base64":
                    // Warning: maxLength not taken into account in base64Write
                    return base64Write(this, string, offset, length);

                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return ucs2Write(this, string, offset, length);

                  default:
                    if (loweredCase)
                      throw new TypeError("Unknown encoding: " + encoding);
                    encoding = ("" + encoding).toLowerCase();
                    loweredCase = true;
                }
              }
            };

            Buffer.prototype.toJSON = function toJSON() {
              return {
                type: "Buffer",
                data: Array.prototype.slice.call(this._arr || this, 0),
              };
            };

            function base64Slice(buf, start, end) {
              if (start === 0 && end === buf.length) {
                return base64.fromByteArray(buf);
              } else {
                return base64.fromByteArray(buf.slice(start, end));
              }
            }

            function utf8Slice(buf, start, end) {
              end = Math.min(buf.length, end);
              var res = [];

              var i = start;
              while (i < end) {
                var firstByte = buf[i];
                var codePoint = null;
                var bytesPerSequence =
                  firstByte > 0xef
                    ? 4
                    : firstByte > 0xdf
                    ? 3
                    : firstByte > 0xbf
                    ? 2
                    : 1;

                if (i + bytesPerSequence <= end) {
                  var secondByte, thirdByte, fourthByte, tempCodePoint;

                  switch (bytesPerSequence) {
                    case 1:
                      if (firstByte < 0x80) {
                        codePoint = firstByte;
                      }
                      break;
                    case 2:
                      secondByte = buf[i + 1];
                      if ((secondByte & 0xc0) === 0x80) {
                        tempCodePoint =
                          ((firstByte & 0x1f) << 0x6) | (secondByte & 0x3f);
                        if (tempCodePoint > 0x7f) {
                          codePoint = tempCodePoint;
                        }
                      }
                      break;
                    case 3:
                      secondByte = buf[i + 1];
                      thirdByte = buf[i + 2];
                      if (
                        (secondByte & 0xc0) === 0x80 &&
                        (thirdByte & 0xc0) === 0x80
                      ) {
                        tempCodePoint =
                          ((firstByte & 0xf) << 0xc) |
                          ((secondByte & 0x3f) << 0x6) |
                          (thirdByte & 0x3f);
                        if (
                          tempCodePoint > 0x7ff &&
                          (tempCodePoint < 0xd800 || tempCodePoint > 0xdfff)
                        ) {
                          codePoint = tempCodePoint;
                        }
                      }
                      break;
                    case 4:
                      secondByte = buf[i + 1];
                      thirdByte = buf[i + 2];
                      fourthByte = buf[i + 3];
                      if (
                        (secondByte & 0xc0) === 0x80 &&
                        (thirdByte & 0xc0) === 0x80 &&
                        (fourthByte & 0xc0) === 0x80
                      ) {
                        tempCodePoint =
                          ((firstByte & 0xf) << 0x12) |
                          ((secondByte & 0x3f) << 0xc) |
                          ((thirdByte & 0x3f) << 0x6) |
                          (fourthByte & 0x3f);
                        if (
                          tempCodePoint > 0xffff &&
                          tempCodePoint < 0x110000
                        ) {
                          codePoint = tempCodePoint;
                        }
                      }
                  }
                }

                if (codePoint === null) {
                  // we did not generate a valid codePoint so insert a
                  // replacement char (U+FFFD) and advance only 1 byte
                  codePoint = 0xfffd;
                  bytesPerSequence = 1;
                } else if (codePoint > 0xffff) {
                  // encode to utf16 (surrogate pair dance)
                  codePoint -= 0x10000;
                  res.push(((codePoint >>> 10) & 0x3ff) | 0xd800);
                  codePoint = 0xdc00 | (codePoint & 0x3ff);
                }

                res.push(codePoint);
                i += bytesPerSequence;
              }

              return decodeCodePointsArray(res);
            }

            // Based on http://stackoverflow.com/a/22747272/680742, the browser with
            // the lowest limit is Chrome, with 0x10000 args.
            // We go 1 magnitude less, for safety
            var MAX_ARGUMENTS_LENGTH = 0x1000;

            function decodeCodePointsArray(codePoints) {
              var len = codePoints.length;
              if (len <= MAX_ARGUMENTS_LENGTH) {
                return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
              }

              // Decode in chunks to avoid "call stack size exceeded".
              var res = "";
              var i = 0;
              while (i < len) {
                res += String.fromCharCode.apply(
                  String,
                  codePoints.slice(i, (i += MAX_ARGUMENTS_LENGTH))
                );
              }
              return res;
            }

            function asciiSlice(buf, start, end) {
              var ret = "";
              end = Math.min(buf.length, end);

              for (var i = start; i < end; ++i) {
                ret += String.fromCharCode(buf[i] & 0x7f);
              }
              return ret;
            }

            function latin1Slice(buf, start, end) {
              var ret = "";
              end = Math.min(buf.length, end);

              for (var i = start; i < end; ++i) {
                ret += String.fromCharCode(buf[i]);
              }
              return ret;
            }

            function hexSlice(buf, start, end) {
              var len = buf.length;

              if (!start || start < 0) start = 0;
              if (!end || end < 0 || end > len) end = len;

              var out = "";
              for (var i = start; i < end; ++i) {
                out += toHex(buf[i]);
              }
              return out;
            }

            function utf16leSlice(buf, start, end) {
              var bytes = buf.slice(start, end);
              var res = "";
              for (var i = 0; i < bytes.length; i += 2) {
                res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
              }
              return res;
            }

            Buffer.prototype.slice = function slice(start, end) {
              var len = this.length;
              start = ~~start;
              end = end === undefined ? len : ~~end;

              if (start < 0) {
                start += len;
                if (start < 0) start = 0;
              } else if (start > len) {
                start = len;
              }

              if (end < 0) {
                end += len;
                if (end < 0) end = 0;
              } else if (end > len) {
                end = len;
              }

              if (end < start) end = start;

              var newBuf = this.subarray(start, end);
              // Return an augmented `Uint8Array` instance
              newBuf.__proto__ = Buffer.prototype;
              return newBuf;
            };

            /*
             * Need to make sure that buffer isn't trying to write out of bounds.
             */
            function checkOffset(offset, ext, length) {
              if (offset % 1 !== 0 || offset < 0)
                throw new RangeError("offset is not uint");
              if (offset + ext > length)
                throw new RangeError("Trying to access beyond buffer length");
            }

            Buffer.prototype.readUIntLE = function readUIntLE(
              offset,
              byteLength,
              noAssert
            ) {
              offset = offset >>> 0;
              byteLength = byteLength >>> 0;
              if (!noAssert) checkOffset(offset, byteLength, this.length);

              var val = this[offset];
              var mul = 1;
              var i = 0;
              while (++i < byteLength && (mul *= 0x100)) {
                val += this[offset + i] * mul;
              }

              return val;
            };

            Buffer.prototype.readUIntBE = function readUIntBE(
              offset,
              byteLength,
              noAssert
            ) {
              offset = offset >>> 0;
              byteLength = byteLength >>> 0;
              if (!noAssert) {
                checkOffset(offset, byteLength, this.length);
              }

              var val = this[offset + --byteLength];
              var mul = 1;
              while (byteLength > 0 && (mul *= 0x100)) {
                val += this[offset + --byteLength] * mul;
              }

              return val;
            };

            Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 1, this.length);
              return this[offset];
            };

            Buffer.prototype.readUInt16LE = function readUInt16LE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 2, this.length);
              return this[offset] | (this[offset + 1] << 8);
            };

            Buffer.prototype.readUInt16BE = function readUInt16BE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 2, this.length);
              return (this[offset] << 8) | this[offset + 1];
            };

            Buffer.prototype.readUInt32LE = function readUInt32LE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 4, this.length);

              return (
                (this[offset] |
                  (this[offset + 1] << 8) |
                  (this[offset + 2] << 16)) +
                this[offset + 3] * 0x1000000
              );
            };

            Buffer.prototype.readUInt32BE = function readUInt32BE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 4, this.length);

              return (
                this[offset] * 0x1000000 +
                ((this[offset + 1] << 16) |
                  (this[offset + 2] << 8) |
                  this[offset + 3])
              );
            };

            Buffer.prototype.readIntLE = function readIntLE(
              offset,
              byteLength,
              noAssert
            ) {
              offset = offset >>> 0;
              byteLength = byteLength >>> 0;
              if (!noAssert) checkOffset(offset, byteLength, this.length);

              var val = this[offset];
              var mul = 1;
              var i = 0;
              while (++i < byteLength && (mul *= 0x100)) {
                val += this[offset + i] * mul;
              }
              mul *= 0x80;

              if (val >= mul) val -= Math.pow(2, 8 * byteLength);

              return val;
            };

            Buffer.prototype.readIntBE = function readIntBE(
              offset,
              byteLength,
              noAssert
            ) {
              offset = offset >>> 0;
              byteLength = byteLength >>> 0;
              if (!noAssert) checkOffset(offset, byteLength, this.length);

              var i = byteLength;
              var mul = 1;
              var val = this[offset + --i];
              while (i > 0 && (mul *= 0x100)) {
                val += this[offset + --i] * mul;
              }
              mul *= 0x80;

              if (val >= mul) val -= Math.pow(2, 8 * byteLength);

              return val;
            };

            Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 1, this.length);
              if (!(this[offset] & 0x80)) return this[offset];
              return (0xff - this[offset] + 1) * -1;
            };

            Buffer.prototype.readInt16LE = function readInt16LE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 2, this.length);
              var val = this[offset] | (this[offset + 1] << 8);
              return val & 0x8000 ? val | 0xffff0000 : val;
            };

            Buffer.prototype.readInt16BE = function readInt16BE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 2, this.length);
              var val = this[offset + 1] | (this[offset] << 8);
              return val & 0x8000 ? val | 0xffff0000 : val;
            };

            Buffer.prototype.readInt32LE = function readInt32LE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 4, this.length);

              return (
                this[offset] |
                (this[offset + 1] << 8) |
                (this[offset + 2] << 16) |
                (this[offset + 3] << 24)
              );
            };

            Buffer.prototype.readInt32BE = function readInt32BE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 4, this.length);

              return (
                (this[offset] << 24) |
                (this[offset + 1] << 16) |
                (this[offset + 2] << 8) |
                this[offset + 3]
              );
            };

            Buffer.prototype.readFloatLE = function readFloatLE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 4, this.length);
              return ieee754.read(this, offset, true, 23, 4);
            };

            Buffer.prototype.readFloatBE = function readFloatBE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 4, this.length);
              return ieee754.read(this, offset, false, 23, 4);
            };

            Buffer.prototype.readDoubleLE = function readDoubleLE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 8, this.length);
              return ieee754.read(this, offset, true, 52, 8);
            };

            Buffer.prototype.readDoubleBE = function readDoubleBE(
              offset,
              noAssert
            ) {
              offset = offset >>> 0;
              if (!noAssert) checkOffset(offset, 8, this.length);
              return ieee754.read(this, offset, false, 52, 8);
            };

            function checkInt(buf, value, offset, ext, max, min) {
              if (!Buffer.isBuffer(buf))
                throw new TypeError(
                  '"buffer" argument must be a Buffer instance'
                );
              if (value > max || value < min)
                throw new RangeError('"value" argument is out of bounds');
              if (offset + ext > buf.length)
                throw new RangeError("Index out of range");
            }

            Buffer.prototype.writeUIntLE = function writeUIntLE(
              value,
              offset,
              byteLength,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              byteLength = byteLength >>> 0;
              if (!noAssert) {
                var maxBytes = Math.pow(2, 8 * byteLength) - 1;
                checkInt(this, value, offset, byteLength, maxBytes, 0);
              }

              var mul = 1;
              var i = 0;
              this[offset] = value & 0xff;
              while (++i < byteLength && (mul *= 0x100)) {
                this[offset + i] = (value / mul) & 0xff;
              }

              return offset + byteLength;
            };

            Buffer.prototype.writeUIntBE = function writeUIntBE(
              value,
              offset,
              byteLength,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              byteLength = byteLength >>> 0;
              if (!noAssert) {
                var maxBytes = Math.pow(2, 8 * byteLength) - 1;
                checkInt(this, value, offset, byteLength, maxBytes, 0);
              }

              var i = byteLength - 1;
              var mul = 1;
              this[offset + i] = value & 0xff;
              while (--i >= 0 && (mul *= 0x100)) {
                this[offset + i] = (value / mul) & 0xff;
              }

              return offset + byteLength;
            };

            Buffer.prototype.writeUInt8 = function writeUInt8(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
              this[offset] = value & 0xff;
              return offset + 1;
            };

            Buffer.prototype.writeUInt16LE = function writeUInt16LE(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
              this[offset] = value & 0xff;
              this[offset + 1] = value >>> 8;
              return offset + 2;
            };

            Buffer.prototype.writeUInt16BE = function writeUInt16BE(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
              this[offset] = value >>> 8;
              this[offset + 1] = value & 0xff;
              return offset + 2;
            };

            Buffer.prototype.writeUInt32LE = function writeUInt32LE(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
              this[offset + 3] = value >>> 24;
              this[offset + 2] = value >>> 16;
              this[offset + 1] = value >>> 8;
              this[offset] = value & 0xff;
              return offset + 4;
            };

            Buffer.prototype.writeUInt32BE = function writeUInt32BE(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
              this[offset] = value >>> 24;
              this[offset + 1] = value >>> 16;
              this[offset + 2] = value >>> 8;
              this[offset + 3] = value & 0xff;
              return offset + 4;
            };

            Buffer.prototype.writeIntLE = function writeIntLE(
              value,
              offset,
              byteLength,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) {
                var limit = Math.pow(2, 8 * byteLength - 1);

                checkInt(this, value, offset, byteLength, limit - 1, -limit);
              }

              var i = 0;
              var mul = 1;
              var sub = 0;
              this[offset] = value & 0xff;
              while (++i < byteLength && (mul *= 0x100)) {
                if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
                  sub = 1;
                }
                this[offset + i] = (((value / mul) >> 0) - sub) & 0xff;
              }

              return offset + byteLength;
            };

            Buffer.prototype.writeIntBE = function writeIntBE(
              value,
              offset,
              byteLength,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) {
                var limit = Math.pow(2, 8 * byteLength - 1);

                checkInt(this, value, offset, byteLength, limit - 1, -limit);
              }

              var i = byteLength - 1;
              var mul = 1;
              var sub = 0;
              this[offset + i] = value & 0xff;
              while (--i >= 0 && (mul *= 0x100)) {
                if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
                  sub = 1;
                }
                this[offset + i] = (((value / mul) >> 0) - sub) & 0xff;
              }

              return offset + byteLength;
            };

            Buffer.prototype.writeInt8 = function writeInt8(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
              if (value < 0) value = 0xff + value + 1;
              this[offset] = value & 0xff;
              return offset + 1;
            };

            Buffer.prototype.writeInt16LE = function writeInt16LE(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
              this[offset] = value & 0xff;
              this[offset + 1] = value >>> 8;
              return offset + 2;
            };

            Buffer.prototype.writeInt16BE = function writeInt16BE(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
              this[offset] = value >>> 8;
              this[offset + 1] = value & 0xff;
              return offset + 2;
            };

            Buffer.prototype.writeInt32LE = function writeInt32LE(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert)
                checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
              this[offset] = value & 0xff;
              this[offset + 1] = value >>> 8;
              this[offset + 2] = value >>> 16;
              this[offset + 3] = value >>> 24;
              return offset + 4;
            };

            Buffer.prototype.writeInt32BE = function writeInt32BE(
              value,
              offset,
              noAssert
            ) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert)
                checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
              if (value < 0) value = 0xffffffff + value + 1;
              this[offset] = value >>> 24;
              this[offset + 1] = value >>> 16;
              this[offset + 2] = value >>> 8;
              this[offset + 3] = value & 0xff;
              return offset + 4;
            };

            function checkIEEE754(buf, value, offset, ext, max, min) {
              if (offset + ext > buf.length)
                throw new RangeError("Index out of range");
              if (offset < 0) throw new RangeError("Index out of range");
            }

            function writeFloat(buf, value, offset, littleEndian, noAssert) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) {
                checkIEEE754(
                  buf,
                  value,
                  offset,
                  4,
                  3.4028234663852886e38,
                  -3.4028234663852886e38
                );
              }
              ieee754.write(buf, value, offset, littleEndian, 23, 4);
              return offset + 4;
            }

            Buffer.prototype.writeFloatLE = function writeFloatLE(
              value,
              offset,
              noAssert
            ) {
              return writeFloat(this, value, offset, true, noAssert);
            };

            Buffer.prototype.writeFloatBE = function writeFloatBE(
              value,
              offset,
              noAssert
            ) {
              return writeFloat(this, value, offset, false, noAssert);
            };

            function writeDouble(buf, value, offset, littleEndian, noAssert) {
              value = +value;
              offset = offset >>> 0;
              if (!noAssert) {
                checkIEEE754(
                  buf,
                  value,
                  offset,
                  8,
                  1.7976931348623157e308,
                  -1.7976931348623157e308
                );
              }
              ieee754.write(buf, value, offset, littleEndian, 52, 8);
              return offset + 8;
            }

            Buffer.prototype.writeDoubleLE = function writeDoubleLE(
              value,
              offset,
              noAssert
            ) {
              return writeDouble(this, value, offset, true, noAssert);
            };

            Buffer.prototype.writeDoubleBE = function writeDoubleBE(
              value,
              offset,
              noAssert
            ) {
              return writeDouble(this, value, offset, false, noAssert);
            };

            // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
            Buffer.prototype.copy = function copy(
              target,
              targetStart,
              start,
              end
            ) {
              if (!Buffer.isBuffer(target))
                throw new TypeError("argument should be a Buffer");
              if (!start) start = 0;
              if (!end && end !== 0) end = this.length;
              if (targetStart >= target.length) targetStart = target.length;
              if (!targetStart) targetStart = 0;
              if (end > 0 && end < start) end = start;

              // Copy 0 bytes; we're done
              if (end === start) return 0;
              if (target.length === 0 || this.length === 0) return 0;

              // Fatal error conditions
              if (targetStart < 0) {
                throw new RangeError("targetStart out of bounds");
              }
              if (start < 0 || start >= this.length)
                throw new RangeError("Index out of range");
              if (end < 0) throw new RangeError("sourceEnd out of bounds");

              // Are we oob?
              if (end > this.length) end = this.length;
              if (target.length - targetStart < end - start) {
                end = target.length - targetStart + start;
              }

              var len = end - start;

              if (
                this === target &&
                typeof Uint8Array.prototype.copyWithin === "function"
              ) {
                // Use built-in when available, missing from IE11
                this.copyWithin(targetStart, start, end);
              } else if (
                this === target &&
                start < targetStart &&
                targetStart < end
              ) {
                // descending copy from end
                for (var i = len - 1; i >= 0; --i) {
                  target[i + targetStart] = this[i + start];
                }
              } else {
                Uint8Array.prototype.set.call(
                  target,
                  this.subarray(start, end),
                  targetStart
                );
              }

              return len;
            };

            // Usage:
            //    buffer.fill(number[, offset[, end]])
            //    buffer.fill(buffer[, offset[, end]])
            //    buffer.fill(string[, offset[, end]][, encoding])
            Buffer.prototype.fill = function fill(val, start, end, encoding) {
              // Handle string cases:
              if (typeof val === "string") {
                if (typeof start === "string") {
                  encoding = start;
                  start = 0;
                  end = this.length;
                } else if (typeof end === "string") {
                  encoding = end;
                  end = this.length;
                }
                if (encoding !== undefined && typeof encoding !== "string") {
                  throw new TypeError("encoding must be a string");
                }
                if (
                  typeof encoding === "string" &&
                  !Buffer.isEncoding(encoding)
                ) {
                  throw new TypeError("Unknown encoding: " + encoding);
                }
                if (val.length === 1) {
                  var code = val.charCodeAt(0);
                  if (
                    (encoding === "utf8" && code < 128) ||
                    encoding === "latin1"
                  ) {
                    // Fast path: If `val` fits into a single byte, use that numeric value.
                    val = code;
                  }
                }
              } else if (typeof val === "number") {
                val = val & 255;
              }

              // Invalid ranges are not set to a default, so can range check early.
              if (start < 0 || this.length < start || this.length < end) {
                throw new RangeError("Out of range index");
              }

              if (end <= start) {
                return this;
              }

              start = start >>> 0;
              end = end === undefined ? this.length : end >>> 0;

              if (!val) val = 0;

              var i;
              if (typeof val === "number") {
                for (i = start; i < end; ++i) {
                  this[i] = val;
                }
              } else {
                var bytes = Buffer.isBuffer(val)
                  ? val
                  : Buffer.from(val, encoding);
                var len = bytes.length;
                if (len === 0) {
                  throw new TypeError(
                    'The value "' + val + '" is invalid for argument "value"'
                  );
                }
                for (i = 0; i < end - start; ++i) {
                  this[i + start] = bytes[i % len];
                }
              }

              return this;
            };

            // HELPER FUNCTIONS
            // ================

            var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;

            function base64clean(str) {
              // Node takes equal signs as end of the Base64 encoding
              str = str.split("=")[0];
              // Node strips out invalid characters like \n and \t from the string, base64-js does not
              str = str.trim().replace(INVALID_BASE64_RE, "");
              // Node converts strings with length < 2 to ''
              if (str.length < 2) return "";
              // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
              while (str.length % 4 !== 0) {
                str = str + "=";
              }
              return str;
            }

            function toHex(n) {
              if (n < 16) return "0" + n.toString(16);
              return n.toString(16);
            }

            function utf8ToBytes(string, units) {
              units = units || Infinity;
              var codePoint;
              var length = string.length;
              var leadSurrogate = null;
              var bytes = [];

              for (var i = 0; i < length; ++i) {
                codePoint = string.charCodeAt(i);

                // is surrogate component
                if (codePoint > 0xd7ff && codePoint < 0xe000) {
                  // last char was a lead
                  if (!leadSurrogate) {
                    // no lead yet
                    if (codePoint > 0xdbff) {
                      // unexpected trail
                      if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
                      continue;
                    } else if (i + 1 === length) {
                      // unpaired lead
                      if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
                      continue;
                    }

                    // valid lead
                    leadSurrogate = codePoint;

                    continue;
                  }

                  // 2 leads in a row
                  if (codePoint < 0xdc00) {
                    if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
                    leadSurrogate = codePoint;
                    continue;
                  }

                  // valid surrogate pair
                  codePoint =
                    (((leadSurrogate - 0xd800) << 10) | (codePoint - 0xdc00)) +
                    0x10000;
                } else if (leadSurrogate) {
                  // valid bmp char, but last char was a lead
                  if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
                }

                leadSurrogate = null;

                // encode utf8
                if (codePoint < 0x80) {
                  if ((units -= 1) < 0) break;
                  bytes.push(codePoint);
                } else if (codePoint < 0x800) {
                  if ((units -= 2) < 0) break;
                  bytes.push(
                    (codePoint >> 0x6) | 0xc0,
                    (codePoint & 0x3f) | 0x80
                  );
                } else if (codePoint < 0x10000) {
                  if ((units -= 3) < 0) break;
                  bytes.push(
                    (codePoint >> 0xc) | 0xe0,
                    ((codePoint >> 0x6) & 0x3f) | 0x80,
                    (codePoint & 0x3f) | 0x80
                  );
                } else if (codePoint < 0x110000) {
                  if ((units -= 4) < 0) break;
                  bytes.push(
                    (codePoint >> 0x12) | 0xf0,
                    ((codePoint >> 0xc) & 0x3f) | 0x80,
                    ((codePoint >> 0x6) & 0x3f) | 0x80,
                    (codePoint & 0x3f) | 0x80
                  );
                } else {
                  throw new Error("Invalid code point");
                }
              }

              return bytes;
            }

            function asciiToBytes(str) {
              var byteArray = [];
              for (var i = 0; i < str.length; ++i) {
                // Node's code seems to be doing this and not & 0x7F..
                byteArray.push(str.charCodeAt(i) & 0xff);
              }
              return byteArray;
            }

            function utf16leToBytes(str, units) {
              var c, hi, lo;
              var byteArray = [];
              for (var i = 0; i < str.length; ++i) {
                if ((units -= 2) < 0) break;

                c = str.charCodeAt(i);
                hi = c >> 8;
                lo = c % 256;
                byteArray.push(lo);
                byteArray.push(hi);
              }

              return byteArray;
            }

            function base64ToBytes(str) {
              return base64.toByteArray(base64clean(str));
            }

            function blitBuffer(src, dst, offset, length) {
              for (var i = 0; i < length; ++i) {
                if (i + offset >= dst.length || i >= src.length) break;
                dst[i + offset] = src[i];
              }
              return i;
            }

            // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
            // the `instanceof` check but they should be treated as of that type.
            // See: https://github.com/feross/buffer/issues/166
            function isInstance(obj, type) {
              return (
                obj instanceof type ||
                (obj != null &&
                  obj.constructor != null &&
                  obj.constructor.name != null &&
                  obj.constructor.name === type.name)
              );
            }
            function numberIsNaN(obj) {
              // For IE11 support
              return obj !== obj; // eslint-disable-line no-self-compare
            }
          }).call(this);
        }).call(this, require("buffer").Buffer);
      },
      { "base64-js": 2, buffer: 3, ieee754: 26 },
    ],
    4: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.hasCORS = void 0;
        // imported from https://github.com/component/has-cors
        let value = false;
        try {
          value =
            typeof XMLHttpRequest !== "undefined" &&
            "withCredentials" in new XMLHttpRequest();
        } catch (err) {
          // if XMLHttp support is disabled in IE then it will throw
          // when trying to create
        }
        exports.hasCORS = value;
      },
      {},
    ],
    5: [
      function (require, module, exports) {
        "use strict";
        // imported from https://github.com/galkn/querystring
        /**
         * Compiles a querystring
         * Returns string representation of the object
         *
         * @param {Object}
         * @api private
         */
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.decode = exports.encode = void 0;
        function encode(obj) {
          let str = "";
          for (let i in obj) {
            if (obj.hasOwnProperty(i)) {
              if (str.length) str += "&";
              str += encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]);
            }
          }
          return str;
        }
        exports.encode = encode;
        /**
         * Parses a simple querystring into an object
         *
         * @param {String} qs
         * @api private
         */
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
      },
      {},
    ],
    6: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.parse = void 0;
        // imported from https://github.com/galkn/parseuri
        /**
         * Parses an URI
         *
         * @author Steven Levithan <stevenlevithan.com> (MIT license)
         * @api private
         */
        const re =
          /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
        const parts = [
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
          "anchor",
        ];
        function parse(str) {
          const src = str,
            b = str.indexOf("["),
            e = str.indexOf("]");
          if (b != -1 && e != -1) {
            str =
              str.substring(0, b) +
              str.substring(b, e).replace(/:/g, ";") +
              str.substring(e, str.length);
          }
          let m = re.exec(str || ""),
            uri = {},
            i = 14;
          while (i--) {
            uri[parts[i]] = m[i] || "";
          }
          if (b != -1 && e != -1) {
            uri.source = src;
            uri.host = uri.host
              .substring(1, uri.host.length - 1)
              .replace(/;/g, ":");
            uri.authority = uri.authority
              .replace("[", "")
              .replace("]", "")
              .replace(/;/g, ":");
            uri.ipv6uri = true;
          }
          uri.pathNames = pathNames(uri, uri["path"]);
          uri.queryKey = queryKey(uri, uri["query"]);
          return uri;
        }
        exports.parse = parse;
        function pathNames(obj, path) {
          const regx = /\/{2,9}/g,
            names = path.replace(regx, "/").split("/");
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
          query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
            if ($1) {
              data[$1] = $2;
            }
          });
          return data;
        }
      },
      {},
    ],
    7: [
      function (require, module, exports) {
        // imported from https://github.com/unshiftio/yeast
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.yeast = exports.decode = exports.encode = void 0;
        const alphabet =
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(
              ""
            ),
          length = 64,
          map = {};
        let seed = 0,
          i = 0,
          prev;
        /**
         * Return a string representing the specified number.
         *
         * @param {Number} num The number to convert.
         * @returns {String} The string representation of the number.
         * @api public
         */
        function encode(num) {
          let encoded = "";
          do {
            encoded = alphabet[num % length] + encoded;
            num = Math.floor(num / length);
          } while (num > 0);
          return encoded;
        }
        exports.encode = encode;
        /**
         * Return the integer value specified by the given string.
         *
         * @param {String} str The string to convert.
         * @returns {Number} The integer value represented by the string.
         * @api public
         */
        function decode(str) {
          let decoded = 0;
          for (i = 0; i < str.length; i++) {
            decoded = decoded * length + map[str.charAt(i)];
          }
          return decoded;
        }
        exports.decode = decode;
        /**
         * Yeast: A tiny growing id generator.
         *
         * @returns {String} A unique id.
         * @api public
         */
        function yeast() {
          const now = encode(+new Date());
          if (now !== prev) return (seed = 0), (prev = now);
          return now + "." + encode(seed++);
        }
        exports.yeast = yeast;
        //
        // Map each character to its index.
        //
        for (; i < length; i++) map[alphabet[i]] = i;
      },
      {},
    ],
    8: [
      function (require, module, exports) {
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
      },
      {},
    ],
    9: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.nextTick =
          exports.parse =
          exports.installTimerFunctions =
          exports.transports =
          exports.Transport =
          exports.protocol =
          exports.Socket =
            void 0;
        const socket_js_1 = require("./socket.js");
        Object.defineProperty(exports, "Socket", {
          enumerable: true,
          get: function () {
            return socket_js_1.Socket;
          },
        });
        exports.protocol = socket_js_1.Socket.protocol;
        var transport_js_1 = require("./transport.js");
        Object.defineProperty(exports, "Transport", {
          enumerable: true,
          get: function () {
            return transport_js_1.Transport;
          },
        });
        var index_js_1 = require("./transports/index.js");
        Object.defineProperty(exports, "transports", {
          enumerable: true,
          get: function () {
            return index_js_1.transports;
          },
        });
        var util_js_1 = require("./util.js");
        Object.defineProperty(exports, "installTimerFunctions", {
          enumerable: true,
          get: function () {
            return util_js_1.installTimerFunctions;
          },
        });
        var parseuri_js_1 = require("./contrib/parseuri.js");
        Object.defineProperty(exports, "parse", {
          enumerable: true,
          get: function () {
            return parseuri_js_1.parse;
          },
        });
        var websocket_constructor_js_1 = require("./transports/websocket-constructor.js");
        Object.defineProperty(exports, "nextTick", {
          enumerable: true,
          get: function () {
            return websocket_constructor_js_1.nextTick;
          },
        });
      },
      {
        "./contrib/parseuri.js": 6,
        "./socket.js": 10,
        "./transport.js": 11,
        "./transports/index.js": 12,
        "./transports/websocket-constructor.js": 14,
        "./util.js": 17,
      },
    ],
    10: [
      function (require, module, exports) {
        "use strict";
        var __importDefault =
          (this && this.__importDefault) ||
          function (mod) {
            return mod && mod.__esModule ? mod : { default: mod };
          };
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.Socket = void 0;
        const index_js_1 = require("./transports/index.js");
        const util_js_1 = require("./util.js");
        const parseqs_js_1 = require("./contrib/parseqs.js");
        const parseuri_js_1 = require("./contrib/parseuri.js");
        const debug_1 = __importDefault(require("debug")); // debug()
        const component_emitter_1 = require("@socket.io/component-emitter");
        const engine_io_parser_1 = require("engine.io-parser");
        const debug = (0, debug_1.default)("engine.io-client:socket"); // debug()
        class Socket extends component_emitter_1.Emitter {
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
              if (uri.query) opts.query = uri.query;
            } else if (opts.host) {
              opts.hostname = (0, parseuri_js_1.parse)(opts.host).host;
            }
            (0, util_js_1.installTimerFunctions)(this, opts);
            this.secure =
              null != opts.secure
                ? opts.secure
                : typeof location !== "undefined" &&
                  "https:" === location.protocol;
            if (opts.hostname && !opts.port) {
              // if no port is specified manually, use the protocol default
              opts.port = this.secure ? "443" : "80";
            }
            this.hostname =
              opts.hostname ||
              (typeof location !== "undefined"
                ? location.hostname
                : "localhost");
            this.port =
              opts.port ||
              (typeof location !== "undefined" && location.port
                ? location.port
                : this.secure
                ? "443"
                : "80");
            this.transports = opts.transports || ["polling", "websocket"];
            this.readyState = "";
            this.writeBuffer = [];
            this.prevBufferLen = 0;
            this.opts = Object.assign(
              {
                path: "/engine.io",
                agent: false,
                withCredentials: false,
                upgrade: true,
                timestampParam: "t",
                rememberUpgrade: false,
                rejectUnauthorized: true,
                perMessageDeflate: {
                  threshold: 1024,
                },
                transportOptions: {},
                closeOnBeforeunload: true,
              },
              opts
            );
            this.opts.path = this.opts.path.replace(/\/$/, "") + "/";
            if (typeof this.opts.query === "string") {
              this.opts.query = (0, parseqs_js_1.decode)(this.opts.query);
            }
            // set on handshake
            this.id = null;
            this.upgrades = null;
            this.pingInterval = null;
            this.pingTimeout = null;
            // set on heartbeat
            this.pingTimeoutTimer = null;
            if (typeof addEventListener === "function") {
              if (this.opts.closeOnBeforeunload) {
                // Firefox closes the connection when the "beforeunload" event is emitted but not Chrome. This event listener
                // ensures every browser behaves the same (no "disconnect" event at the Socket.IO level when the page is
                // closed/reloaded)
                this.beforeunloadEventListener = () => {
                  if (this.transport) {
                    // silently close the transport
                    this.transport.removeAllListeners();
                    this.transport.close();
                  }
                };
                addEventListener(
                  "beforeunload",
                  this.beforeunloadEventListener,
                  false
                );
              }
              if (this.hostname !== "localhost") {
                this.offlineEventListener = () => {
                  this.onClose("transport close", {
                    description: "network connection lost",
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
            // append engine.io protocol identifier
            query.EIO = engine_io_parser_1.protocol;
            // transport name
            query.transport = name;
            // session id if we already have one
            if (this.id) query.sid = this.id;
            const opts = Object.assign(
              {},
              this.opts.transportOptions[name],
              this.opts,
              {
                query,
                socket: this,
                hostname: this.hostname,
                secure: this.secure,
                port: this.port,
              }
            );
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
            if (
              this.opts.rememberUpgrade &&
              Socket.priorWebsocketSuccess &&
              this.transports.indexOf("websocket") !== -1
            ) {
              transport = "websocket";
            } else if (0 === this.transports.length) {
              // Emit error on next tick so it can be listened to
              this.setTimeoutFn(() => {
                this.emitReserved("error", "No transports available");
              }, 0);
              return;
            } else {
              transport = this.transports[0];
            }
            this.readyState = "opening";
            // Retry with the next transport if the transport is disabled (jsonp: false)
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
            // set up transport
            this.transport = transport;
            // set up transport listeners
            transport
              .on("drain", this.onDrain.bind(this))
              .on("packet", this.onPacket.bind(this))
              .on("error", this.onError.bind(this))
              .on("close", (reason) => this.onClose("transport close", reason));
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
            Socket.priorWebsocketSuccess = false;
            const onTransportOpen = () => {
              if (failed) return;
              debug('probe transport "%s" opened', name);
              transport.send([{ type: "ping", data: "probe" }]);
              transport.once("packet", (msg) => {
                if (failed) return;
                if ("pong" === msg.type && "probe" === msg.data) {
                  debug('probe transport "%s" pong', name);
                  this.upgrading = true;
                  this.emitReserved("upgrading", transport);
                  if (!transport) return;
                  Socket.priorWebsocketSuccess = "websocket" === transport.name;
                  debug('pausing current transport "%s"', this.transport.name);
                  this.transport.pause(() => {
                    if (failed) return;
                    if ("closed" === this.readyState) return;
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
                  // @ts-ignore
                  err.transport = transport.name;
                  this.emitReserved("upgradeError", err);
                }
              });
            };
            function freezeTransport() {
              if (failed) return;
              // Any callback called by transport should be ignored since now
              failed = true;
              cleanup();
              transport.close();
              transport = null;
            }
            // Handle any error that happens while probing
            const onerror = (err) => {
              const error = new Error("probe error: " + err);
              // @ts-ignore
              error.transport = transport.name;
              freezeTransport();
              debug(
                'probe transport "%s" failed because of error: %s',
                name,
                err
              );
              this.emitReserved("upgradeError", error);
            };
            function onTransportClose() {
              onerror("transport closed");
            }
            // When the socket is closed while we're probing
            function onclose() {
              onerror("socket closed");
            }
            // When the socket is upgraded while we're probing
            function onupgrade(to) {
              if (transport && to.name !== transport.name) {
                debug('"%s" works - aborting "%s"', to.name, transport.name);
                freezeTransport();
              }
            }
            // Remove all listeners on the transport and on self
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
            Socket.priorWebsocketSuccess = "websocket" === this.transport.name;
            this.emitReserved("open");
            this.flush();
            // we check for `readyState` in case an `open`
            // listener already closed the socket
            if (
              "open" === this.readyState &&
              this.opts.upgrade &&
              this.transport.pause
            ) {
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
            if (
              "opening" === this.readyState ||
              "open" === this.readyState ||
              "closing" === this.readyState
            ) {
              debug(
                'socket receive: type "%s", data "%s"',
                packet.type,
                packet.data
              );
              this.emitReserved("packet", packet);
              // Socket is live - any packet counts
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
                  // @ts-ignore
                  err.code = packet.data;
                  this.onError(err);
                  break;
                case "message":
                  this.emitReserved("data", packet.data);
                  this.emitReserved("message", packet.data);
                  break;
              }
            } else {
              debug(
                'packet received with socket readyState "%s"',
                this.readyState
              );
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
            // In case open handler closes socket
            if ("closed" === this.readyState) return;
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
            // setting prevBufferLen = 0 is very important
            // for example, when upgrading, upgrade packet is sent over,
            // and a nonzero prevBufferLen could cause problems on `drain`
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
            if (
              "closed" !== this.readyState &&
              this.transport.writable &&
              !this.upgrading &&
              this.writeBuffer.length
            ) {
              const packets = this.getWritablePackets();
              debug("flushing %d packets in socket", packets.length);
              this.transport.send(packets);
              // keep track of current length of writeBuffer
              // splice writeBuffer and callbackBuffer on `drain`
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
            const shouldCheckPayloadSize =
              this.maxPayload &&
              this.transport.name === "polling" &&
              this.writeBuffer.length > 1;
            if (!shouldCheckPayloadSize) {
              return this.writeBuffer;
            }
            let payloadSize = 1; // first packet type
            for (let i = 0; i < this.writeBuffer.length; i++) {
              const data = this.writeBuffer[i].data;
              if (data) {
                payloadSize += (0, util_js_1.byteLength)(data);
              }
              if (i > 0 && payloadSize > this.maxPayload) {
                debug(
                  "only send %d out of %d packets",
                  i,
                  this.writeBuffer.length
                );
                return this.writeBuffer.slice(0, i);
              }
              payloadSize += 2; // separator + packet type
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
              data = undefined;
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
              type: type,
              data: data,
              options: options,
            };
            this.emitReserved("packetCreate", packet);
            this.writeBuffer.push(packet);
            if (fn) this.once("flush", fn);
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
              // wait for upgrade to finish since we can't send packets while pausing a transport
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
            Socket.priorWebsocketSuccess = false;
            this.emitReserved("error", err);
            this.onClose("transport error", err);
          }
          /**
           * Called upon transport close.
           *
           * @api private
           */
          onClose(reason, description) {
            if (
              "opening" === this.readyState ||
              "open" === this.readyState ||
              "closing" === this.readyState
            ) {
              debug('socket close with reason: "%s"', reason);
              // clear timers
              this.clearTimeoutFn(this.pingTimeoutTimer);
              // stop event from firing again for transport
              this.transport.removeAllListeners("close");
              // ensure transport won't stay open
              this.transport.close();
              // ignore further transport communication
              this.transport.removeAllListeners();
              if (typeof removeEventListener === "function") {
                removeEventListener(
                  "beforeunload",
                  this.beforeunloadEventListener,
                  false
                );
                removeEventListener(
                  "offline",
                  this.offlineEventListener,
                  false
                );
              }
              // set ready state
              this.readyState = "closed";
              // clear session id
              this.id = null;
              // emit close event
              this.emitReserved("close", reason, description);
              // clean buffers after, so users can still
              // grab the buffers on `close` event
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
        }
        exports.Socket = Socket;
        Socket.protocol = engine_io_parser_1.protocol;
      },
      {
        "./contrib/parseqs.js": 5,
        "./contrib/parseuri.js": 6,
        "./transports/index.js": 12,
        "./util.js": 17,
        "@socket.io/component-emitter": 1,
        debug: 18,
        "engine.io-parser": 25,
      },
    ],
    11: [
      function (require, module, exports) {
        "use strict";
        var __importDefault =
          (this && this.__importDefault) ||
          function (mod) {
            return mod && mod.__esModule ? mod : { default: mod };
          };
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.Transport = void 0;
        const engine_io_parser_1 = require("engine.io-parser");
        const component_emitter_1 = require("@socket.io/component-emitter");
        const util_js_1 = require("./util.js");
        const debug_1 = __importDefault(require("debug")); // debug()
        const debug = (0, debug_1.default)("engine.io-client:transport"); // debug()
        class TransportError extends Error {
          constructor(reason, description, context) {
            super(reason);
            this.description = description;
            this.context = context;
            this.type = "TransportError";
          }
        }
        class Transport extends component_emitter_1.Emitter {
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
            super.emitReserved(
              "error",
              new TransportError(reason, description, context)
            );
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
              // this might happen if the transport was silently closed in the beforeunload event handler
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
            const packet = (0, engine_io_parser_1.decodePacket)(
              data,
              this.socket.binaryType
            );
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
        }
        exports.Transport = Transport;
      },
      {
        "./util.js": 17,
        "@socket.io/component-emitter": 1,
        debug: 18,
        "engine.io-parser": 25,
      },
    ],
    12: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.transports = void 0;
        const polling_js_1 = require("./polling.js");
        const websocket_js_1 = require("./websocket.js");
        exports.transports = {
          websocket: websocket_js_1.WS,
          polling: polling_js_1.Polling,
        };
      },
      { "./polling.js": 13, "./websocket.js": 15 },
    ],
    13: [
      function (require, module, exports) {
        "use strict";
        var __importDefault =
          (this && this.__importDefault) ||
          function (mod) {
            return mod && mod.__esModule ? mod : { default: mod };
          };
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.Request = exports.Polling = void 0;
        const transport_js_1 = require("../transport.js");
        const debug_1 = __importDefault(require("debug")); // debug()
        const yeast_js_1 = require("../contrib/yeast.js");
        const parseqs_js_1 = require("../contrib/parseqs.js");
        const engine_io_parser_1 = require("engine.io-parser");
        const xmlhttprequest_js_1 = require("./xmlhttprequest.js");
        const component_emitter_1 = require("@socket.io/component-emitter");
        const util_js_1 = require("../util.js");
        const globalThis_js_1 = require("../globalThis.js");
        const debug = (0, debug_1.default)("engine.io-client:polling"); // debug()
        function empty() {}
        const hasXHR2 = (function () {
          const xhr = new xmlhttprequest_js_1.XHR({
            xdomain: false,
          });
          return null != xhr.responseType;
        })();
        class Polling extends transport_js_1.Transport {
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
              // some user agents have empty `location.port`
              if (!port) {
                port = isSSL ? "443" : "80";
              }
              this.xd =
                (typeof location !== "undefined" &&
                  opts.hostname !== location.hostname) ||
                port !== opts.port;
              this.xs = opts.secure !== isSSL;
            }
            /**
             * XHR supports binary
             */
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
                this.once("pollComplete", function () {
                  debug("pre-pause polling complete");
                  --total || pause();
                });
              }
              if (!this.writable) {
                debug("we are currently writing - waiting to pause");
                total++;
                this.once("drain", function () {
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
              // if its the first message we consider the transport open
              if ("opening" === this.readyState && packet.type === "open") {
                this.onOpen();
              }
              // if its a close packet, we close the ongoing requests
              if ("close" === packet.type) {
                this.onClose({ description: "transport closed by the server" });
                return false;
              }
              // otherwise bypass onData and handle the message
              this.onPacket(packet);
            };
            // decode payload
            (0, engine_io_parser_1.decodePayload)(
              data,
              this.socket.binaryType
            ).forEach(callback);
            // if an event did not trigger closing
            if ("closed" !== this.readyState) {
              // if we got data we're not polling
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
              // in case we're trying to close while
              // handshaking is in progress (GH-164)
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
            // cache busting is forced
            if (false !== this.opts.timestampRequests) {
              query[this.opts.timestampParam] = (0, yeast_js_1.yeast)();
            }
            if (!this.supportsBinary && !query.sid) {
              query.b64 = 1;
            }
            // avoid port if default for schema
            if (
              this.opts.port &&
              (("https" === schema && Number(this.opts.port) !== 443) ||
                ("http" === schema && Number(this.opts.port) !== 80))
            ) {
              port = ":" + this.opts.port;
            }
            const encodedQuery = (0, parseqs_js_1.encode)(query);
            const ipv6 = this.opts.hostname.indexOf(":") !== -1;
            return (
              schema +
              "://" +
              (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
              port +
              this.opts.path +
              (encodedQuery.length ? "?" + encodedQuery : "")
            );
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
              data: data,
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
        }
        exports.Polling = Polling;
        class Request extends component_emitter_1.Emitter {
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
            this.data = undefined !== opts.data ? opts.data : null;
            this.create();
          }
          /**
           * Creates the XHR object and sends the request.
           *
           * @api private
           */
          create() {
            const opts = (0, util_js_1.pick)(
              this.opts,
              "agent",
              "pfx",
              "key",
              "passphrase",
              "cert",
              "ca",
              "ciphers",
              "rejectUnauthorized",
              "autoUnref"
            );
            opts.xdomain = !!this.opts.xd;
            opts.xscheme = !!this.opts.xs;
            const xhr = (this.xhr = new xmlhttprequest_js_1.XHR(opts));
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
              } catch (e) {}
              if ("POST" === this.method) {
                try {
                  xhr.setRequestHeader(
                    "Content-type",
                    "text/plain;charset=UTF-8"
                  );
                } catch (e) {}
              }
              try {
                xhr.setRequestHeader("Accept", "*/*");
              } catch (e) {}
              // ie6 check
              if ("withCredentials" in xhr) {
                xhr.withCredentials = this.opts.withCredentials;
              }
              if (this.opts.requestTimeout) {
                xhr.timeout = this.opts.requestTimeout;
              }
              xhr.onreadystatechange = () => {
                if (4 !== xhr.readyState) return;
                if (200 === xhr.status || 1223 === xhr.status) {
                  this.onLoad();
                } else {
                  // make sure the `error` event handler that's user-set
                  // does not throw in the same tick and gets caught here
                  this.setTimeoutFn(() => {
                    this.onError(
                      typeof xhr.status === "number" ? xhr.status : 0
                    );
                  }, 0);
                }
              };
              debug("xhr data %s", this.data);
              xhr.send(this.data);
            } catch (e) {
              // Need to defer since .create() is called directly from the constructor
              // and thus the 'error' event can only be only bound *after* this exception
              // occurs.  Therefore, also, we cannot throw here at all.
              this.setTimeoutFn(() => {
                this.onError(e);
              }, 0);
              return;
            }
            if (typeof document !== "undefined") {
              this.index = Request.requestsCount++;
              Request.requests[this.index] = this;
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
              } catch (e) {}
            }
            if (typeof document !== "undefined") {
              delete Request.requests[this.index];
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
        }
        exports.Request = Request;
        Request.requestsCount = 0;
        Request.requests = {};
        /**
         * Aborts pending requests when unloading the window. This is needed to prevent
         * memory leaks (e.g. when using IE) and to ensure that no spurious error is
         * emitted.
         */
        if (typeof document !== "undefined") {
          // @ts-ignore
          if (typeof attachEvent === "function") {
            // @ts-ignore
            attachEvent("onunload", unloadHandler);
          } else if (typeof addEventListener === "function") {
            const terminationEvent =
              "onpagehide" in globalThis_js_1.globalThisShim
                ? "pagehide"
                : "unload";
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
      },
      {
        "../contrib/parseqs.js": 5,
        "../contrib/yeast.js": 7,
        "../globalThis.js": 8,
        "../transport.js": 11,
        "../util.js": 17,
        "./xmlhttprequest.js": 16,
        "@socket.io/component-emitter": 1,
        debug: 18,
        "engine.io-parser": 25,
      },
    ],
    14: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.defaultBinaryType =
          exports.usingBrowserWebSocket =
          exports.WebSocket =
          exports.nextTick =
            void 0;
        const globalThis_js_1 = require("../globalThis.js");
        exports.nextTick = (() => {
          const isPromiseAvailable =
            typeof Promise === "function" &&
            typeof Promise.resolve === "function";
          if (isPromiseAvailable) {
            return (cb) => Promise.resolve().then(cb);
          } else {
            return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
          }
        })();
        exports.WebSocket =
          globalThis_js_1.globalThisShim.WebSocket ||
          globalThis_js_1.globalThisShim.MozWebSocket;
        exports.usingBrowserWebSocket = true;
        exports.defaultBinaryType = "arraybuffer";
      },
      { "../globalThis.js": 8 },
    ],
    15: [
      function (require, module, exports) {
        (function (Buffer) {
          (function () {
            "use strict";
            var __importDefault =
              (this && this.__importDefault) ||
              function (mod) {
                return mod && mod.__esModule ? mod : { default: mod };
              };
            Object.defineProperty(exports, "__esModule", { value: true });
            exports.WS = void 0;
            const transport_js_1 = require("../transport.js");
            const parseqs_js_1 = require("../contrib/parseqs.js");
            const yeast_js_1 = require("../contrib/yeast.js");
            const util_js_1 = require("../util.js");
            const websocket_constructor_js_1 = require("./websocket-constructor.js");
            const debug_1 = __importDefault(require("debug")); // debug()
            const engine_io_parser_1 = require("engine.io-parser");
            const debug = (0, debug_1.default)("engine.io-client:websocket"); // debug()
            // detect ReactNative environment
            const isReactNative =
              typeof navigator !== "undefined" &&
              typeof navigator.product === "string" &&
              navigator.product.toLowerCase() === "reactnative";
            class WS extends transport_js_1.Transport {
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
                  // let probe timeout
                  return;
                }
                const uri = this.uri();
                const protocols = this.opts.protocols;
                // React Native only supports the 'headers' option, and will print a warning if anything else is passed
                const opts = isReactNative
                  ? {}
                  : (0, util_js_1.pick)(
                      this.opts,
                      "agent",
                      "perMessageDeflate",
                      "pfx",
                      "key",
                      "passphrase",
                      "cert",
                      "ca",
                      "ciphers",
                      "rejectUnauthorized",
                      "localAddress",
                      "protocolVersion",
                      "origin",
                      "maxPayload",
                      "family",
                      "checkServerIdentity"
                    );
                if (this.opts.extraHeaders) {
                  opts.headers = this.opts.extraHeaders;
                }
                try {
                  this.ws =
                    websocket_constructor_js_1.usingBrowserWebSocket &&
                    !isReactNative
                      ? protocols
                        ? new websocket_constructor_js_1.WebSocket(
                            uri,
                            protocols
                          )
                        : new websocket_constructor_js_1.WebSocket(uri)
                      : new websocket_constructor_js_1.WebSocket(
                          uri,
                          protocols,
                          opts
                        );
                } catch (err) {
                  return this.emitReserved("error", err);
                }
                this.ws.binaryType =
                  this.socket.binaryType ||
                  websocket_constructor_js_1.defaultBinaryType;
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
                this.ws.onclose = (closeEvent) =>
                  this.onClose({
                    description: "websocket connection closed",
                    context: closeEvent,
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
                // encodePacket efficient as it uses WS framing
                // no need for encodePayload
                for (let i = 0; i < packets.length; i++) {
                  const packet = packets[i];
                  const lastPacket = i === packets.length - 1;
                  (0, engine_io_parser_1.encodePacket)(
                    packet,
                    this.supportsBinary,
                    (data) => {
                      // always create a new object (GH-437)
                      const opts = {};
                      if (!websocket_constructor_js_1.usingBrowserWebSocket) {
                        if (packet.options) {
                          opts.compress = packet.options.compress;
                        }
                        if (this.opts.perMessageDeflate) {
                          const len =
                            // @ts-ignore
                            "string" === typeof data
                              ? Buffer.byteLength(data)
                              : data.length;
                          if (len < this.opts.perMessageDeflate.threshold) {
                            opts.compress = false;
                          }
                        }
                      }
                      // Sometimes the websocket has already been closed but the browser didn't
                      // have a chance of informing us about it yet, in that case send will
                      // throw an error
                      try {
                        if (websocket_constructor_js_1.usingBrowserWebSocket) {
                          // TypeError is thrown when passing the second argument on Safari
                          this.ws.send(data);
                        } else {
                          this.ws.send(data, opts);
                        }
                      } catch (e) {
                        debug("websocket closed before onclose event");
                      }
                      if (lastPacket) {
                        // fake drain
                        // defer to next tick to allow Socket to clear writeBuffer
                        (0, websocket_constructor_js_1.nextTick)(() => {
                          this.writable = true;
                          this.emitReserved("drain");
                        }, this.setTimeoutFn);
                      }
                    }
                  );
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
                // avoid port if default for schema
                if (
                  this.opts.port &&
                  (("wss" === schema && Number(this.opts.port) !== 443) ||
                    ("ws" === schema && Number(this.opts.port) !== 80))
                ) {
                  port = ":" + this.opts.port;
                }
                // append timestamp to URI
                if (this.opts.timestampRequests) {
                  query[this.opts.timestampParam] = (0, yeast_js_1.yeast)();
                }
                // communicate binary support capabilities
                if (!this.supportsBinary) {
                  query.b64 = 1;
                }
                const encodedQuery = (0, parseqs_js_1.encode)(query);
                const ipv6 = this.opts.hostname.indexOf(":") !== -1;
                return (
                  schema +
                  "://" +
                  (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
                  port +
                  this.opts.path +
                  (encodedQuery.length ? "?" + encodedQuery : "")
                );
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
            }
            exports.WS = WS;
          }).call(this);
        }).call(this, require("buffer").Buffer);
      },
      {
        "../contrib/parseqs.js": 5,
        "../contrib/yeast.js": 7,
        "../transport.js": 11,
        "../util.js": 17,
        "./websocket-constructor.js": 14,
        buffer: 3,
        debug: 18,
        "engine.io-parser": 25,
      },
    ],
    16: [
      function (require, module, exports) {
        "use strict";
        // browser shim for xmlhttprequest module
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.XHR = void 0;
        const has_cors_js_1 = require("../contrib/has-cors.js");
        const globalThis_js_1 = require("../globalThis.js");
        function XHR(opts) {
          const xdomain = opts.xdomain;
          // XMLHttpRequest can be disabled on IE
          try {
            if (
              "undefined" !== typeof XMLHttpRequest &&
              (!xdomain || has_cors_js_1.hasCORS)
            ) {
              return new XMLHttpRequest();
            }
          } catch (e) {}
          if (!xdomain) {
            try {
              return new globalThis_js_1.globalThisShim[
                ["Active"].concat("Object").join("X")
              ]("Microsoft.XMLHTTP");
            } catch (e) {}
          }
        }
        exports.XHR = XHR;
      },
      { "../contrib/has-cors.js": 4, "../globalThis.js": 8 },
    ],
    17: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.byteLength =
          exports.installTimerFunctions =
          exports.pick =
            void 0;
        const globalThis_js_1 = require("./globalThis.js");
        function pick(obj, ...attr) {
          return attr.reduce((acc, k) => {
            if (obj.hasOwnProperty(k)) {
              acc[k] = obj[k];
            }
            return acc;
          }, {});
        }
        exports.pick = pick;
        // Keep a reference to the real timeout functions so they can be used when overridden
        const NATIVE_SET_TIMEOUT = setTimeout;
        const NATIVE_CLEAR_TIMEOUT = clearTimeout;
        function installTimerFunctions(obj, opts) {
          if (opts.useNativeTimers) {
            obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(
              globalThis_js_1.globalThisShim
            );
            obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(
              globalThis_js_1.globalThisShim
            );
          } else {
            obj.setTimeoutFn = setTimeout.bind(globalThis_js_1.globalThisShim);
            obj.clearTimeoutFn = clearTimeout.bind(
              globalThis_js_1.globalThisShim
            );
          }
        }
        exports.installTimerFunctions = installTimerFunctions;
        // base64 encoded buffers are about 33% bigger (https://en.wikipedia.org/wiki/Base64)
        const BASE64_OVERHEAD = 1.33;
        // we could also have used `new Blob([obj]).size`, but it isn't supported in IE9
        function byteLength(obj) {
          if (typeof obj === "string") {
            return utf8Length(obj);
          }
          // arraybuffer or blob
          return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
        }
        exports.byteLength = byteLength;
        function utf8Length(str) {
          let c = 0,
            length = 0;
          for (let i = 0, l = str.length; i < l; i++) {
            c = str.charCodeAt(i);
            if (c < 0x80) {
              length += 1;
            } else if (c < 0x800) {
              length += 2;
            } else if (c < 0xd800 || c >= 0xe000) {
              length += 3;
            } else {
              i++;
              length += 4;
            }
          }
          return length;
        }
      },
      { "./globalThis.js": 8 },
    ],
    18: [
      function (require, module, exports) {
        (function (process) {
          (function () {
            /* eslint-env browser */

            /**
             * This is the web browser implementation of `debug()`.
             */

            exports.formatArgs = formatArgs;
            exports.save = save;
            exports.load = load;
            exports.useColors = useColors;
            exports.storage = localstorage();
            exports.destroy = (() => {
              let warned = false;

              return () => {
                if (!warned) {
                  warned = true;
                  console.warn(
                    "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
                  );
                }
              };
            })();

            /**
             * Colors.
             */

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
              "#FFCC33",
            ];

            /**
             * Currently only WebKit-based Web Inspectors, Firefox >= v31,
             * and the Firebug extension (any Firefox version) are known
             * to support "%c" CSS customizations.
             *
             * TODO: add a `localStorage` variable to explicitly enable/disable colors
             */

            // eslint-disable-next-line complexity
            function useColors() {
              // NB: In an Electron preload script, document will be defined but not fully
              // initialized. Since we know we're in Chrome, we'll just detect this case
              // explicitly
              if (
                typeof window !== "undefined" &&
                window.process &&
                (window.process.type === "renderer" || window.process.__nwjs)
              ) {
                return true;
              }

              // Internet Explorer and Edge do not support colors.
              if (
                typeof navigator !== "undefined" &&
                navigator.userAgent &&
                navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)
              ) {
                return false;
              }

              // Is webkit? http://stackoverflow.com/a/16459606/376773
              // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
              return (
                (typeof document !== "undefined" &&
                  document.documentElement &&
                  document.documentElement.style &&
                  document.documentElement.style.WebkitAppearance) ||
                // Is firebug? http://stackoverflow.com/a/398120/376773
                (typeof window !== "undefined" &&
                  window.console &&
                  (window.console.firebug ||
                    (window.console.exception && window.console.table))) ||
                // Is firefox >= v31?
                // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
                (typeof navigator !== "undefined" &&
                  navigator.userAgent &&
                  navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) &&
                  parseInt(RegExp.$1, 10) >= 31) ||
                // Double check webkit in userAgent just in case we are in a worker
                (typeof navigator !== "undefined" &&
                  navigator.userAgent &&
                  navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/))
              );
            }

            /**
             * Colorize log arguments if enabled.
             *
             * @api public
             */

            function formatArgs(args) {
              args[0] =
                (this.useColors ? "%c" : "") +
                this.namespace +
                (this.useColors ? " %c" : " ") +
                args[0] +
                (this.useColors ? "%c " : " ") +
                "+" +
                module.exports.humanize(this.diff);

              if (!this.useColors) {
                return;
              }

              const c = "color: " + this.color;
              args.splice(1, 0, c, "color: inherit");

              // The final "%c" is somewhat tricky, because there could be other
              // arguments passed either before or after the %c, so we need to
              // figure out the correct index to insert the CSS into
              let index = 0;
              let lastC = 0;
              args[0].replace(/%[a-zA-Z%]/g, (match) => {
                if (match === "%%") {
                  return;
                }
                index++;
                if (match === "%c") {
                  // We only are interested in the *last* %c
                  // (the user may have provided their own)
                  lastC = index;
                }
              });

              args.splice(lastC, 0, c);
            }

            /**
             * Invokes `console.debug()` when available.
             * No-op when `console.debug` is not a "function".
             * If `console.debug` is not available, falls back
             * to `console.log`.
             *
             * @api public
             */
            exports.log = console.debug || console.log || (() => {});

            /**
             * Save `namespaces`.
             *
             * @param {String} namespaces
             * @api private
             */
            function save(namespaces) {
              try {
                if (namespaces) {
                  exports.storage.setItem("debug", namespaces);
                } else {
                  exports.storage.removeItem("debug");
                }
              } catch (error) {
                // Swallow
                // XXX (@Qix-) should we be logging these?
              }
            }

            /**
             * Load `namespaces`.
             *
             * @return {String} returns the previously persisted debug modes
             * @api private
             */
            function load() {
              let r;
              try {
                r = exports.storage.getItem("debug");
              } catch (error) {
                // Swallow
                // XXX (@Qix-) should we be logging these?
              }

              // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
              if (!r && typeof process !== "undefined" && "env" in process) {
                r = process.env.DEBUG;
              }

              return r;
            }

            /**
             * Localstorage attempts to return the localstorage.
             *
             * This is necessary because safari throws
             * when a user disables cookies/localstorage
             * and you attempt to access it.
             *
             * @return {LocalStorage}
             * @api private
             */

            function localstorage() {
              try {
                // TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
                // The Browser also has localStorage in the global context.
                return localStorage;
              } catch (error) {
                // Swallow
                // XXX (@Qix-) should we be logging these?
              }
            }

            module.exports = require("./common")(exports);

            const { formatters } = module.exports;

            /**
             * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
             */

            formatters.j = function (v) {
              try {
                return JSON.stringify(v);
              } catch (error) {
                return "[UnexpectedJSONParseError]: " + error.message;
              }
            };
          }).call(this);
        }).call(this, require("_process"));
      },
      { "./common": 19, _process: 27 },
    ],
    19: [
      function (require, module, exports) {
        /**
         * This is the common logic for both the Node.js and web browser
         * implementations of `debug()`.
         */

        function setup(env) {
          createDebug.debug = createDebug;
          createDebug.default = createDebug;
          createDebug.coerce = coerce;
          createDebug.disable = disable;
          createDebug.enable = enable;
          createDebug.enabled = enabled;
          createDebug.humanize = require("ms");
          createDebug.destroy = destroy;

          Object.keys(env).forEach((key) => {
            createDebug[key] = env[key];
          });

          /**
           * The currently active debug mode names, and names to skip.
           */

          createDebug.names = [];
          createDebug.skips = [];

          /**
           * Map of special "%n" handling functions, for the debug "format" argument.
           *
           * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
           */
          createDebug.formatters = {};

          /**
           * Selects a color for a debug namespace
           * @param {String} namespace The namespace string for the debug instance to be colored
           * @return {Number|String} An ANSI color code for the given namespace
           * @api private
           */
          function selectColor(namespace) {
            let hash = 0;

            for (let i = 0; i < namespace.length; i++) {
              hash = (hash << 5) - hash + namespace.charCodeAt(i);
              hash |= 0; // Convert to 32bit integer
            }

            return createDebug.colors[
              Math.abs(hash) % createDebug.colors.length
            ];
          }
          createDebug.selectColor = selectColor;

          /**
           * Create a debugger with the given `namespace`.
           *
           * @param {String} namespace
           * @return {Function}
           * @api public
           */
          function createDebug(namespace) {
            let prevTime;
            let enableOverride = null;
            let namespacesCache;
            let enabledCache;

            function debug(...args) {
              // Disabled?
              if (!debug.enabled) {
                return;
              }

              const self = debug;

              // Set `diff` timestamp
              const curr = Number(new Date());
              const ms = curr - (prevTime || curr);
              self.diff = ms;
              self.prev = prevTime;
              self.curr = curr;
              prevTime = curr;

              args[0] = createDebug.coerce(args[0]);

              if (typeof args[0] !== "string") {
                // Anything else let's inspect with %O
                args.unshift("%O");
              }

              // Apply any `formatters` transformations
              let index = 0;
              args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
                // If we encounter an escaped % then don't increase the array index
                if (match === "%%") {
                  return "%";
                }
                index++;
                const formatter = createDebug.formatters[format];
                if (typeof formatter === "function") {
                  const val = args[index];
                  match = formatter.call(self, val);

                  // Now we need to remove `args[index]` since it's inlined in the `format`
                  args.splice(index, 1);
                  index--;
                }
                return match;
              });

              // Apply env-specific formatting (colors, etc.)
              createDebug.formatArgs.call(self, args);

              const logFn = self.log || createDebug.log;
              logFn.apply(self, args);
            }

            debug.namespace = namespace;
            debug.useColors = createDebug.useColors();
            debug.color = createDebug.selectColor(namespace);
            debug.extend = extend;
            debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

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
              },
            });

            // Env-specific initialization logic for debug instances
            if (typeof createDebug.init === "function") {
              createDebug.init(debug);
            }

            return debug;
          }

          function extend(namespace, delimiter) {
            const newDebug = createDebug(
              this.namespace +
                (typeof delimiter === "undefined" ? ":" : delimiter) +
                namespace
            );
            newDebug.log = this.log;
            return newDebug;
          }

          /**
           * Enables a debug mode by namespaces. This can include modes
           * separated by a colon and wildcards.
           *
           * @param {String} namespaces
           * @api public
           */
          function enable(namespaces) {
            createDebug.save(namespaces);
            createDebug.namespaces = namespaces;

            createDebug.names = [];
            createDebug.skips = [];

            let i;
            const split = (
              typeof namespaces === "string" ? namespaces : ""
            ).split(/[\s,]+/);
            const len = split.length;

            for (i = 0; i < len; i++) {
              if (!split[i]) {
                // ignore empty strings
                continue;
              }

              namespaces = split[i].replace(/\*/g, ".*?");

              if (namespaces[0] === "-") {
                createDebug.skips.push(
                  new RegExp("^" + namespaces.slice(1) + "$")
                );
              } else {
                createDebug.names.push(new RegExp("^" + namespaces + "$"));
              }
            }
          }

          /**
           * Disable debug output.
           *
           * @return {String} namespaces
           * @api public
           */
          function disable() {
            const namespaces = [
              ...createDebug.names.map(toNamespace),
              ...createDebug.skips
                .map(toNamespace)
                .map((namespace) => "-" + namespace),
            ].join(",");
            createDebug.enable("");
            return namespaces;
          }

          /**
           * Returns true if the given mode name is enabled, false otherwise.
           *
           * @param {String} name
           * @return {Boolean}
           * @api public
           */
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

          /**
           * Convert regexp to namespace
           *
           * @param {RegExp} regxep
           * @return {String} namespace
           * @api private
           */
          function toNamespace(regexp) {
            return regexp
              .toString()
              .substring(2, regexp.toString().length - 2)
              .replace(/\.\*\?$/, "*");
          }

          /**
           * Coerce `val`.
           *
           * @param {Mixed} val
           * @return {Mixed}
           * @api private
           */
          function coerce(val) {
            if (val instanceof Error) {
              return val.stack || val.message;
            }
            return val;
          }

          /**
           * XXX DO NOT USE. This is a temporary stub function.
           * XXX It WILL be removed in the next major release.
           */
          function destroy() {
            console.warn(
              "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
            );
          }

          createDebug.enable(createDebug.load());

          return createDebug;
        }

        module.exports = setup;
      },
      { ms: 20 },
    ],
    20: [
      function (require, module, exports) {
        /**
         * Helpers.
         */

        var s = 1000;
        var m = s * 60;
        var h = m * 60;
        var d = h * 24;
        var w = d * 7;
        var y = d * 365.25;

        /**
         * Parse or format the given `val`.
         *
         * Options:
         *
         *  - `long` verbose formatting [false]
         *
         * @param {String|Number} val
         * @param {Object} [options]
         * @throws {Error} throw an error if val is not a non-empty string or a number
         * @return {String|Number}
         * @api public
         */

        module.exports = function (val, options) {
          options = options || {};
          var type = typeof val;
          if (type === "string" && val.length > 0) {
            return parse(val);
          } else if (type === "number" && isFinite(val)) {
            return options.long ? fmtLong(val) : fmtShort(val);
          }
          throw new Error(
            "val is not a non-empty string or a valid number. val=" +
              JSON.stringify(val)
          );
        };

        /**
         * Parse the given `str` and return milliseconds.
         *
         * @param {String} str
         * @return {Number}
         * @api private
         */

        function parse(str) {
          str = String(str);
          if (str.length > 100) {
            return;
          }
          var match =
            /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
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
              return n * s;
            case "milliseconds":
            case "millisecond":
            case "msecs":
            case "msec":
            case "ms":
              return n;
            default:
              return undefined;
          }
        }

        /**
         * Short format for `ms`.
         *
         * @param {Number} ms
         * @return {String}
         * @api private
         */

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
          if (msAbs >= s) {
            return Math.round(ms / s) + "s";
          }
          return ms + "ms";
        }

        /**
         * Long format for `ms`.
         *
         * @param {Number} ms
         * @return {String}
         * @api private
         */

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
          if (msAbs >= s) {
            return plural(ms, msAbs, s, "second");
          }
          return ms + " ms";
        }

        /**
         * Pluralization helper.
         */

        function plural(ms, msAbs, n, name) {
          var isPlural = msAbs >= n * 1.5;
          return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
        }
      },
      {},
    ],
    21: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.ERROR_PACKET =
          exports.PACKET_TYPES_REVERSE =
          exports.PACKET_TYPES =
            void 0;
        const PACKET_TYPES = Object.create(null); // no Map = no polyfill
        exports.PACKET_TYPES = PACKET_TYPES;
        PACKET_TYPES["open"] = "0";
        PACKET_TYPES["close"] = "1";
        PACKET_TYPES["ping"] = "2";
        PACKET_TYPES["pong"] = "3";
        PACKET_TYPES["message"] = "4";
        PACKET_TYPES["upgrade"] = "5";
        PACKET_TYPES["noop"] = "6";
        const PACKET_TYPES_REVERSE = Object.create(null);
        exports.PACKET_TYPES_REVERSE = PACKET_TYPES_REVERSE;
        Object.keys(PACKET_TYPES).forEach((key) => {
          PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
        });
        const ERROR_PACKET = { type: "error", data: "parser error" };
        exports.ERROR_PACKET = ERROR_PACKET;
      },
      {},
    ],
    22: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.decode = exports.encode = void 0;
        const chars =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        // Use a lookup table to find the index.
        const lookup =
          typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
        for (let i = 0; i < chars.length; i++) {
          lookup[chars.charCodeAt(i)] = i;
        }
        const encode = (arraybuffer) => {
          let bytes = new Uint8Array(arraybuffer),
            i,
            len = bytes.length,
            base64 = "";
          for (i = 0; i < len; i += 3) {
            base64 += chars[bytes[i] >> 2];
            base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
            base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
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
        const decode = (base64) => {
          let bufferLength = base64.length * 0.75,
            len = base64.length,
            i,
            p = 0,
            encoded1,
            encoded2,
            encoded3,
            encoded4;
          if (base64[base64.length - 1] === "=") {
            bufferLength--;
            if (base64[base64.length - 2] === "=") {
              bufferLength--;
            }
          }
          const arraybuffer = new ArrayBuffer(bufferLength),
            bytes = new Uint8Array(arraybuffer);
          for (i = 0; i < len; i += 4) {
            encoded1 = lookup[base64.charCodeAt(i)];
            encoded2 = lookup[base64.charCodeAt(i + 1)];
            encoded3 = lookup[base64.charCodeAt(i + 2)];
            encoded4 = lookup[base64.charCodeAt(i + 3)];
            bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
            bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
            bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
          }
          return arraybuffer;
        };
        exports.decode = decode;
      },
      {},
    ],
    23: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const commons_js_1 = require("./commons.js");
        const base64_arraybuffer_js_1 = require("./contrib/base64-arraybuffer.js");
        const withNativeArrayBuffer = typeof ArrayBuffer === "function";
        const decodePacket = (encodedPacket, binaryType) => {
          if (typeof encodedPacket !== "string") {
            return {
              type: "message",
              data: mapBinary(encodedPacket, binaryType),
            };
          }
          const type = encodedPacket.charAt(0);
          if (type === "b") {
            return {
              type: "message",
              data: decodeBase64Packet(encodedPacket.substring(1), binaryType),
            };
          }
          const packetType = commons_js_1.PACKET_TYPES_REVERSE[type];
          if (!packetType) {
            return commons_js_1.ERROR_PACKET;
          }
          return encodedPacket.length > 1
            ? {
                type: commons_js_1.PACKET_TYPES_REVERSE[type],
                data: encodedPacket.substring(1),
              }
            : {
                type: commons_js_1.PACKET_TYPES_REVERSE[type],
              };
        };
        const decodeBase64Packet = (data, binaryType) => {
          if (withNativeArrayBuffer) {
            const decoded = (0, base64_arraybuffer_js_1.decode)(data);
            return mapBinary(decoded, binaryType);
          } else {
            return { base64: true, data }; // fallback for old browsers
          }
        };
        const mapBinary = (data, binaryType) => {
          switch (binaryType) {
            case "blob":
              return data instanceof ArrayBuffer ? new Blob([data]) : data;
            case "arraybuffer":
            default:
              return data; // assuming the data is already an ArrayBuffer
          }
        };
        exports.default = decodePacket;
      },
      { "./commons.js": 21, "./contrib/base64-arraybuffer.js": 22 },
    ],
    24: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const commons_js_1 = require("./commons.js");
        const withNativeBlob =
          typeof Blob === "function" ||
          (typeof Blob !== "undefined" &&
            Object.prototype.toString.call(Blob) ===
              "[object BlobConstructor]");
        const withNativeArrayBuffer = typeof ArrayBuffer === "function";
        // ArrayBuffer.isView method is not defined in IE10
        const isView = (obj) => {
          return typeof ArrayBuffer.isView === "function"
            ? ArrayBuffer.isView(obj)
            : obj && obj.buffer instanceof ArrayBuffer;
        };
        const encodePacket = ({ type, data }, supportsBinary, callback) => {
          if (withNativeBlob && data instanceof Blob) {
            if (supportsBinary) {
              return callback(data);
            } else {
              return encodeBlobAsBase64(data, callback);
            }
          } else if (
            withNativeArrayBuffer &&
            (data instanceof ArrayBuffer || isView(data))
          ) {
            if (supportsBinary) {
              return callback(data);
            } else {
              return encodeBlobAsBase64(new Blob([data]), callback);
            }
          }
          // plain string
          return callback(commons_js_1.PACKET_TYPES[type] + (data || ""));
        };
        const encodeBlobAsBase64 = (data, callback) => {
          const fileReader = new FileReader();
          fileReader.onload = function () {
            const content = fileReader.result.split(",")[1];
            callback("b" + content);
          };
          return fileReader.readAsDataURL(data);
        };
        exports.default = encodePacket;
      },
      { "./commons.js": 21 },
    ],
    25: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.decodePayload =
          exports.decodePacket =
          exports.encodePayload =
          exports.encodePacket =
          exports.protocol =
            void 0;
        const encodePacket_js_1 = require("./encodePacket.js");
        exports.encodePacket = encodePacket_js_1.default;
        const decodePacket_js_1 = require("./decodePacket.js");
        exports.decodePacket = decodePacket_js_1.default;
        const SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text
        const encodePayload = (packets, callback) => {
          // some packets may be added to the array while encoding, so the initial length must be saved
          const length = packets.length;
          const encodedPackets = new Array(length);
          let count = 0;
          packets.forEach((packet, i) => {
            // force base64 encoding for binary packets
            (0, encodePacket_js_1.default)(packet, false, (encodedPacket) => {
              encodedPackets[i] = encodedPacket;
              if (++count === length) {
                callback(encodedPackets.join(SEPARATOR));
              }
            });
          });
        };
        exports.encodePayload = encodePayload;
        const decodePayload = (encodedPayload, binaryType) => {
          const encodedPackets = encodedPayload.split(SEPARATOR);
          const packets = [];
          for (let i = 0; i < encodedPackets.length; i++) {
            const decodedPacket = (0, decodePacket_js_1.default)(
              encodedPackets[i],
              binaryType
            );
            packets.push(decodedPacket);
            if (decodedPacket.type === "error") {
              break;
            }
          }
          return packets;
        };
        exports.decodePayload = decodePayload;
        exports.protocol = 4;
      },
      { "./decodePacket.js": 23, "./encodePacket.js": 24 },
    ],
    26: [
      function (require, module, exports) {
        /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
        exports.read = function (buffer, offset, isLE, mLen, nBytes) {
          var e, m;
          var eLen = nBytes * 8 - mLen - 1;
          var eMax = (1 << eLen) - 1;
          var eBias = eMax >> 1;
          var nBits = -7;
          var i = isLE ? nBytes - 1 : 0;
          var d = isLE ? -1 : 1;
          var s = buffer[offset + i];

          i += d;

          e = s & ((1 << -nBits) - 1);
          s >>= -nBits;
          nBits += eLen;
          for (
            ;
            nBits > 0;
            e = e * 256 + buffer[offset + i], i += d, nBits -= 8
          ) {}

          m = e & ((1 << -nBits) - 1);
          e >>= -nBits;
          nBits += mLen;
          for (
            ;
            nBits > 0;
            m = m * 256 + buffer[offset + i], i += d, nBits -= 8
          ) {}

          if (e === 0) {
            e = 1 - eBias;
          } else if (e === eMax) {
            return m ? NaN : (s ? -1 : 1) * Infinity;
          } else {
            m = m + Math.pow(2, mLen);
            e = e - eBias;
          }
          return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
        };

        exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
          var e, m, c;
          var eLen = nBytes * 8 - mLen - 1;
          var eMax = (1 << eLen) - 1;
          var eBias = eMax >> 1;
          var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
          var i = isLE ? 0 : nBytes - 1;
          var d = isLE ? 1 : -1;
          var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

          value = Math.abs(value);

          if (isNaN(value) || value === Infinity) {
            m = isNaN(value) ? 1 : 0;
            e = eMax;
          } else {
            e = Math.floor(Math.log(value) / Math.LN2);
            if (value * (c = Math.pow(2, -e)) < 1) {
              e--;
              c *= 2;
            }
            if (e + eBias >= 1) {
              value += rt / c;
            } else {
              value += rt * Math.pow(2, 1 - eBias);
            }
            if (value * c >= 2) {
              e++;
              c /= 2;
            }

            if (e + eBias >= eMax) {
              m = 0;
              e = eMax;
            } else if (e + eBias >= 1) {
              m = (value * c - 1) * Math.pow(2, mLen);
              e = e + eBias;
            } else {
              m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
              e = 0;
            }
          }

          for (
            ;
            mLen >= 8;
            buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8
          ) {}

          e = (e << mLen) | m;
          eLen += mLen;
          for (
            ;
            eLen > 0;
            buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8
          ) {}

          buffer[offset + i - d] |= s * 128;
        };
      },
      {},
    ],
    27: [
      function (require, module, exports) {
        // shim for using process in browser
        var process = (module.exports = {});

        // cached from whatever global is present so that test runners that stub it
        // don't break things.  But we need to wrap it in a try catch in case it is
        // wrapped in strict mode code which doesn't define any globals.  It's inside a
        // function because try/catches deoptimize in certain engines.

        var cachedSetTimeout;
        var cachedClearTimeout;

        function defaultSetTimout() {
          throw new Error("setTimeout has not been defined");
        }
        function defaultClearTimeout() {
          throw new Error("clearTimeout has not been defined");
        }
        (function () {
          try {
            if (typeof setTimeout === "function") {
              cachedSetTimeout = setTimeout;
            } else {
              cachedSetTimeout = defaultSetTimout;
            }
          } catch (e) {
            cachedSetTimeout = defaultSetTimout;
          }
          try {
            if (typeof clearTimeout === "function") {
              cachedClearTimeout = clearTimeout;
            } else {
              cachedClearTimeout = defaultClearTimeout;
            }
          } catch (e) {
            cachedClearTimeout = defaultClearTimeout;
          }
        })();
        function runTimeout(fun) {
          if (cachedSetTimeout === setTimeout) {
            //normal enviroments in sane situations
            return setTimeout(fun, 0);
          }
          // if setTimeout wasn't available but was latter defined
          if (
            (cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) &&
            setTimeout
          ) {
            cachedSetTimeout = setTimeout;
            return setTimeout(fun, 0);
          }
          try {
            // when when somebody has screwed with setTimeout but no I.E. maddness
            return cachedSetTimeout(fun, 0);
          } catch (e) {
            try {
              // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
              return cachedSetTimeout.call(null, fun, 0);
            } catch (e) {
              // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
              return cachedSetTimeout.call(this, fun, 0);
            }
          }
        }
        function runClearTimeout(marker) {
          if (cachedClearTimeout === clearTimeout) {
            //normal enviroments in sane situations
            return clearTimeout(marker);
          }
          // if clearTimeout wasn't available but was latter defined
          if (
            (cachedClearTimeout === defaultClearTimeout ||
              !cachedClearTimeout) &&
            clearTimeout
          ) {
            cachedClearTimeout = clearTimeout;
            return clearTimeout(marker);
          }
          try {
            // when when somebody has screwed with setTimeout but no I.E. maddness
            return cachedClearTimeout(marker);
          } catch (e) {
            try {
              // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
              return cachedClearTimeout.call(null, marker);
            } catch (e) {
              // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
              // Some versions of I.E. have different rules for clearTimeout vs setTimeout
              return cachedClearTimeout.call(this, marker);
            }
          }
        }
        var queue = [];
        var draining = false;
        var currentQueue;
        var queueIndex = -1;

        function cleanUpNextTick() {
          if (!draining || !currentQueue) {
            return;
          }
          draining = false;
          if (currentQueue.length) {
            queue = currentQueue.concat(queue);
          } else {
            queueIndex = -1;
          }
          if (queue.length) {
            drainQueue();
          }
        }

        function drainQueue() {
          if (draining) {
            return;
          }
          var timeout = runTimeout(cleanUpNextTick);
          draining = true;

          var len = queue.length;
          while (len) {
            currentQueue = queue;
            queue = [];
            while (++queueIndex < len) {
              if (currentQueue) {
                currentQueue[queueIndex].run();
              }
            }
            queueIndex = -1;
            len = queue.length;
          }
          currentQueue = null;
          draining = false;
          runClearTimeout(timeout);
        }

        process.nextTick = function (fun) {
          var args = new Array(arguments.length - 1);
          if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
              args[i - 1] = arguments[i];
            }
          }
          queue.push(new Item(fun, args));
          if (queue.length === 1 && !draining) {
            runTimeout(drainQueue);
          }
        };

        // v8 likes predictible objects
        function Item(fun, array) {
          this.fun = fun;
          this.array = array;
        }
        Item.prototype.run = function () {
          this.fun.apply(null, this.array);
        };
        process.title = "browser";
        process.browser = true;
        process.env = {};
        process.argv = [];
        process.version = ""; // empty string to avoid regexp issues
        process.versions = {};

        function noop() {}

        process.on = noop;
        process.addListener = noop;
        process.once = noop;
        process.off = noop;
        process.removeListener = noop;
        process.removeAllListeners = noop;
        process.emit = noop;
        process.prependListener = noop;
        process.prependOnceListener = noop;

        process.listeners = function (name) {
          return [];
        };

        process.binding = function (name) {
          throw new Error("process.binding is not supported");
        };

        process.cwd = function () {
          return "/";
        };
        process.chdir = function (dir) {
          throw new Error("process.chdir is not supported");
        };
        process.umask = function () {
          return 0;
        };
      },
      {},
    ],
    28: [
      function (require, module, exports) {
        "use strict";
        /**
         * Initialize backoff timer with `opts`.
         *
         * - `min` initial timeout in milliseconds [100]
         * - `max` max timeout [10000]
         * - `jitter` [0]
         * - `factor` [2]
         *
         * @param {Object} opts
         * @api public
         */
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.Backoff = void 0;
        function Backoff(opts) {
          opts = opts || {};
          this.ms = opts.min || 100;
          this.max = opts.max || 10000;
          this.factor = opts.factor || 2;
          this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
          this.attempts = 0;
        }
        exports.Backoff = Backoff;
        /**
         * Return the backoff duration.
         *
         * @return {Number}
         * @api public
         */
        Backoff.prototype.duration = function () {
          var ms = this.ms * Math.pow(this.factor, this.attempts++);
          if (this.jitter) {
            var rand = Math.random();
            var deviation = Math.floor(rand * this.jitter * ms);
            ms =
              (Math.floor(rand * 10) & 1) == 0
                ? ms - deviation
                : ms + deviation;
          }
          return Math.min(ms, this.max) | 0;
        };
        /**
         * Reset the number of attempts.
         *
         * @api public
         */
        Backoff.prototype.reset = function () {
          this.attempts = 0;
        };
        /**
         * Set the minimum duration
         *
         * @api public
         */
        Backoff.prototype.setMin = function (min) {
          this.ms = min;
        };
        /**
         * Set the maximum duration
         *
         * @api public
         */
        Backoff.prototype.setMax = function (max) {
          this.max = max;
        };
        /**
         * Set the jitter
         *
         * @api public
         */
        Backoff.prototype.setJitter = function (jitter) {
          this.jitter = jitter;
        };
      },
      {},
    ],
    29: [
      function (require, module, exports) {
        "use strict";
        var __importDefault =
          (this && this.__importDefault) ||
          function (mod) {
            return mod && mod.__esModule ? mod : { default: mod };
          };
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.default =
          exports.connect =
          exports.io =
          exports.Socket =
          exports.Manager =
          exports.protocol =
            void 0;
        const url_js_1 = require("./url.js");
        const manager_js_1 = require("./manager.js");
        Object.defineProperty(exports, "Manager", {
          enumerable: true,
          get: function () {
            return manager_js_1.Manager;
          },
        });
        const socket_js_1 = require("./socket.js");
        Object.defineProperty(exports, "Socket", {
          enumerable: true,
          get: function () {
            return socket_js_1.Socket;
          },
        });
        const debug_1 = __importDefault(require("debug")); // debug()
        const debug = debug_1.default("socket.io-client"); // debug()
        /**
         * Managers cache.
         */
        const cache = {};
        function lookup(uri, opts) {
          if (typeof uri === "object") {
            opts = uri;
            uri = undefined;
          }
          opts = opts || {};
          const parsed = url_js_1.url(uri, opts.path || "/socket.io");
          const source = parsed.source;
          const id = parsed.id;
          const path = parsed.path;
          const sameNamespace = cache[id] && path in cache[id]["nsps"];
          const newConnection =
            opts.forceNew ||
            opts["force new connection"] ||
            false === opts.multiplex ||
            sameNamespace;
          let io;
          if (newConnection) {
            debug("ignoring socket cache for %s", source);
            io = new manager_js_1.Manager(source, opts);
          } else {
            if (!cache[id]) {
              debug("new io instance for %s", source);
              cache[id] = new manager_js_1.Manager(source, opts);
            }
            io = cache[id];
          }
          if (parsed.query && !opts.query) {
            opts.query = parsed.queryKey;
          }
          return io.socket(parsed.path, opts);
        }
        exports.io = lookup;
        exports.connect = lookup;
        exports.default = lookup;
        // so that "lookup" can be used both as a function (e.g. `io(...)`) and as a
        // namespace (e.g. `io.connect(...)`), for backward compatibility
        Object.assign(lookup, {
          Manager: manager_js_1.Manager,
          Socket: socket_js_1.Socket,
          io: lookup,
          connect: lookup,
        });
        /**
         * Protocol version.
         *
         * @public
         */
        var socket_io_parser_1 = require("socket.io-parser");
        Object.defineProperty(exports, "protocol", {
          enumerable: true,
          get: function () {
            return socket_io_parser_1.protocol;
          },
        });

        module.exports = lookup;
      },
      {
        "./manager.js": 30,
        "./socket.js": 32,
        "./url.js": 33,
        debug: 34,
        "socket.io-parser": 38,
      },
    ],
    30: [
      function (require, module, exports) {
        "use strict";
        var __createBinding =
          (this && this.__createBinding) ||
          (Object.create
            ? function (o, m, k, k2) {
                if (k2 === undefined) k2 = k;
                Object.defineProperty(o, k2, {
                  enumerable: true,
                  get: function () {
                    return m[k];
                  },
                });
              }
            : function (o, m, k, k2) {
                if (k2 === undefined) k2 = k;
                o[k2] = m[k];
              });
        var __setModuleDefault =
          (this && this.__setModuleDefault) ||
          (Object.create
            ? function (o, v) {
                Object.defineProperty(o, "default", {
                  enumerable: true,
                  value: v,
                });
              }
            : function (o, v) {
                o["default"] = v;
              });
        var __importStar =
          (this && this.__importStar) ||
          function (mod) {
            if (mod && mod.__esModule) return mod;
            var result = {};
            if (mod != null)
              for (var k in mod)
                if (
                  k !== "default" &&
                  Object.prototype.hasOwnProperty.call(mod, k)
                )
                  __createBinding(result, mod, k);
            __setModuleDefault(result, mod);
            return result;
          };
        var __importDefault =
          (this && this.__importDefault) ||
          function (mod) {
            return mod && mod.__esModule ? mod : { default: mod };
          };
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.Manager = void 0;
        const engine_io_client_1 = require("engine.io-client");
        const socket_js_1 = require("./socket.js");
        const parser = __importStar(require("socket.io-parser"));
        const on_js_1 = require("./on.js");
        const backo2_js_1 = require("./contrib/backo2.js");
        const component_emitter_1 = require("@socket.io/component-emitter");
        const debug_1 = __importDefault(require("debug")); // debug()
        const debug = debug_1.default("socket.io-client:manager"); // debug()
        class Manager extends component_emitter_1.Emitter {
          constructor(uri, opts) {
            var _a;
            super();
            this.nsps = {};
            this.subs = [];
            if (uri && "object" === typeof uri) {
              opts = uri;
              uri = undefined;
            }
            opts = opts || {};
            opts.path = opts.path || "/socket.io";
            this.opts = opts;
            engine_io_client_1.installTimerFunctions(this, opts);
            this.reconnection(opts.reconnection !== false);
            this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
            this.reconnectionDelay(opts.reconnectionDelay || 1000);
            this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
            this.randomizationFactor(
              (_a = opts.randomizationFactor) !== null && _a !== void 0
                ? _a
                : 0.5
            );
            this.backoff = new backo2_js_1.Backoff({
              min: this.reconnectionDelay(),
              max: this.reconnectionDelayMax(),
              jitter: this.randomizationFactor(),
            });
            this.timeout(null == opts.timeout ? 20000 : opts.timeout);
            this._readyState = "closed";
            this.uri = uri;
            const _parser = opts.parser || parser;
            this.encoder = new _parser.Encoder();
            this.decoder = new _parser.Decoder();
            this._autoConnect = opts.autoConnect !== false;
            if (this._autoConnect) this.open();
          }
          reconnection(v) {
            if (!arguments.length) return this._reconnection;
            this._reconnection = !!v;
            return this;
          }
          reconnectionAttempts(v) {
            if (v === undefined) return this._reconnectionAttempts;
            this._reconnectionAttempts = v;
            return this;
          }
          reconnectionDelay(v) {
            var _a;
            if (v === undefined) return this._reconnectionDelay;
            this._reconnectionDelay = v;
            (_a = this.backoff) === null || _a === void 0
              ? void 0
              : _a.setMin(v);
            return this;
          }
          randomizationFactor(v) {
            var _a;
            if (v === undefined) return this._randomizationFactor;
            this._randomizationFactor = v;
            (_a = this.backoff) === null || _a === void 0
              ? void 0
              : _a.setJitter(v);
            return this;
          }
          reconnectionDelayMax(v) {
            var _a;
            if (v === undefined) return this._reconnectionDelayMax;
            this._reconnectionDelayMax = v;
            (_a = this.backoff) === null || _a === void 0
              ? void 0
              : _a.setMax(v);
            return this;
          }
          timeout(v) {
            if (!arguments.length) return this._timeout;
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
            // Only try to reconnect if it's the first time we're connecting
            if (
              !this._reconnecting &&
              this._reconnection &&
              this.backoff.attempts === 0
            ) {
              // keeps reconnection from firing twice for the same reconnection loop
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
            if (~this._readyState.indexOf("open")) return this;
            debug("opening %s", this.uri);
            this.engine = new engine_io_client_1.Socket(this.uri, this.opts);
            const socket = this.engine;
            const self = this;
            this._readyState = "opening";
            this.skipReconnect = false;
            // emit `open`
            const openSubDestroy = on_js_1.on(socket, "open", function () {
              self.onopen();
              fn && fn();
            });
            // emit `error`
            const errorSub = on_js_1.on(socket, "error", (err) => {
              debug("error");
              self.cleanup();
              self._readyState = "closed";
              this.emitReserved("error", err);
              if (fn) {
                fn(err);
              } else {
                // Only do this if there is no fn to handle the error
                self.maybeReconnectOnOpen();
              }
            });
            if (false !== this._timeout) {
              const timeout = this._timeout;
              debug("connect attempt will timeout after %d", timeout);
              if (timeout === 0) {
                openSubDestroy(); // prevents a race condition with the 'open' event
              }
              // set timer
              const timer = this.setTimeoutFn(() => {
                debug("connect attempt timed out after %d", timeout);
                openSubDestroy();
                socket.close();
                // @ts-ignore
                socket.emit("error", new Error("timeout"));
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
            // clear old subs
            this.cleanup();
            // mark as open
            this._readyState = "open";
            this.emitReserved("open");
            // add new subs
            const socket = this.engine;
            this.subs.push(
              on_js_1.on(socket, "ping", this.onping.bind(this)),
              on_js_1.on(socket, "data", this.ondata.bind(this)),
              on_js_1.on(socket, "error", this.onerror.bind(this)),
              on_js_1.on(socket, "close", this.onclose.bind(this)),
              on_js_1.on(this.decoder, "decoded", this.ondecoded.bind(this))
            );
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
            // the nextTick call prevents an exception in a user-provided event listener from triggering a disconnection due to a "parse error"
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
            let socket = this.nsps[nsp];
            if (!socket) {
              socket = new socket_js_1.Socket(this, nsp, opts);
              this.nsps[nsp] = socket;
            }
            return socket;
          }
          /**
           * Called upon a socket close.
           *
           * @param socket
           * @private
           */
          _destroy(socket) {
            const nsps = Object.keys(this.nsps);
            for (const nsp of nsps) {
              const socket = this.nsps[nsp];
              if (socket.active) {
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
            if (this.engine) this.engine.close();
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
            if (this._reconnecting || this.skipReconnect) return this;
            const self = this;
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
                if (self.skipReconnect) return;
                debug("attempting reconnect");
                this.emitReserved("reconnect_attempt", self.backoff.attempts);
                // check again for the case socket closed in above events
                if (self.skipReconnect) return;
                self.open((err) => {
                  if (err) {
                    debug("reconnect attempt error");
                    self._reconnecting = false;
                    self.reconnect();
                    this.emitReserved("reconnect_error", err);
                  } else {
                    debug("reconnect success");
                    self.onreconnect();
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
        }
        exports.Manager = Manager;
      },
      {
        "./contrib/backo2.js": 28,
        "./on.js": 31,
        "./socket.js": 32,
        "@socket.io/component-emitter": 1,
        debug: 34,
        "engine.io-client": 9,
        "socket.io-parser": 38,
      },
    ],
    31: [
      function (require, module, exports) {
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
      },
      {},
    ],
    32: [
      function (require, module, exports) {
        "use strict";
        var __importDefault =
          (this && this.__importDefault) ||
          function (mod) {
            return mod && mod.__esModule ? mod : { default: mod };
          };
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.Socket = void 0;
        const socket_io_parser_1 = require("socket.io-parser");
        const on_js_1 = require("./on.js");
        const component_emitter_1 = require("@socket.io/component-emitter");
        const debug_1 = __importDefault(require("debug")); // debug()
        const debug = debug_1.default("socket.io-client:socket"); // debug()
        /**
         * Internal events.
         * These events can't be emitted by the user.
         */
        const RESERVED_EVENTS = Object.freeze({
          connect: 1,
          connect_error: 1,
          disconnect: 1,
          disconnecting: 1,
          // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
          newListener: 1,
          removeListener: 1,
        });
        /**
         * A Socket is the fundamental class for interacting with the server.
         *
         * A Socket belongs to a certain Namespace (by default /) and uses an underlying {@link Manager} to communicate.
         *
         * @example
         * const socket = io();
         *
         * socket.on("connect", () => {
         *   console.log("connected");
         * });
         *
         * // send an event to the server
         * socket.emit("foo", "bar");
         *
         * socket.on("foobar", () => {
         *   // an event was received from the server
         * });
         *
         * // upon disconnection
         * socket.on("disconnect", (reason) => {
         *   console.log(`disconnected due to ${reason}`);
         * });
         */
        class Socket extends component_emitter_1.Emitter {
          /**
           * `Socket` constructor.
           */
          constructor(io, nsp, opts) {
            super();
            /**
             * Whether the socket is currently connected to the server.
             *
             * @example
             * const socket = io();
             *
             * socket.on("connect", () => {
             *   console.log(socket.connected); // true
             * });
             *
             * socket.on("disconnect", () => {
             *   console.log(socket.connected); // false
             * });
             */
            this.connected = false;
            /**
             * Buffer for packets received before the CONNECT packet
             */
            this.receiveBuffer = [];
            /**
             * Buffer for packets that will be sent once the socket is connected
             */
            this.sendBuffer = [];
            this.ids = 0;
            this.acks = {};
            this.flags = {};
            this.io = io;
            this.nsp = nsp;
            if (opts && opts.auth) {
              this.auth = opts.auth;
            }
            if (this.io._autoConnect) this.open();
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
            if (this.subs) return;
            const io = this.io;
            this.subs = [
              on_js_1.on(io, "open", this.onopen.bind(this)),
              on_js_1.on(io, "packet", this.onpacket.bind(this)),
              on_js_1.on(io, "error", this.onerror.bind(this)),
              on_js_1.on(io, "close", this.onclose.bind(this)),
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
            if (this.connected) return this;
            this.subEvents();
            if (!this.io["_reconnecting"]) this.io.open(); // ensure open
            if ("open" === this.io._readyState) this.onopen();
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
              throw new Error(
                '"' + ev.toString() + '" is a reserved event name'
              );
            }
            args.unshift(ev);
            const packet = {
              type: socket_io_parser_1.PacketType.EVENT,
              data: args,
            };
            packet.options = {};
            packet.options.compress = this.flags.compress !== false;
            // event ack callback
            if ("function" === typeof args[args.length - 1]) {
              const id = this.ids++;
              debug("emitting packet with ack id %d", id);
              const ack = args.pop();
              this._registerAckCallback(id, ack);
              packet.id = id;
            }
            const isTransportWritable =
              this.io.engine &&
              this.io.engine.transport &&
              this.io.engine.transport.writable;
            const discardPacket =
              this.flags.volatile && (!isTransportWritable || !this.connected);
            if (discardPacket) {
              debug(
                "discard packet as the transport is not currently writable"
              );
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
            if (timeout === undefined) {
              this.acks[id] = ack;
              return;
            }
            // @ts-ignore
            const timer = this.io.setTimeoutFn(() => {
              delete this.acks[id];
              for (let i = 0; i < this.sendBuffer.length; i++) {
                if (this.sendBuffer[i].id === id) {
                  debug("removing packet with ack id %d from the buffer", id);
                  this.sendBuffer.splice(i, 1);
                }
              }
              debug(
                "event with ack id %d has timed out after %d ms",
                id,
                timeout
              );
              ack.call(this, new Error("operation has timed out"));
            }, timeout);
            this.acks[id] = (...args) => {
              // @ts-ignore
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
                this.packet({
                  type: socket_io_parser_1.PacketType.CONNECT,
                  data,
                });
              });
            } else {
              this.packet({
                type: socket_io_parser_1.PacketType.CONNECT,
                data: this.auth,
              });
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
            if (!sameNamespace) return;
            switch (packet.type) {
              case socket_io_parser_1.PacketType.CONNECT:
                if (packet.data && packet.data.sid) {
                  const id = packet.data.sid;
                  this.onconnect(id);
                } else {
                  this.emitReserved(
                    "connect_error",
                    new Error(
                      "It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"
                    )
                  );
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
                // @ts-ignore
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
            const self = this;
            let sent = false;
            return function (...args) {
              // prevent double callbacks
              if (sent) return;
              sent = true;
              debug("sending ack %j", args);
              self.packet({
                type: socket_io_parser_1.PacketType.ACK,
                id: id,
                data: args,
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
              // clean subscriptions to avoid reconnections
              this.subs.forEach((subDestroy) => subDestroy());
              this.subs = undefined;
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
            // remove socket from pool
            this.destroy();
            if (this.connected) {
              // fire events
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
            if (
              this._anyOutgoingListeners &&
              this._anyOutgoingListeners.length
            ) {
              const listeners = this._anyOutgoingListeners.slice();
              for (const listener of listeners) {
                listener.apply(this, packet.data);
              }
            }
          }
        }
        exports.Socket = Socket;
      },
      {
        "./on.js": 31,
        "@socket.io/component-emitter": 1,
        debug: 34,
        "socket.io-parser": 38,
      },
    ],
    33: [
      function (require, module, exports) {
        "use strict";
        var __importDefault =
          (this && this.__importDefault) ||
          function (mod) {
            return mod && mod.__esModule ? mod : { default: mod };
          };
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.url = void 0;
        const engine_io_client_1 = require("engine.io-client");
        const debug_1 = __importDefault(require("debug")); // debug()
        const debug = debug_1.default("socket.io-client:url"); // debug()
        /**
         * URL parser.
         *
         * @param uri - url
         * @param path - the request path of the connection
         * @param loc - An object meant to mimic window.location.
         *        Defaults to window.location.
         * @public
         */
        function url(uri, path = "", loc) {
          let obj = uri;
          // default to window.location
          loc = loc || (typeof location !== "undefined" && location);
          if (null == uri) uri = loc.protocol + "//" + loc.host;
          // relative path support
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
            // parse
            debug("parse %s", uri);
            obj = engine_io_client_1.parse(uri);
          }
          // make sure we treat `localhost:80` and `localhost` equally
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
          // define unique id
          obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
          // define href
          obj.href =
            obj.protocol +
            "://" +
            host +
            (loc && loc.port === obj.port ? "" : ":" + obj.port);
          return obj;
        }
        exports.url = url;
      },
      { debug: 34, "engine.io-client": 9 },
    ],
    34: [
      function (require, module, exports) {
        arguments[4][18][0].apply(exports, arguments);
      },
      { "./common": 35, _process: 27, dup: 18 },
    ],
    35: [
      function (require, module, exports) {
        arguments[4][19][0].apply(exports, arguments);
      },
      { dup: 19, ms: 36 },
    ],
    36: [
      function (require, module, exports) {
        arguments[4][20][0].apply(exports, arguments);
      },
      { dup: 20 },
    ],
    37: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.reconstructPacket = exports.deconstructPacket = void 0;
        const is_binary_js_1 = require("./is-binary.js");
        /**
         * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
         *
         * @param {Object} packet - socket.io event packet
         * @return {Object} with deconstructed packet and list of buffers
         * @public
         */
        function deconstructPacket(packet) {
          const buffers = [];
          const packetData = packet.data;
          const pack = packet;
          pack.data = _deconstructPacket(packetData, buffers);
          pack.attachments = buffers.length; // number of binary 'attachments'
          return { packet: pack, buffers: buffers };
        }
        exports.deconstructPacket = deconstructPacket;
        function _deconstructPacket(data, buffers) {
          if (!data) return data;
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
        /**
         * Reconstructs a binary packet from its placeholder packet and buffers
         *
         * @param {Object} packet - event packet with placeholders
         * @param {Array} buffers - binary buffers to put in placeholder positions
         * @return {Object} reconstructed packet
         * @public
         */
        function reconstructPacket(packet, buffers) {
          packet.data = _reconstructPacket(packet.data, buffers);
          packet.attachments = undefined; // no longer useful
          return packet;
        }
        exports.reconstructPacket = reconstructPacket;
        function _reconstructPacket(data, buffers) {
          if (!data) return data;
          if (data && data._placeholder === true) {
            const isIndexValid =
              typeof data.num === "number" &&
              data.num >= 0 &&
              data.num < buffers.length;
            if (isIndexValid) {
              return buffers[data.num]; // appropriate buffer (should be natural order anyway)
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
      },
      { "./is-binary.js": 39 },
    ],
    38: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.Decoder =
          exports.Encoder =
          exports.PacketType =
          exports.protocol =
            void 0;
        const component_emitter_1 = require("@socket.io/component-emitter");
        const binary_js_1 = require("./binary.js");
        const is_binary_js_1 = require("./is-binary.js");
        const debug_1 = require("debug"); // debug()
        const debug = debug_1.default("socket.io-parser"); // debug()
        /**
         * Protocol version.
         *
         * @public
         */
        exports.protocol = 5;
        var PacketType;
        (function (PacketType) {
          PacketType[(PacketType["CONNECT"] = 0)] = "CONNECT";
          PacketType[(PacketType["DISCONNECT"] = 1)] = "DISCONNECT";
          PacketType[(PacketType["EVENT"] = 2)] = "EVENT";
          PacketType[(PacketType["ACK"] = 3)] = "ACK";
          PacketType[(PacketType["CONNECT_ERROR"] = 4)] = "CONNECT_ERROR";
          PacketType[(PacketType["BINARY_EVENT"] = 5)] = "BINARY_EVENT";
          PacketType[(PacketType["BINARY_ACK"] = 6)] = "BINARY_ACK";
        })((PacketType = exports.PacketType || (exports.PacketType = {})));
        /**
         * A socket.io Encoder instance
         */
        class Encoder {
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
                obj.type =
                  obj.type === PacketType.EVENT
                    ? PacketType.BINARY_EVENT
                    : PacketType.BINARY_ACK;
                return this.encodeAsBinary(obj);
              }
            }
            return [this.encodeAsString(obj)];
          }
          /**
           * Encode packet as string.
           */
          encodeAsString(obj) {
            // first is type
            let str = "" + obj.type;
            // attachments if we have them
            if (
              obj.type === PacketType.BINARY_EVENT ||
              obj.type === PacketType.BINARY_ACK
            ) {
              str += obj.attachments + "-";
            }
            // if we have a namespace other than `/`
            // we append it followed by a comma `,`
            if (obj.nsp && "/" !== obj.nsp) {
              str += obj.nsp + ",";
            }
            // immediately followed by the id
            if (null != obj.id) {
              str += obj.id;
            }
            // json data
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
            buffers.unshift(pack); // add packet info to beginning of data list
            return buffers; // write all the buffers
          }
        }
        exports.Encoder = Encoder;
        /**
         * A socket.io Decoder instance
         *
         * @return {Object} decoder
         */
        class Decoder extends component_emitter_1.Emitter {
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
                throw new Error(
                  "got plaintext data when reconstructing a packet"
                );
              }
              packet = this.decodeString(obj);
              if (
                packet.type === PacketType.BINARY_EVENT ||
                packet.type === PacketType.BINARY_ACK
              ) {
                // binary packet's json
                this.reconstructor = new BinaryReconstructor(packet);
                // no attachments, labeled binary but no binary data to follow
                if (packet.attachments === 0) {
                  super.emitReserved("decoded", packet);
                }
              } else {
                // non-binary full packet
                super.emitReserved("decoded", packet);
              }
            } else if (is_binary_js_1.isBinary(obj) || obj.base64) {
              // raw binary data
              if (!this.reconstructor) {
                throw new Error(
                  "got binary data when not reconstructing a packet"
                );
              } else {
                packet = this.reconstructor.takeBinaryData(obj);
                if (packet) {
                  // received final buffer
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
            // look up type
            const p = {
              type: Number(str.charAt(0)),
            };
            if (PacketType[p.type] === undefined) {
              throw new Error("unknown packet type " + p.type);
            }
            // look up attachments if type binary
            if (
              p.type === PacketType.BINARY_EVENT ||
              p.type === PacketType.BINARY_ACK
            ) {
              const start = i + 1;
              while (str.charAt(++i) !== "-" && i != str.length) {}
              const buf = str.substring(start, i);
              if (buf != Number(buf) || str.charAt(i) !== "-") {
                throw new Error("Illegal attachments");
              }
              p.attachments = Number(buf);
            }
            // look up namespace (if any)
            if ("/" === str.charAt(i + 1)) {
              const start = i + 1;
              while (++i) {
                const c = str.charAt(i);
                if ("," === c) break;
                if (i === str.length) break;
              }
              p.nsp = str.substring(start, i);
            } else {
              p.nsp = "/";
            }
            // look up id
            const next = str.charAt(i + 1);
            if ("" !== next && Number(next) == next) {
              const start = i + 1;
              while (++i) {
                const c = str.charAt(i);
                if (null == c || Number(c) != c) {
                  --i;
                  break;
                }
                if (i === str.length) break;
              }
              p.id = Number(str.substring(start, i + 1));
            }
            // look up json data
            if (str.charAt(++i)) {
              const payload = this.tryParse(str.substr(i));
              if (Decoder.isPayloadValid(p.type, payload)) {
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
                return payload === undefined;
              case PacketType.CONNECT_ERROR:
                return (
                  typeof payload === "string" || typeof payload === "object"
                );
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
        }
        exports.Decoder = Decoder;
        /**
         * A manager of a binary event's 'buffer sequence'. Should
         * be constructed whenever a packet of type BINARY_EVENT is
         * decoded.
         *
         * @param {Object} packet
         * @return {BinaryReconstructor} initialized reconstructor
         */
        class BinaryReconstructor {
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
              // done with buffer list
              const packet = binary_js_1.reconstructPacket(
                this.reconPack,
                this.buffers
              );
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
        }
      },
      {
        "./binary.js": 37,
        "./is-binary.js": 39,
        "@socket.io/component-emitter": 1,
        debug: 40,
      },
    ],
    39: [
      function (require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.hasBinary = exports.isBinary = void 0;
        const withNativeArrayBuffer = typeof ArrayBuffer === "function";
        const isView = (obj) => {
          return typeof ArrayBuffer.isView === "function"
            ? ArrayBuffer.isView(obj)
            : obj.buffer instanceof ArrayBuffer;
        };
        const toString = Object.prototype.toString;
        const withNativeBlob =
          typeof Blob === "function" ||
          (typeof Blob !== "undefined" &&
            toString.call(Blob) === "[object BlobConstructor]");
        const withNativeFile =
          typeof File === "function" ||
          (typeof File !== "undefined" &&
            toString.call(File) === "[object FileConstructor]");
        /**
         * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
         *
         * @private
         */
        function isBinary(obj) {
          return (
            (withNativeArrayBuffer &&
              (obj instanceof ArrayBuffer || isView(obj))) ||
            (withNativeBlob && obj instanceof Blob) ||
            (withNativeFile && obj instanceof File)
          );
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
          if (
            obj.toJSON &&
            typeof obj.toJSON === "function" &&
            arguments.length === 1
          ) {
            return hasBinary(obj.toJSON(), true);
          }
          for (const key in obj) {
            if (
              Object.prototype.hasOwnProperty.call(obj, key) &&
              hasBinary(obj[key])
            ) {
              return true;
            }
          }
          return false;
        }
        exports.hasBinary = hasBinary;
      },
      {},
    ],
    40: [
      function (require, module, exports) {
        arguments[4][18][0].apply(exports, arguments);
      },
      { "./common": 41, _process: 27, dup: 18 },
    ],
    41: [
      function (require, module, exports) {
        arguments[4][19][0].apply(exports, arguments);
      },
      { dup: 19, ms: 42 },
    ],
    42: [
      function (require, module, exports) {
        arguments[4][20][0].apply(exports, arguments);
      },
      { dup: 20 },
    ],
    43: [
      function (require, module, exports) {
        const io = require("socket.io-client");

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

          // add the modal to the body
          $("body").append(loadingModal);

          $(".loadingModal").modal({
            backdrop: "static", // Prevent dismissing the modal by clicking outside or pressing the Esc key
            keyboard: false, // Disable keyboard events
          });
        }

        function hideLoadingModal() {
          $(".loadingModal").modal("hide"); // Hide the modal
          $(".modal-backdrop").remove(); // Remove the backdrop
          $(".loadingModal").remove(); // Remove the modal element from the DOM
          $("body").removeClass("modal-open"); // Remove the 'modal-open' class from the body
        }

        createLoadingModal();

        //connect to socket
        let socket;
        socket = io("/media", { transports: ["websocket"] });
        let socket_ = socket;
        let apiChecked = false;
        let apiKey = null;
        let apiUserName = null;
        let apiType = "test";
        let prevApiKey = null;
        let prevApiUserName = null;
        let maxMeetingDuration = 2;
        let showRecording = false;
        let altSocket = null;
        let altSocketType = "test";
        let userName;
        let codeVisible = false;

        let existingNames = [];
        let existingBans = [];
        let newMeeting = false;
        let eventStarted = false;
        let adminStarted = false;
        let waitingForAdmin = false;
        let disableJoin = false;
        let deferAlertForCapacity = false;
        let secureCode;
        let nameOfAdmin;
        let passWord;
        let urll;
        let userSecret;
        let pender;
        let passCodeClicked = false;
        let meetIDClicked = false;
        let audioPreference = null;
        let videoPreference = null;
        let audioOutputPreference = null;
        let waitRoom;
        let waitedRoom;
        let recordRoom;
        let checkForAdmin = false;
        let loaded = false;
        let refRoomCapacity = 2;
        let eventID;
        let audioFactor = 7.5;
        let hostName = window.location.hostname;
        let hostProtocol = window.location.protocol;
        let subusername;

        let actType = "webinar";
        let prevActType;
        let allowRecording = false;

        let videoAlreadyOn = false;
        let localStreamVideo = null;

        let recordingParams = {
          recordingAudioPausesLimit: 0,
          recordingAudioSupport: false, // allowed to record audio
          recordingAudioPeopleLimit: 0,
          recordingAudioParticipantsTimeLimit: 0, // (defaulted to seconds so 60 for 1 minute)

          recordingVideoPausesLimit: 0,
          recordingVideoSupport: false, //allowed to record video
          recordingVideoPeopleLimit: 0,
          recordingVideoParticipantsTimeLimit: 0, // (defaulted to seconds so 60 for 1 minute)

          recordingAllParticipantsSupport: false, //others other than host included (with media)
          recordingVideoParticipantsSupport: false, //video participants/participant (screensharer) in the room will be recorded
          recordingAllParticipantsFullRoomSupport: false, //all participants in the room will be recorded (with media or not)
          recordingVideoParticipantsFullRoomSupport: false, //all video participants in the room will be recorded

          recordingPreferredOrientation: "landscape",
          recordingSupportForOtherOrientation: false,
          recordingMultiFormatsSupport: false, //multiple formats support
          recordingHLSSupport: true, //hls support
        };

        let refRecordingParams = {
          recordingAudioPausesLimit: 0,
          recordingAudioSupport: false, // allowed to record audio
          recordingAudioPeopleLimit: 0,
          recordingAudioParticipantsTimeLimit: 0, // (defaulted to seconds so 60 for 1 minute)

          recordingVideoPausesLimit: 0,
          recordingVideoSupport: false, //allowed to record video
          recordingVideoPeopleLimit: 0,
          recordingVideoParticipantsTimeLimit: 0, // (defaulted to seconds so 60 for 1 minute)

          recordingAllParticipantsSupport: false, //others other than host included (with media)
          recordingVideoParticipantsSupport: false, //video participants/participant (screensharer) in the room will be recorded
          recordingAllParticipantsFullRoomSupport: false, //all participants in the room will be recorded (with media or not)
          recordingVideoParticipantsFullRoomSupport: false, //all video participants in the room will be recorded

          recordingPreferredOrientation: "landscape",
          recordingSupportForOtherOrientation: false,
          recordingMultiFormatsSupport: false, //multiple formats support
          recordingHLSSupport: true, //hls support
        };

        let meetingRoomParams = {
          itemPageLimit: 4,
          mediaType: "video", //video,audio
          addCoHost: true,
          targetOrientation: "neutral", //landscape or neutral, portrait
          targetOrientationHost: "neutral", //landscape or neutral, portrait
          targetResolution: "sd", //hd,sd,QnHD
          targetResolutionHost: "sd", //hd,sd,QnHD
          type: `conference`, //'broadcast',//webinar,conference,broadcast,chat
          audioSetting: "allow", //approval,disallow,allow
          videoSetting: "allow", //approval,disallow,allow
          screenshareSetting: "allow", //approval,disallow,allow
          chatSetting: "allow", //disallow,allow
        };

        let meetingParams = {
          itemPageLimit: 4,
          mediaType: "video", //video,audio
          addCoHost: true,
          targetOrientation: "neutral", //landscape or neutral, portrait
          targetOrientationHost: "neutral", //landscape or neutral, portrait
          targetResolution: "sd", //hd,sd,QnHD
          targetResolutionHost: "sd", //hd,sd,QnHD
          type: `conference`, //'broadcast',//webinar,conference,broadcast,chat
          audioSetting: "allow", //approval,disallow,allow
          videoSetting: "allow", //approval,disallow,allow
          screenshareSetting: "allow", //approval,disallow,allow
          chatSetting: "allow", //disallow,allow
        };

        let refMeetingParams = {
          itemPageLimit: 4,
          mediaType: "video", //video,audio
          addCoHost: true,
          targetOrientation: "neutral", //landscape or neutral, portrait
          targetOrientationHost: "neutral", //landscape or neutral, portrait
          targetResolution: "sd", //hd,sd,QnHD
          targetResolutionHost: "sd", //hd,sd,QnHD
          type: `conference`, //'broadcast',//webinar,conference,broadcast,chat
          audioSetting: "allow", //approval,disallow,allow
          videoSetting: "allow", //approval,disallow,allow
          screenshareSetting: "allow", //approval,disallow,allow
          chatSetting: "allow", //disallow,allow
        };

        const event = window.location.pathname.split("/")[2];
        const eventIDInputField = document.getElementById("eventIDInput");
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

            await navigator.mediaDevices
              .enumerateDevices()
              .then((devices) => {
                // Filter the list to get only audio and video input devices
                const videoInputs = devices.filter(
                  (device) => device.kind === "videoinput"
                );
                const audioInputs = devices.filter(
                  (device) => device.kind === "audioinput"
                );
                const audioOutputs = devices.filter(
                  (device) => device.kind === "audiooutput"
                );
                // Populate the video, audio input, and audio output dropdowns with the device names
                const videoDropdown = $("#cameraList");
                const audioInputDropdown = $("#microphoneList");
                const audioOutputDropdown = $("#audioOutputList");

                // For video inputs
                videoInputs.forEach((input) => {
                  const option = $("<option></option>")
                    .attr("value", input.deviceId)
                    .text(input.label);
                  videoDropdown.append(option);
                  videoDropdown.trigger("change");
                });

                // For audio inputs
                audioInputs.forEach((input) => {
                  const option = $("<option></option>")
                    .attr("value", input.deviceId)
                    .text(input.label);
                  audioInputDropdown.append(option);
                  audioInputDropdown.trigger("change");
                });

                // For audio outputs
                audioOutputs.forEach((output) => {
                  const option = $("<option></option>")
                    .attr("value", output.deviceId)
                    .text(output.label);
                  audioOutputDropdown.append(option);
                  audioOutputDropdown.trigger("change");
                });

                // Set the default camera, microphone, and audio output sources
                if (savedVideoDevice) {
                  //check if the saved video device is in the list of video devices
                  const videoDevice = videoInputs.find(
                    (device) => device.deviceId === savedVideoDevice
                  );
                  if (videoDevice) {
                    videoDropdown.val(savedVideoDevice);
                  }
                }

                if (savedAudioDevice) {
                  //check if the saved audio device is in the list of audio devices
                  const audioDevice = audioInputs.find(
                    (device) => device.deviceId === savedAudioDevice
                  );
                  if (audioDevice) {
                    audioInputDropdown.val(savedAudioDevice);
                  }
                }

                // Limit the width of the select element
                audioOutputDropdown.css("max-width", "100%");
                audioInputDropdown.css("max-width", "100%");
                videoDropdown.css("max-width", "100%");
              })

              .catch((error) => {
                // console.log(error);
              });
          } catch (error) {}

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

            await navigator.mediaDevices
              .getUserMedia({
                video: {
                  deviceId: videoDropdown.val(),
                  width: { ideal: 960 },
                  height: { ideal: 960 },
                },
                audio: { deviceId: audioInputDropdown.val() },
              })
              .then((stream) => {
                const videoElement =
                  document.getElementById("videoOutputPreview");
                const audioElement =
                  document.getElementById("audioOutputPreview");
                videoElement.srcObject = stream;
                audioElement.srcObject = stream;

                localStreamVideo = stream;
                videoAlreadyOn = true;
              })
              .catch((error) => {
                videoAlreadyOn = false;
                console.log(error);
              });

            videoDropdown.on("change", async () => {
              videoPreference = await videoDropdown.val();
              await navigator.mediaDevices
                .getUserMedia({
                  video: {
                    deviceId: videoDropdown.val(),
                    width: { ideal: 960 },
                    height: { ideal: 960 },
                  },
                  audio: { deviceId: audioInputDropdown.val() },
                })
                .then((stream) => {
                  const videoElement =
                    document.getElementById("videoOutputPreview");
                  videoElement.srcObject = stream;
                  setCookie("videoDevice", videoDropdown.val(), 365);
                  videoAlreadyOn = true;
                  localStreamVideo = stream;

                  //set the facing mode of the video
                  try {
                    const facingMode = stream
                      .getVideoTracks()[0]
                      .getSettings().facingMode;
                    setCookie("facingMode", facingMode, 365);
                  } catch (error) {}
                })
                .catch((error) => {
                  videoAlreadyOn = false;
                  console.log(error);
                });
            });

            audioInputDropdown.on("change", async () => {
              audioPreference = await audioInputDropdown.val();
              await navigator.mediaDevices
                .getUserMedia({
                  video: {
                    deviceId: videoDropdown.val(),
                    width: { ideal: 960 },
                    height: { ideal: 960 },
                  },
                  audio: { deviceId: audioInputDropdown.val() },
                })
                .then((stream) => {
                  const audioElement =
                    document.getElementById("audioOutputPreview");
                  audioElement.srcObject = stream;
                  setCookie("audioDevice", audioInputDropdown.val(), 365);
                  //set the facing mode of the video
                  try {
                    const facingMode = stream
                      .getVideoTracks()[0]
                      .getSettings().facingMode;
                    setCookie("facingMode", facingMode, 365);
                  } catch (error) {}
                })
                .catch((error) => {
                  console.log(error);
                });
            });

            audioOutputDropdown.on("change", async () => {
              audioOutputPreference = await audioOutputDropdown.val();
              const audioElement =
                document.getElementById("audioOutputPreview");
              const selectedDeviceId = audioOutputDropdown.val();
              if (selectedDeviceId === "") {
                audioElement.pause();
                audioElement.srcObject = null;
              } else {
                await navigator.mediaDevices
                  .getUserMedia({
                    audio: { deviceId: audioOutputDropdown.val() },
                  })
                  .then((stream) => {
                    audioElement.srcObject = stream;
                    audioElement.play();
                    setCookie(
                      "audioOutputDevice",
                      audioOutputDropdown.val(),
                      365
                    );
                  })
                  .catch((error) => {
                    console.log(error);
                  });
              }
            });
          } catch (error) {}

          const eventIDInputField = await document.getElementById(
            "eventIDInput"
          );
          if (event && event != "start") {
            eventIDInputField.value = event;
          }

          hideLoadingModal();

          //show alert
          await showAlert(
            "Join an existing meeting by entering the ID, clicking confirm, then proceeding to enter your name and click join.",
            "success",
            6000000
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

          // Set an interval to update the DateTimePicker input every second
          setInterval(updateDateTime, 1000);

          $("#datetimePicker").datetimepicker({
            format: "MMMM Do YYYY, h:mm a",
            defaultDate: moment(),
          });
        }

        //generic alert function
        function showAlert(message, state, duration = 4000) {
          $("#alertMessage").text(message);
          if (state === "success") {
            $("#alertModal")
              .find(".modal-body .alert")
              .removeClass("alert-danger")
              .addClass("alert-success");
          } else {
            $("#alertModal")
              .find(".modal-body .alert")
              .removeClass("alert-success")
              .addClass("alert-danger");
          }
          $("#alertModal").modal("show");
          setTimeout(function () {
            $("#alertModal").modal("hide");
          }, duration);
        }

        const toggleBtn = document.getElementById("toggleButton");
        // const startMeetingBtn = document.getElementById('startMeetingBtn');

        toggleBtn.addEventListener("click", () => {
          // Open the modal when the button is clicked
          $("#startMeetingModal").modal("show");
          showAlert(
            "To start an event, enter the room capacity, your name, and date. Then click start event; the event will only start after you click the copy field to get the Passcode then the ID.",
            "success",
            10000
          );

          try {
            $(".detailed").each(function () {
              $(this).hide();
            });
          } catch (error) {}
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
          //
          const increments = generateIncrements(maxMeetingDuration);
          const durationSelect = document.getElementById("durationSelect");

          //first clear the select options
          durationSelect.innerHTML = "";

          // const increments =     // [0.25,0.5, 0.75, 1, 1.25 1.5, 2, 2.5, 3, 4, 5, 6, 12,24];
          // const maxDuration = 12; // 12 hours

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

        const eventIDInput = document.getElementById("eventIDInputModal");
        const eventIDCopyBtn = document.getElementById("eventIDCopyBtn");

        const PassIDInput = document.getElementById("PassIDInputModal");
        const PassIDCopyBtn = document.getElementById("PassIDCopyBtn");

        // Generate Meeting ID based on current date and time
        function generateEventID() {
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth() + 1;
          const day = now.getDate();
          const hour = now.getHours();
          const minute = now.getMinutes();
          const second = now.getSeconds();
          const ms = now.getMilliseconds();
          const randomDigits = Math.floor(10 + Math.random() * 99);
          eventID =
            new Date().getTime().toString(30) +
            new Date().getUTCMilliseconds() +
            randomDigits.toString();

          eventID = "m" + eventID;

          //create a 12 digit secret code
          secureCode =
            Math.random().toString(30).substring(2, 14) +
            Math.random().toString(30).substring(2, 14);

          //convert the eventID to a string code of string alphanumeric characters
          eventIDInput.value = eventID;
          PassIDInput.value = secureCode;
        }

        const cancelMeetingBtn = document.getElementById("cancelMeetingBtn");
        cancelMeetingBtn.addEventListener("click", () => {
          // Close the modal
          newMeeting = false;
        });

        // Get the userNameInputModal element
        let userNameInputAlt = document.getElementById("userNameInputMain");

        // Listen for the input event
        userNameInputAlt.addEventListener("input", function () {
          // Remove spaces and non-alphanumeric characters from the entered value
          let modifiedValue = this.value
            .replace(/[^\w\s]/g, "")
            .replace(/\s/g, "");
          // Ensure the value starts with an alphabet by extracting the first character
          let firstChar = modifiedValue.charAt(0);
          let alphabeticValue = /^[A-Za-z]/.test(firstChar)
            ? modifiedValue
            : "";
          // Set the modified value back to the input field
          this.value = alphabeticValue;
        });

        // Get the userNameInputModal element
        let userNameInput = document.getElementById("userNameInputModal");

        // Listen for the input event
        userNameInput.addEventListener("input", function () {
          // Remove spaces and non-alphanumeric characters from the entered value
          let modifiedValue = this.value
            .replace(/[^\w\s]/g, "")
            .replace(/\s/g, "");
          // Ensure the value starts with an alphabet by extracting the first character
          let firstChar = modifiedValue.charAt(0);
          let alphabeticValue = /^[A-Za-z]/.test(firstChar)
            ? modifiedValue
            : "";
          // Set the modified value back to the input field
          this.value = alphabeticValue;
        });

        // Function to hide the QR code
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

        const startMeetingBtn = document.getElementById("startMeetingBtn");
        startMeetingBtn.addEventListener("click", () => {
          const durationSelect = document.getElementById("durationSelect");
          const capacityInput = document.getElementById("capacityInput");
          const capacity = parseInt(inputCapacity.value, 10);
          let warningMessage = document.getElementById("copyMessageFailed");
          let warningMessageAlt = document.getElementById(
            "copyMessageFailedAlt"
          );

          if (capacity < 2 || capacity > refRoomCapacity) {
            inputCapacity.setCustomValidity(
              `Room capacity must be between 2 and ${refRoomCapacity}.`
            );
            warningMessage.textContent = `Room capacity must be between 2 and ${refRoomCapacity}.`;
            warningMessageAlt.textContent = `Room capacity must be between 2 and ${refRoomCapacity}.`;
            //set the value to the max
            inputCapacity.value = refRoomCapacity;
          } else {
            inputCapacity.setCustomValidity("");
            warningMessage.textContent = "";
            warningMessageAlt.textContent = "";
          }

          capacityInput.max = refRoomCapacity;
          const userNameInput = document.getElementById("userNameInputModal");
          // Check if all fields are filled
          if (
            !durationSelect.value ||
            !capacityInput.value ||
            !userNameInput ||
            !userNameInput.value
          ) {
            // const warningMessage = document.getElementById('copyMessageFailed');
            warningMessage.textContent = "Fill in all fields.";
            warningMessageAlt.textContent = "Fill in all fields.";
            return;
          }

          if (capacityInput.value > refRoomCapacity) {
            // const warningMessage = document.getElementById('copyMessageFailed');
            warningMessage.textContent = `Room capacity cannot be more than ${refRoomCapacity}.`;
            warningMessageAlt.textContent = `Room capacity cannot be more than ${refRoomCapacity}.`;
            return;
          }

          //reomve spaces from the username and make sure it is at least 3 characters long
          const userNam = userNameInput.value.trim();
          if (userNam.length < 2) {
            // const warningMessage = document.getElementById('copyMessageFailed');
            warningMessage.textContent =
              "Username must be at least 2 characters long.";
            warningMessageAlt.textContent =
              "Username must be at least 2 characters long.";
            return;
          }

          if (isReservedKeyword(userNam)) {
            // const warningMessage = document.getElementById('copyMessageFailed');
            warningMessage.textContent =
              "Username cannot be a reserved keyword.";
            warningMessageAlt.textContent =
              "Username cannot be a reserved keyword.";
            return;
          }

          // Generate Meeting ID and fill in the input field
          generateEventID();
          // const warningMessage = document.getElementById('copyMessageFailed');
          warningMessage.textContent =
            "Click copy to get the Event ID and continue!";

          // fill the passcode field
          const warnedMessage = document.getElementById(
            "copyPassMessageFailed"
          );
          warnedMessage.textContent = "Click copy to get the Passcode!";

          // disable the start meeting button
          startMeetingBtn.disabled = true;

          let selectedDateTime = $("#datetimePicker").datetimepicker("date");

          let scheduledDate = selectedDateTime.toDate();

          //convert the selected date to a DATE in js

          // Get the current time
          let currentTime = moment();

          // Check if the selected datetime is at least 5 minutes more than the current time
          if (selectedDateTime.isAfter(currentTime.add(5, "minutes"))) {
            //hide the qr code
            hideQRCode();
            startMeetingBtn.textContent = "Scheduling...";
            // const warningMessage = document.getElementById('copyMessageFailed');
            // warningMessage.textContent = 'Click copy to get the Event ID!';
            // warnedMessage.textContent = 'Click copy to get the Passcode!';
          } else {
            //hide the qr code
            hideQRCode();

            startMeetingBtn.textContent = "Starting...";
            // return;
          }

          $("#PassIDCopyBtn").trigger("click");
          $("#eventIDCopyBtn").trigger("click");
        });

        // Copy Meeting ID to clipboard when copy button is clicked
        PassIDCopyBtn.addEventListener("click", async () => {
          // check if the meeting ID is generated
          //check if the meeting ID is already copied

          if (PassIDInput.value) {
            PassIDInput.select();
            document.execCommand("copy");
            const warningMessage = document.getElementById(
              "copyPassMessageFailed"
            );
            warningMessage.textContent = "Passcode copied to clipboard!";

            passCodeClicked = true;
          }
        });

        // Copy Meeting ID to clipboard when copy button is clicked
        eventIDCopyBtn.addEventListener("click", async () => {
          // check if the meeting ID is generated
          if (eventIDInput.value) {
            if (codeVisible) {
              eventIDInput.select();
              document.execCommand("copy");
              const warningMessage =
                document.getElementById("copyMessageFailed");
              warningMessage.textContent = "Event ID copied to clipboard!";
              return;
            }

            if (!passCodeClicked) {
              showAlert(
                "Click the copy button to get the Passcode first!",
                "danger"
              );
              return;
            }

            eventIDInput.select();
            document.execCommand("copy");
            const warningMessage = document.getElementById("copyMessageFailed");
            warningMessage.textContent = "Event ID copied to clipboard!";

            meetIDClicked = true;

            const durationSelect = document.getElementById("durationSelect");
            const capacityInput = document.getElementById("capacityInput");
            const userNameInput = document.getElementById("userNameInputModal");

            let selectedDateTime = $("#datetimePicker").datetimepicker("date");

            let scheduledDate = selectedDateTime.toDate();

            // Get the current time
            let currentTime = moment();

            //redirect to the meeting page, url is /meeting/<eventID>/0
            eventID = await eventIDInput.value;
            const duration = await durationSelect.value;
            const capacity = await capacityInput.value;
            //check and make sure capacity is not more than 50
            if (capacity > refRoomCapacity) {
              showAlert(
                `Room capacity cannot be more than ${refRoomCapacity}.`,
                "danger"
              );
              capacity = refRoomCapacity;
            }

            userName = await userNameInput.value;
            userName = userName.replace(/\s/g, "");
            const url = `/meeting/${eventID}/0`;
            //send the rest as parameters to the redirect url

            if (showRecording && recordRoom) {
            } else {
              recordingParams.recordingAudioSupport = false;
              recordingParams.recordingVideoSupport = false;
            }

            await createLoadingModal();
            let mediasfuURL = "";

            if (showRecording && recordRoom) {
              //create room on mediaSFU
              const payload = {
                duration,
                capacity,
                userName,
                scheduledDate,
                secureCode,
                recordingParams,
                meetingRoomParams: meetingParams,
                recordOnly: true,
                action: "create",
              };

              const response = await createRoomOnMediaSFU(
                payload,
                apiUserName,
                apiKey
              );

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
                mediasfuURL,
              },
              ({ success, secret, reason, url }) => {
                hideLoadingModal();
                urll = url;
                userSecret = secret;

                if (success) {
                  //EMPTY AND HIDE THE MODAL
                  //redirect to the meeting page, url is /meeting/<eventID>/0

                  if (selectedDateTime.isAfter(currentTime.add(5, "minutes"))) {
                    $("#startMeetingModal").modal("hide");
                    //showalert that meeting has been scheduled add secretCode to the message
                    let alertMessage = `Event scheduled. Passcode: ${secureCode}      ID: ${eventID}`;

                    showAlert(alertMessage, "success", 6000);
                    const warningMessage =
                      document.getElementById("warningMessage");
                    warningMessage.textContent = alertMessage;
                  } else {
                    $("#startMeetingModal").modal("hide");
                    closeStream();
                    window.location.href = urll;
                  }
                } else {
                  hideLoadingModal();
                  const warningMessage =
                    document.getElementById("copyMessageFailed");
                  warningMessage.textContent =
                    "The Event could not be scheduled, retry!";
                  showAlert(
                    "The Event could not be scheduled, retry!",
                    "danger"
                  );
                  return;
                }
              }
            );
          }
        });
        //

        const inputCapacity = document.getElementById("capacityInput");
        inputCapacity.max = refRoomCapacity;

        inputCapacity.addEventListener("input", () => {
          const capacity = parseInt(inputCapacity.value, 10);
          const warningMessage = document.getElementById(
            "copyMessageFailedAlt"
          );

          if (capacity < 0 || capacity > refRoomCapacity) {
            inputCapacity.setCustomValidity(
              `Room capacity must be between 0 and ${refRoomCapacity}.`
            );
            warningMessage.textContent = `Room capacity must be between 0 and ${refRoomCapacity}.`;
            //set the value to the max
            inputCapacity.value = refRoomCapacity;
          } else {
            inputCapacity.setCustomValidity("");
            warningMessage.textContent = "";
          }
        });

        const nameInput = document.getElementById("userNameInputMain");
        //add event listener to the name input field for keyup event
        nameInput.addEventListener("keyup", checkUserNameValidity);

        async function createRoomOnMediaSFU(payload, apiUserName, apiKey) {
          try {
            const response = await fetch("/createRoom", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + apiUserName + ":" + apiKey,
              },
              body: JSON.stringify(payload),
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
            "Infinity",
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
            "null",
          ];

          const allReservedKeywords = [
            ...jsReservedKeywords,
            ...bashReservedKeywords,
          ];
          return allReservedKeywords.includes(keyword.toLowerCase());
        }

        function checkUserNameValidity() {
          const nameInput = document.getElementById("userNameInputMain");
          const nameWarn = document.getElementById("userNameWarn");
          const joinButton = document.getElementById("joinButton");

          // Check if meeting ID is entered
          const eventIDInput = document.getElementById("eventIDInput");
          if (nameInput.value.length === 0 || nameInput.readOnly) {
            nameWarn.innerText = "Enter an Event ID and click confirm first.";
            joinButton.disabled = true;
            return;
          }
          // Check name length
          if (nameInput.value.length < 2 || nameInput.value.length > 10) {
            nameWarn.innerText =
              "Name must be between 2 and 10 characters long.";
            joinButton.disabled = true;
            return;
          }

          // Check if name is a reserved keyword
          if (isReservedKeyword(nameInput.value)) {
            nameWarn.innerText = "Name cannot be a reserved keyword.";
            joinButton.disabled = true;
            return;
          }

          //remove space from the name
          let named = nameInput.value
            .replace(/[^\w\s]/gi, "")
            .replace(/\s/g, "");

          //check if banned
          if (existingBans.includes(named)) {
            nameWarn.innerText = "You are banned from this event.";
            joinButton.disabled = true;
            return;
          }

          //check if adminStarted, check if the name == adminName, if not alert admin is yet to start the meeting
          if (adminStarted) {
            if (named != nameOfAdmin) {
              nameWarn.innerText = "Host has not started the event yet.";
              joinButton.disabled = true;
              return;
            }
          }

          // Check name uniqueness
          if (
            existingNames.some(
              (existingName) =>
                existingName.toLowerCase() === named.toLowerCase()
            )
          ) {
            if (nameOfAdmin != named) {
              nameWarn.innerText = "Name is already taken.";
              joinButton.disabled = true;
              return;
            } else {
              if (!pender) {
                nameWarn.innerText = "Name is already taken.";
                joinButton.disabled = true;
                return;
              }
            }
          }

          // Name is valid, clear warning and enable join button
          nameWarn.innerText = "";
          joinButton.disabled = false;
        }

        // Function to add change listeners for both Recording and Meeting Parameters
        function addChangeListeners(fieldId, paramName, paramType) {
          document
            .getElementById(fieldId)
            .addEventListener("change", function () {
              // Determine the reference value and data type

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

              // const refValue = paramType === 'boolean' ? refRecordingParams[paramName] : refMeetingParams[paramName];
              let selectedValue = this.value;

              // Handle boolean values
              if (paramType === "boolean") {
                selectedValue = selectedValue === "true";
                if (selectedValue && !refValue) {
                  this.value = "false";
                  showAlert(
                    `Enabling of this feature is not supported.`,
                    "danger"
                  );
                  selectedValue = false;
                }
              }

              // Handle numeric values
              if (paramType === "number") {
                selectedValue = parseInt(selectedValue, 10);

                if (isNaN(selectedValue)) {
                  showAlert(`Please enter a valid number`);
                  this.value = refValue.toString();
                  return;
                }

                // Validate against the reference
                if (selectedValue > refValue) {
                  showAlert(`This cannot be greater than ${refValue}.`);
                  this.value = refValue.toString();
                  selectedValue = refValue;
                }
              } else if (paramType === "string") {
                //check for mediaType, cant be video if refValue != video
                if (paramName === "mediaType") {
                  if (selectedValue == "video" && refValue !== "video") {
                    showAlert(`This cannot be changed to ${selectedValue}.`);
                    this.value = refValue.toString();
                    selectedValue = refValue;
                  }
                }

                //check for resolution
                if (
                  (paramName === "targetResolution" ||
                    paramName === "targetResolutionHost") &&
                  refMedia == "video"
                ) {
                  //rand hd as the max, then sd, then qnhd, check for the selected value not to be greater than the refValue
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

        // Function to populate the advanced settings fields
        function populateAdvancedSettings() {
          // Recording Parameters

          if (meetingParams.type == "broadcast") {
            recordingParams.recordingVideoPeopleLimit = 1;
            recordingParams.recordingAudioPeopleLimit = 1;
            meetingParams.itemPageLimit = 1;
          }

          if (actType != "chat") {
            document.getElementById("recordingAudioPausesLimit").value =
              recordingParams.recordingAudioPausesLimit;
            document.getElementById("recordingAudioSupport").value =
              recordingParams.recordingAudioSupport.toString();
            document.getElementById("recordingAudioPeopleLimit").value =
              recordingParams.recordingAudioPeopleLimit;
            document.getElementById(
              "recordingAudioParticipantsTimeLimit"
            ).value = recordingParams.recordingAudioParticipantsTimeLimit;
            document.getElementById("recordingVideoPausesLimit").value =
              recordingParams.recordingVideoPausesLimit;
            document.getElementById("recordingVideoSupport").value =
              recordingParams.recordingVideoSupport.toString();
            document.getElementById("recordingVideoPeopleLimit").value =
              recordingParams.recordingVideoPeopleLimit;
            document.getElementById(
              "recordingVideoParticipantsTimeLimit"
            ).value = recordingParams.recordingVideoParticipantsTimeLimit;
            document.getElementById("recordingAllParticipantsSupport").value =
              recordingParams.recordingAllParticipantsSupport.toString();
            document.getElementById("recordingVideoParticipantsSupport").value =
              recordingParams.recordingVideoParticipantsSupport.toString();
            document.getElementById(
              "recordingAllParticipantsFullRoomSupport"
            ).value =
              recordingParams.recordingAllParticipantsFullRoomSupport.toString();
            document.getElementById(
              "recordingVideoParticipantsFullRoomSupport"
            ).value =
              recordingParams.recordingVideoParticipantsFullRoomSupport.toString();
            document.getElementById("recordingPreferredOrientation").value =
              recordingParams.recordingPreferredOrientation;
            document.getElementById(
              "recordingSupportForOtherOrientation"
            ).value =
              recordingParams.recordingSupportForOtherOrientation.toString();
            document.getElementById("recordingMultiFormatsSupport").value =
              recordingParams.recordingMultiFormatsSupport.toString();
            document.getElementById("recordingHLSSupport").value =
              recordingParams.recordingHLSSupport.toString();
          }

          // Meeting Parameters
          document.getElementById("itemPageLimit").value =
            meetingParams.itemPageLimit;
          document.getElementById("mediaType").value = meetingParams.mediaType;
          document.getElementById("addCoHost").value =
            meetingParams.addCoHost.toString();
          document.getElementById("targetOrientation").value =
            meetingParams.targetOrientation;
          document.getElementById("targetOrientationHost").value =
            meetingParams.targetOrientationHost;
          document.getElementById("targetResolution").value =
            meetingParams.targetResolution;
          document.getElementById("targetResolutionHost").value =
            meetingParams.targetResolutionHost;

          document.getElementById("audioSetting").value =
            meetingParams.audioSetting;
          document.getElementById("videoSetting").value =
            meetingParams.videoSetting;
          document.getElementById("screenshareSetting").value =
            meetingParams.screenshareSetting;
          document.getElementById("chatSetting").value =
            meetingParams.chatSetting;
        }

        const advancedSettingsBtn = document.getElementById(
          "advancedSettingsBtn"
        );
        const recordingParamsPanel = document.getElementById(
          "recordingParamsPanel"
        );
        const meetingParamsPanel =
          document.getElementById("meetingParamsPanel");

        // Event listener for the Advanced Settings button
        advancedSettingsBtn.addEventListener("click", () => {
          // Toggle the visibility of the panels
          if (meetingParamsPanel.style.display === "none") {
            if (actType != "chat" && showRecording) {
              recordingParamsPanel.style.display = "block";
            }
            meetingParamsPanel.style.display = "block";
            advancedSettingsBtn.textContent = "Hide Advanced Settings";
            populateAdvancedSettings();

            // Add change listeners for all Recording Parameters
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

            // Add change listeners for all Meeting Parameters
            addChangeListeners("itemPageLimit", "itemPageLimit", "number");
            addChangeListeners("mediaType", "mediaType", "string");
            addChangeListeners("addCoHost", "addCoHost", "boolean");
            addChangeListeners(
              "targetOrientation",
              "targetOrientation",
              "string"
            );
            addChangeListeners(
              "targetOrientationHost",
              "targetOrientationHost",
              "string"
            );
            addChangeListeners(
              "targetResolution",
              "targetResolution",
              "string"
            );
            addChangeListeners(
              "targetResolutionHost",
              "targetResolutionHost",
              "string"
            );
            addChangeListeners("actType", "actType", "string");

            if (altSocketType == "test") {
              document.getElementById("audioSetting").value =
                meetingParams.audioSetting;
              document.getElementById("audioSetting").disabled = true; // Disable the input

              document.getElementById("videoSetting").value =
                meetingParams.videoSetting;
              document.getElementById("videoSetting").disabled = true; // Disable the input

              document.getElementById("screenshareSetting").value =
                meetingParams.screenshareSetting;
              document.getElementById("screenshareSetting").disabled = true; // Disable the input

              document.getElementById("chatSetting").value =
                meetingParams.chatSetting;
              document.getElementById("chatSetting").disabled = true;
            } else {
              addChangeListeners("audioSetting", "audioSetting", "string");
              addChangeListeners("videoSetting", "videoSetting", "string");
              addChangeListeners(
                "screenshareSetting",
                "screenshareSetting",
                "string"
              );
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
              // console.log('error', error);
            }
          }
        });

        function isValidDomain(domain, protocol) {
          //check if the domain is valid

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
            const date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = "; expires=" + date.toUTCString();
          }
          const domain = document.domain ? "; domain=" + document.domain : "";
          document.cookie =
            name + "=" + (value || "") + expires + domain + "; path=/";
        }

        const checkAndSetAPI = (meetingRoomParams_, recordingParams_) => {
          try {
            if (apiType_ == "production") {
              if (isValidDomain(hostName, hostProtocol)) {
              } else {
                //show alert that the domain is not valid
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
            // check apiType
            if (apiType_ === "sandbox") {
              //set the api type to sandbox
              apiType = "sandbox";
            } else if (apiType_ === "production") {
              //set the api type to production
              apiType = "production";
            }
            //check if the apiType has changed
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

        // Show the spinner modal
        function showWaitingModal() {
          $("#waitingModal").modal({
            backdrop: "static", // Prevent dismissing the modal by clicking outside or pressing the Esc key
            keyboard: false, // Disable keyboard events
          });
        }

        // Hide the spinner modal
        function hideWaitingModal() {
          $("#waitingModal").modal("hide");
        }

        // Show the admin welcome modal
        function showAdminWelcomeModal() {
          disableJoin = true;
          $("#adminWelcomeModal").modal("show");
          const joinMeetingBtn = document.getElementById("joinButton");
          joinButton.disabled = true;
        }

        // Hide the admin welcome modal
        function hideAdminWelcomeModal() {
          $("#adminWelcomeModal").modal("hide");
        }

        // Handle the submit passcode button click event
        $("#submitPasscodeBtn").click(function () {
          // Get the entered passcode
          let passcode = $("#passcodeInput").val();

          // Check the passcode (replace this with your actual passcode verification logic)
          if (passcode === passWord) {
            // Correct passcode, perform the desired action (e.g., navigate to admin page)
            // Hide the admin welcome modal
            hideAdminWelcomeModal();

            closeStream();
            window.location.href = urll;
          } else {
            // Incorrect passcode, show an error message, showAlert
            const warningMessage = document.getElementById("warningAdmin");
            warningMessage.textContent = "Incorrect passcode. Try again.";
          }
        });

        // Join Meeting when Join Meeting button is clicked
        const joinMeetingBtn = document.getElementById("joinButton");
        joinMeetingBtn.addEventListener("click", async () => {
          const nameInput = document.getElementById("userNameInputMain");
          const nameWarn = document.getElementById("userNameWarn");
          const joinButton = document.getElementById("joinButton");

          if (disableJoin) {
            joinButton.disabled = true;
            return;
          }

          // Check if meeting ID is entered
          const eventIDInput = document.getElementById("eventIDInput");
          if (nameInput.value.length === 0 || nameInput.readOnly) {
            nameWarn.innerText = "Enter an Event ID and click confirm first.";
            joinButton.disabled = true;
            return;
          }

          // Check name length
          if (nameInput.value.length < 2 || nameInput.value.length > 10) {
            nameWarn.innerText =
              "Name must be between 2 and 10 characters long.";
            joinButton.disabled = true;
            return;
          }

          //remove space from the name
          let named = nameInput.value.replace(/\s/g, "");

          // Check name uniqueness
          if (
            existingNames.some(
              (existingName) =>
                existingName.toLowerCase() === named.toLowerCase()
            )
          ) {
            if (nameOfAdmin != named) {
              nameWarn.innerText = "Name is already taken.";
              joinButton.disabled = true;
              return;
            } else {
              if (!pender) {
                nameWarn.innerText = "Name is already taken.";
                joinButton.disabled = true;
                return;
              }
            }
          }

          // Name is valid, clear warning and enable join button
          nameWarn.innerText = "";
          joinButton.disabled = false;

          //if deferAlertForCapacity is true, show the alert if name is not adminName
          if (deferAlertForCapacity) {
            if (named != nameOfAdmin) {
              s;
              showAlert("Event room is full, try again later.", "danger");
              return;
            }
          }

          //redirect to the meeting page, url is /meeting/<eventID>/0
          eventID = await eventIDInput.value;
          userName = await nameInput.value;
          userName = userName.replace(/\s/g, "");
          const url = `/meeting/${eventID}/0`;
          //send the rest as parameters to the redirect url

          let duration = 0;
          let capacity = 0;
          let scheduledDate = null;
          secureCode = null;
          // waitRoom = false;

          await createLoadingModal();

          await socket_.emit(
            "joinEventRoom",
            {
              eventID,
              userName,
              secureCode,
              videoPreference,
              audioPreference,
              audioOutputPreference,
            },
            async ({ success, secret, reason, url }) => {
              urll = url;
              userSecret = secret;

              await hideLoadingModal();

              warningMessage.textContent = "";

              if (success) {
                const warningMessage =
                  document.getElementById("warningMessage");
                //redirect to the meeting page, url is /meeting/<eventID>/0

                // if waiting for admin, show the modal
                if (waitingForAdmin || waitedRoom || checkForAdmin) {
                  // Call the showWaitingModal function when needed

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
                warningMessage.textContent =
                  "The Event could not be joined, retry!";
                return;
              }
            }
          );
        });

        // Function to handle waiting room state
        function handleWaitingRoomState(isChecked) {
          const label = document.querySelector(
            '.custom-control-label[for="waitingRoomToggle"]'
          );
          if (isChecked) {
            // Waiting room enabled
            waitRoom = true;
            label.textContent = "Enabled";
          } else {
            // Waiting room disabled
            waitRoom = false;
            label.textContent = "Disabled";
          }
        }

        // Function to handle record room state
        function handleRecordState(isChecked) {
          const label = document.querySelector(
            '.custom-control-label[for="recordToggle"]'
          );
          if (isChecked) {
            // record room enabled
            recordRoom = true;
            label.textContent = "Enabled";
          } else {
            // record room disabled
            recordRoom = false;
            label.textContent = "Disabled";
          }
        }

        function updateWaitingRoomState() {
          let waitingRoomToggle = document.getElementById("waitingRoomToggle");

          // Handle initial state
          if (actType == "chat" || apiType == "test") {
            handleWaitingRoomState(false);
            waitingRoomToggle.removeAttribute("checked");
          } else {
            handleWaitingRoomState(waitingRoomToggle.checked);
          }

          // Add event listener to the waiting room toggle
          if (actType == "chat" || apiType == "test") {
            waitingRoomToggle.disabled = true;
          } else {
            waitingRoomToggle.disabled = false;
            waitingRoomToggle.addEventListener("change", function () {
              handleWaitingRoomState(waitingRoomToggle.checked);
            });
          }
        }

        function updateRecordState() {
          let recordToggle = document.getElementById("recordToggle");

          // Handle initial state
          if (actType == "chat" || !showRecording) {
            handleRecordState(false);
            recordToggle.removeAttribute("checked");
          } else {
            handleRecordState(recordToggle.checked);
          }

          // Add event listener to the record room toggle
          if (actType == "chat" || !showRecording) {
            recordToggle.disabled = true;
          } else {
            recordToggle.disabled = false;
            recordToggle.addEventListener("change", function () {
              handleRecordState(recordToggle.checked);
            });
          }
        }

        updateWaitingRoomState();

        updateRecordState();

        //
        const confirmEventIDBtn = document.getElementById("confirmEventIDBtn");
        confirmEventIDBtn.addEventListener("click", async () => {
          const eventIDInput = document.getElementById("eventIDInput");
          eventID = eventIDInput.value;
          eventID = eventID.toLowerCase();
          const warningMessage = document.getElementById("warningMessage");

          if (eventID.length > 6) {
            //check if the eventID starts with 'd', 's', or 'p'
            //clear the warning message if it exists
            warningMessage.textContent = "";

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
                hostName,
                scheduledDate,
                pending,
                secureCode,
                waitRoom,
                checkHost,
              }) => {
                passWord = secureCode;
                waitingForAdmin = false;
                nameOfAdmin = hostName;
                pender = pending;
                waitRoom = waitRoom;
                waitedRoom = waitRoom;
                checkForAdmin = checkHost;

                await hideLoadingModal();

                eventStarted = eventStarted;

                if (exists) {
                  hostName = hostName.replace(/\s/g, "");

                  if (!pending) {
                    hostName = hostName.replace(/\s/g, "");

                    const currentDate = new Date();
                    const eventStartedDate = new Date(eventStartedAt);
                    const eventEndedDate = new Date(eventEndedAt);

                    if (!eventStarted || currentDate < eventStartedDate) {
                      // CHECK FOR ADMIN TRYING TO START MEETING
                      adminStarted = true;
                    } else {
                      adminStarted = false;
                    }

                    //convert eventCapacity to number
                    eventCapacity = parseInt(eventCapacity);
                    //find difference between names.length and bans.length
                    const diff = names.length - bans.length;

                    if (diff >= eventCapacity) {
                      warningMessage.textContent =
                        "Event room is already at capacity";
                      return;
                    }
                  } else {
                    hostName = hostName.replace(/\s/g, "");

                    const currentDate = new Date();
                    const scheduledMeetingDate = new Date(scheduledDate);
                    const diff = scheduledMeetingDate - currentDate;
                    const minutes = Math.floor(diff / 1000 / 60);

                    if (minutes > 5) {
                      warningMessage.textContent =
                        "This meeting has not started yet, you can join 5 minutes to time.";
                      // showalert of when the meeting will start, use scheduledMeetingDate and put in readable human format
                      const scheduledMeetingDateReadable =
                        scheduledMeetingDate.toLocaleString();
                      const alertMessage = `Meeting will start at ${scheduledMeetingDateReadable}`;
                      showAlert(alertMessage, "danger");
                      return;
                    } else {
                      //convert eventCapacity to number
                      eventCapacity = parseInt(eventCapacity);
                      //find difference between names.length and bans.length
                      const diff = names.length - bans.length;

                      if (diff > eventCapacity) {
                        deferAlertForCapacity = true;
                      }

                      waitingForAdmin = true;
                    }
                  }

                  if (eventEnded) {
                    warningMessage.textContent = "This event has already ended";
                    return;
                  }

                  existingNames = names;
                  existingBans = bans;

                  warningMessage.textContent =
                    "The event ID is valid. Proceed to enter your name.";

                  const userNameInputMain =
                    document.getElementById("userNameInputMain");
                  userNameInputMain.readOnly = false;
                } else {
                  //check if scheduledDate is not null and it is within 5 minutes of the current time
                  warningMessage.textContent =
                    "The Event ID does not exist. Enter a valid Event ID.";

                  const userNameInputMain =
                    document.getElementById("userNameInputMain");
                  userNameInputMain.value = "";
                  userNameInputMain.readOnly = true;
                  const joinButton = document.getElementById("joinButton");
                  joinButton.disabled = true;
                  return;
                }
              }
            );
          } else {
            const warningMessage = document.getElementById("warningMessage");
            warningMessage.textContent = "Enter a valid Event ID.";
            const userNameInputMain =
              document.getElementById("userNameInputMain");
            userNameInputMain.readOnly = true;
            const joinButton = document.getElementById("joinButton");
            joinButton.disabled = true;
            return;
          }
        });

        function loadSocket() {
          socket_.on("exitWaitRoomUser", async ({ typed, name }) => {
            // let eventID = null;
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

                    setTimeout(function () {
                      closeStream();
                      window.location.href = urll;
                    }, 2000);
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
            //if waiting for admin, redirect to urll

            if (waitingForAdmin || checkForAdmin) {
              if ((waitingForAdmin && !waitRoom) || checkForAdmin) {
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

                      setTimeout(function () {
                        closeStream();
                        window.location.href = urll;
                      }, 2000);
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

        // Function to get a cookie value by name
        function getCookie(name) {
          const nameEQ = name + "=";
          const ca = document.cookie.split(";");
          for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == " ") c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0)
              return c.substring(nameEQ.length, c.length);
          }
          return null;
        }

        let selfieSegmentation = null;

        async function addSelfieSegmentation() {
          let selectedImage = null;
          let processedStream = null;
          let mainCanvas = null;

          const defaultImages = [
            "wall",
            "wall2",
            "shelf",
            "clock",
            "desert",
            "flower",
          ];

          const defaultImagesContainer =
            document.getElementById("defaultImages");
          const uploadImageInput = document.getElementById("uploadImage");
          const loadingSpinner = document.getElementById("loadingSpinner");

          async function preloadModel() {
            selfieSegmentation = new SelfieSegmentation({
              locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
            });

            selfieSegmentation.setOptions({
              modelSelection: 1,
              selfieMode: true,
            });

            await selfieSegmentation.initialize();
          }

          preloadModel().catch((err) =>
            console.log("Error preloading model:", err)
          );

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
              setCookie("backgroundSrc", full, 7);
              setCookie("useBackground", "true", 7);
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
            setCookie("useBackground", "false", 7);
            segmentationPreview(false);
          });
          defaultImagesContainer.appendChild(noBackgroundButton);

          uploadImageInput.addEventListener("change", (event) => {
            try {
              const file = event.target.files[0];
              if (file) {
                if (file.size > 2048 * 1024) {
                  // 2MB
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

                  const reader = new FileReader();
                  reader.onloadend = () => {
                    selectedImage = reader.result;
                    const baseCode = reader.result.split(",")[1];
                    const basePrefix = reader.result.split(",")[0];
                    loadImageToCanvas(reader.result);
                  };
                  reader.readAsDataURL(file);
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
              setCookie("useBackground", "false", 7);
              setCookie("backgroundSrc", "", 7);
              return;
            }

            if (videoAlreadyOn) {
              const segmentVideo = localStreamVideo;
              try {
                await segmentImage(segmentVideo.getVideoTracks()[0]);
                setCookie("useBackground", "true", 7);
              } catch (error) {
                setCookie("useBackground", "false", 7);
              }
            } else {
              setTimeout(async () => {
                if (videoAlreadyOn) {
                  const segmentVideo = localStreamVideo;
                  try {
                    await segmentImage(segmentVideo.getVideoTracks()[0]);
                    setCookie("useBackground", "true", 7);
                  } catch (error) {
                    setCookie("useBackground", "false", 7);
                  }
                }
              }, 4000);
            }

            async function segmentImage(videoTrack) {
              if (!selfieSegmentation) {
                await preloadModel();
              }

              selfieSegmentation.onResults(onResults);

              const trackProcessor = new MediaStreamTrackProcessor({
                track: videoTrack,
              });
              const trackGenerator = new MediaStreamTrackGenerator({
                kind: "video",
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
                },
              });

              trackProcessor.readable
                .pipeThrough(transformer)
                .pipeTo(trackGenerator.writable)
                .catch(() => {});

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
              ctx.drawImage(
                results.image,
                0,
                0,
                mainCanvas.width,
                mainCanvas.height
              );

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

          function getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(";").shift();
          }

          function setCookie(name, value, days) {
            let expires = "";
            if (days) {
              const date = new Date();
              date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
              expires = "; expires=" + date.toUTCString();
            }
            const domain = document.domain ? "; domain=" + document.domain : "";
            document.cookie =
              name + "=" + (value || "") + expires + domain + "; path=/";
          }

          const useBackground = getCookie("useBackground");
          let backgroundSrc = getCookie("backgroundSrc");
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
      },
      { "socket.io-client": 29 },
    ],
  },
  {},
  [43]
);
