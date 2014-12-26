/**
 * @type function
 *
 * @name M.util.chain(callback)
 *
 * @description
 * Calling chain will cause all future method calls to return wrapped objects.
 * When you've finished the computation, call value to retrieve the final value.
 * Here's an example of chaining together a map/flatten/reduce,
 * in order to get the word count of every word in a song.
 *
 * var lyrics = [
 *   {line: 1, words: "I'm a lumberjack and I'm okay"},
 *   {line: 2, words: "I sleep all night and I work all day"},
 *   {line: 3, words: "He's a lumberjack and he's okay"},
 *   {line: 4, words: "He sleeps all night and he works all day"}
 * ];
 *
 * M.util.chain(lyrics)
 *   .map(function(line) { return line.words.split(' '); })
 *   .flatten()
 *   .value();
 *
 * // >> ["I'm", "a", "lumberjack", "and", ...
 */
Mobird.util.chain = function(obj) {
  var instance = Mobird.util(obj);
  instance._chain = true;
  return instance;
};

var result = function(obj) {
  return this._chain ? Mobird.util(obj).chain() : obj;
};

/**
 * @type function
 *
 * @name M.util.mixin(object)
 *
 * @description
 * Allows you to extend Underscore with your own utility functions. 
 * Pass a hash of {name: function} definitions to have your functions
 * added to the Underscore object, as well as the OOP wrapper.
 *
 * M.util.mixin({
 *   capitalize: function(string) {
 *     return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
 *   }
 * });
 * M.util("fabio").capitalize();
 * // >> "Fabio"
 *
 */
Mobird.util.mixin = function(obj) {
  Mobird.util.each(Mobird.util.functions(obj), function(name) {
    var func = Mobird.util[name] = obj[name];
    Mobird.util.prototype[name] = function() {
      var args = [this._wrapped];
      Array.prototype.push.apply(args, arguments);
      return result.call(this, func.apply(Mobird.util, args));
    };
  });
};

Mobird.util.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
  var method = Array.prototype[name];
  Mobird.util.prototype[name] = function() {
    var obj = this._wrapped;
    method.apply(obj, arguments);
    if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
    return result.call(this, obj);
  };
});

// Add all accessor Array functions to the wrapper.
Mobird.util.each(['concat', 'join', 'slice'], function(name) {
  var method = Array.prototype[name];
  Mobird.util.prototype[name] = function() {
    return result.call(this, method.apply(this._wrapped, arguments));
  };
});

// Extracts the result from a wrapped and chained object.
Mobird.util.prototype.value = function() {
  return this._wrapped;
};

Mobird.util.mixin(Mobird.util);