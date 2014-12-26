define('m/utils', function(require, exports, module) {

  var utils = {};

  var ArrayProto = Array.prototype,
    ObjProto = Object.prototype,
    FuncProto = Function.prototype;

  var push = ArrayProto.push,
    slice = ArrayProto.slice,
    concat = ArrayProto.concat,
    toString = ObjProto.toString,
    hasOwnProperty = ObjProto.hasOwnProperty;

  var nativeIsArray = Array.isArray,
    nativeKeys = Object.keys,
    nativeBind = FuncProto.bind;

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other functions.
  var createCallback = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1:
        return function(value) {
          return func.call(context, value);
        };
      case 2:
        return function(value, other) {
          return func.call(context, value, other);
        };
      case 3:
        return function(value, index, collection) {
          return func.call(context, value, index, collection);
        };
      case 4:
        return function(accumulator, value, index, collection) {
          return func.call(context, accumulator, value, index, collection);
        };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // Collection Functions
  // --------------------

  /**
   * @type function
   *
   * @name M.util.each
   *
   * @description
   * 对一个 obj 的所有元素进行迭代，对每一个元素执行 iterator 函数。
   * 每次iterator的调用将会带有三个参数：（element, index, obj）。
   * 如果obj是一个JavaScript对象，iterarot的参数将会是（value, key, obj）。
   *
   * M.util.each([1, 2, 3], function(value, index, obj) {
   *   // TODO ...
   * });
   * ================================================================
   * M.util.each({one: 1, two: 2, three: 3}, function(value, index, obj) {
   *   // TODO ...
   * });
   *
   */
  utils.each = function(obj, iterator, context) {
    if (obj == null) return obj;
    iterator = createCallback(iterator, context);
    var i, length = obj.length;
    if (length === +length) {
      for (i = 0; i < length; i++) {
        iterator(obj[i], i, obj);
      }
    } else {
      var keys = utils.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iterator(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  /**
   * @type function
   *
   * @name M.util.map
   *
   * @description
   * 映射obj里的每一个值，通过一个转换函数（iterator）产生一个新的数组。
   * 如果obj是一个JavaScript对象，iterator的参数将会是(value, key, obj)
   *
   * M.util.map([1, 2, 3], function(value, index, list) {
   *   return value * 3;
   * });
   * // >> [3, 6, 9]
   *
   * ================================================================
   *
   * M.util.map({one: 1, two: 2, three: 3}, function(value, index, list) {
   *   return value * 3;
   * });
   * // >> [3, 6, 9]
   *
   */
  utils.map = function(obj, iterator, context) {
    if (obj == null) return [];
    iterator = utils.iteratee(iterator, context);
    var keys = obj.length !== +obj.length && utils.keys(obj),
      length = (keys || obj).length,
      results = Array(length),
      currentKey;
    for (var index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      results[index] = iterator(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  /**
   * @type function
   *
   * @name M.util.every
   *
   * @description
   * 如果所有在 list 里的元素通过了 iterator 的测试, 返回 true
   *
   */
  utils.every = function(obj, iterator, context) {
    if (obj == null) return true;
    iterator = utils.iteratee(iterator, context);
    var keys = obj.length !== +obj.length && utils.keys(obj),
      length = (keys || obj).length,
      index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (!iterator(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  /**
   * @type function
   *
   * @name M.util.some
   *
   * @description
   * 如果任何list里地任何一个元素通过了 iterator 的测试，将返回true。
   * 一旦找到了符合条件的元素，就直接中断对list的遍历。
   *
   * M.util.some([1, 2, 3], function(value, index, list) {
   *   return value === 3;
   * });
   * // >> true
   *
   */
  utils.some = function(obj, iterator, context) {
    if (obj == null) return false;
    iterator = utils.iteratee(iterator, context);
    var keys = obj.length !== +obj.length && utils.keys(obj),
      length = (keys || obj).length,
      index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (iterator(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  /**
   * @type function
   *
   * @name M.util.filter
   *
   * @description
   * 在list里地每一项进行查找，返回一个符合测试（iterator）条件的所有元素的集合
   *
   * M.util.filter([1, 2, 3, 4], function(value, index, list) {
   *   return value % 2 === 0;
   * });
   * // >> [2, 4]
   *
   */
  utils.filter = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    iterator = utils.iteratee(iterator, context);
    utils.each(obj, function(value, index, list) {
      if (iterator(value, index, list)) results.push(value);
    });
    return results;
  };

  /**
   * @type function
   *
   * @name M.util.find
   *
   * @description
   * 在 list 里的每一项进行查找, 返回第一个符合 测试(iterator)条件的元素.
   * 此函数只返回第一个符合条件的元素, 并不会遍历整个list.
   *
   * M.util.find([1, 2, 3, 4], function(value, index, list) {
   *   return value % 2 === 0;
   * });
   * // >> 2
   *
   */
  utils.find = function(obj, iterator, context) {
    var result;
    iterator = utils.iteratee(iterator, context);
    utils.some(obj, function(value, index, list) {
      if (iterator(value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  /**
   * @type function
   *
   * @name M.util.contains
   *
   * @description
   * 在 list 里的每一项进行查找, 返回第一个符合 测试(iterator)条件的元素.
   * 此函数只返回第一个符合条件的元素, 并不会遍历整个list.
   *
   * M.util.contains([1, 2, 3, 4], 1);
   * // >> true
   *
   */
  utils.contains = function(obj, target) {
    if (obj == null) return false;
    if (obj.length !== +obj.length) obj = utils.values(obj);
    return utils.indexOf(obj, target) >= 0;
  };

  /**
   * @type function
   *
   * @name M.util.pluck
   *
   * @description
   * 一个 map 通常用法的简便版本: 提取一个集合里指定的属性值.
   *
   * var stooges = [{name: 'moe', age: 40}, {name: 'larry', age: 50}, {name: 'curly', age: 60}];
   * M.util.pluck(stooges, 'name');
   * // >> ["moe", "larry", "curly"]
   *
   */
  utils.pluck = function(obj, key) {
    return utils.map(obj, utils.property(key));
  };

  /**
   * @type function
   *
   * @name M.util.pluck
   *
   * @description
   * 返回一个经过排序的 list 副本, 用升序排列 iterator 返回的值. 迭代器也可以用字符串的属性来进行比较(如length).
   *
   * M.util.sortBy([{order: 2}, {order: 3}, {order: 1}, {order: 5}], function(item) {
   *   return item.order;
   * });
   * // >> [{order: 1}, {order: 2}, {order: 3}, {order: 5}]
   *
   */
  utils.sortBy = function(obj, iterator, context) {
    iterator = utils.iteratee(iterator, context);
    return utils.pluck(utils.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = utils.iteratee(iteratee, context);
      utils.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  /**
   * @type function
   *
   * @name M.util.groupBy
   *
   * @description
   * 把一个集合分为多个集合, 通过 iterator 返回的结果进行分组.
   * 如果 iterator 是一个字符串而不是函数, 那么将使用 iterator 作为各元素的属性名来对比进行分组.
   *
   * M.util.groupBy([1.3, 2.1, 2.4], function(num){ return Math.floor(num); });
   * // >> {1: [1.3], 2: [2.1, 2.4]}
   *
   * ===========================================================================
   *
   * M.util.groupBy([{name: 'a', value: 1}, {name: 'b', value: 1}, {name: 'b', value: 2}, {name: 'a', value: 4}], function(num){
   *  return num.name;
   * });
   * // >> {a: [{name: 'a', value: 1}, {name: 'a', value: 4}], b: [{name: 'b', value: 1}, {name: 'b', value: 2}]}
   *
   */
  utils.groupBy = group(function(result, value, key) {
    if (utils.has(result, key)) result[key].push(value);
    else result[key] = [value];
  });

  /**
   * @type function
   *
   * @name M.util.countBy
   *
   * @description
   * 把一个数组分组并返回每一组内对象个数. 与 groupBy 相似, 但不是返回一组值, 而是组内对象的个数.
   *
   * M.util.countBy([1, 2, 3, 4, 5], function(num) {
   *   return num % 2 == 0 ? 'even': 'odd';
   * });
   * // >> {odd: 3, even: 2}
   *
   */
  utils.countBy = group(function(result, value, key) {
    if (utils.has(result, key)) result[key] ++;
    else result[key] = 1;
  });

  /**
   * @type function
   *
   * @name M.util.size
   *
   * @description
   * 返回 list 里所有元素的个数.
   *
   * M.util.size({one: 1, two: 2, three: 3});
   * // >> 3
   *
   */
  utils.size = function(obj) {
    if (obj == null) return 0;
    return obj.length === +obj.length ? obj.length : utils.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {
    if (shallow && utils.every(input, utils.isArray)) {
      return concat.apply(output, input);
    }
    for (var i = 0, length = input.length; i < length; i++) {
      var value = input[i];
      if (!utils.isArray(value) && !utils.isArguments(value)) {
        if (!strict) output.push(value);
      } else if (shallow) {
        push.apply(output, value);
      } else {
        flatten(value, shallow, strict, output);
      }
    }
    return output;
  };

  /**
   * @type function
   *
   * @name M.util.flatten
   *
   * @description
   * 将一个嵌套多层的数组array（嵌套可以是任何层数）转换为只有一层的数组。如果传参shallow为 true，数组只转换第一层。
   *
   * M.util.flatten([1, [2], [3, [[4]]]]);
   * // >> [1, 2, 3, 4]
   *
   * ======================================================
   *
   * M.util.flatten([1, [2], [3, [[4]]]], true);
   * // >> [1, 2, 3, [[4]]]
   *
   */
  utils.flatten = function(array, shallow) {
    return flatten(array, shallow, false, []);
  };

  /**
   * @type function
   *
   * @name M.util.without
   *
   * @description
   * 返回一个除去所有 values 后的 array 副本.
   *
   * M.util.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
   * // >> [2, 3, 4]
   *
   */
  utils.without = function(array) {
    return utils.difference(array, slice.call(arguments, 1));
  };

  /**
   * @type function
   *
   * @name M.util.difference
   *
   * @description
   * 跟 without 相似, 但是返回的数组是 array 里跟别的数组 other 里不一样的元素.
   *
   * M.util.difference([1, 2, 3, 4, 5], [5, 2, 10]);
   * // >> [1, 3, 4]
   *
   */
  utils.difference = function(array) {
    var rest = flatten(slice.call(arguments, 1), true, true, []);
    return utils.filter(array, function(value) {
      return !utils.contains(rest, value);
    });
  };

  /**
   * @type function
   *
   * @name M.util.sortedIndex
   *
   * @description
   * 为了保持 list 已经排好的顺序, 使用二进制搜索来检测 value 应该 插入到 list 里的所在位置的索引.
   * 如果传入了一个 iterator , 它将用来计算每个值的排名, 包括所传的 value 参数.
   *
   * M.util.sortedIndex([10, 20, 30, 40, 50], 35);
   * // >> 3
   *
   * ==============================================================
   *
   * var stooges = [{name: 'moe', age: 40}, {name: 'curly', age: 60}];
   * M.util.sortedIndex(stooges, {name: 'larry', age: 50}, 'age');
   * // >> 1
   *
   */
  utils.sortedIndex = function(array, obj, iterator, context) {
    iterator = utils.iteratee(iterator, context, 1);
    var value = iterator(obj);
    var low = 0,
      high = array.length;
    while (low < high) {
      var mid = low + high >>> 1;
      if (iterator(array[mid]) < value) low = mid + 1;
      else high = mid;
    }
    return low;
  };

  /**
   * @type function
   *
   * @name M.util.indexOf
   *
   * @description
   * 返回元素 value 在数组 array 里的索引位置, 如果元素没在数组 array 中, 将返回 -1. 此函数将使用原生的 indexOf 方法,
   * 除非原生的方法无故消失或者被覆盖重写了, 才使用非原生的. 如果您要处理一个大型数组, 而且确定数组已经排序, 参数 isSorted 可以传 true,
   * 函数将使用更快的二进制搜索来进行处理... 或者, 传一个数字作为 第三个参数, 以便于在指定索引之后开始寻找对应值.
   *
   * M.util.indexOf([1, 2, 3], 2);
   * // >> 1
   *
   */
  utils.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0,
      length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
      } else {
        i = utils.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    for (; i < length; i++)
      if (array[i] === item) return i;
    return -1;
  };

  // Object Functions
  // ----------------

  /**
   * @type function
   *
   * @name M.util.extend(destination, *sources)
   *
   * @description
   * 复制 source 对象的所有属性到 destination 对象上, 然后返回 destination 对象.
   * 复制是按顺序的, 所以后面的对象属性会把前面的对象属性覆盖掉(如果有重复).
   *
   * M.util.extend({name: 'moe'}, {age: 50});
   * // >> {name: 'moe', age: 50}
   *
   */
  utils.extend = function(obj) {
    if (!utils.isObject(obj)) return obj;
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        if (hasOwnProperty.call(source, prop)) {
          obj[prop] = source[prop];
        }
      }
    }
    return obj;
  };

  /**
   * @type function
   *
   * @name M.util.pick(object, *keys)
   *
   * @description
   * 返回一个 object 对象的副本, 过滤掉除了keys 以外的所有属性(一个或多个).
   *
   * M.util.pick({name: 'moe', age: 50, userid: 'moe1'}, 'name', 'age');
   * // >> {name: 'moe', age: 50}
   *
   * ======================================================================
   *
   *  M.util.pick({name: 'moe', age: 50, userid: 'moe1'}, function(value, key, object) {
   *    return M.util.isNumber(value);
   *  });
   * // >> {age: 50}
   *
   */
  utils.pick = function(obj, iteratee, context) {
    var result = {},
      key;
    if (obj == null) return result;
    if (utils.isFunction(iteratee)) {
      iteratee = createCallback(iteratee, context);
      for (key in obj) {
        var value = obj[key];
        if (iteratee(value, key, obj)) result[key] = value;
      }
    } else {
      var keys = concat.apply([], slice.call(arguments, 1));
      obj = new Object(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (key in obj) result[key] = obj[key];
      }
    }
    return result;
  };

  /**
   * @type function
   *
   * @name M.util.defaults(object, *defaults)
   *
   * @description
   * 用 defaults 对象里的默认值来填充 object 对象里遗漏的属性值, 并返回 object 对象.
   * 当属性值已被填充遗漏, 再添加属性值就没用了.
   *
   * var iceCream = {flavor: "chocolate"};
   * M.util.defaults(iceCream, {flavor: "vanilla", sprinkles: "lots"});
   * // >> {flavor: "chocolate", sprinkles: "lots"}
   *
   *
   */
  utils.defaults = function(obj) {
    if (!utils.isObject(obj)) return obj;
    for (var i = 1, length = arguments.length; i < length; i++) {
      var source = arguments[i];
      for (var prop in source) {
        if (obj[prop] === void 0) obj[prop] = source[prop];
      }
    }
    return obj;
  };

  /**
   * @type function
   *
   * @name M.util.clone(object)
   *
   * @description
   * 克隆对象 object. 任何嵌套的对象或数组将会被引用, 而不是复制.
   *
   * M.util.clone({name: 'moe'});
   * // >> {name: 'moe'};
   *
   */
  utils.clone = function(obj) {
    if (!utils.isObject(obj)) return obj;
    return utils.isArray(obj) ? obj.slice() : utils.extend({}, obj);
  };

  /**
   * @type function
   *
   * @name M.util.keys(object)
   *
   * @description
   * 获取 object 对象的所有属性名.
   *
   * M.util.keys({one: 1, two: 2, three: 3});
   * // >> ["one", "two", "three"]
   *
   */
  utils.keys = function(obj) {
    if (!utils.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj)
      if (utils.has(obj, key)) keys.push(key);
    return keys;
  };

  /**
   * @type function
   *
   * @name M.util.values(object)
   *
   * @description
   * 获取 object 对象的所有属性值.
   *
   * M.util.values({one: 1, two: 2, three: 3});
   * // >> [1, 2, 3]
   *
   */
  utils.values = function(obj) {
    var keys = utils.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  /**
   * @type function
   *
   * @name M.util.functions(object)
   *
   * @description
   * 返回一个对象里所有的方法名, 而且是已经排序的 - 也就是说, 对象里每个方法(属性值是一个函数)的名称.
   *
   * M.util.functions(M.util);
   * // >> [["before", "bind", "bindAll", "cancelAnimationFrame", "chain", "clone", "contains", ...
   *
   */
  utils.functions = function(obj) {
    var names = [];
    for (var key in obj) {
      if (utils.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  /**
   * @type function
   *
   * @name M.util.pairs(object)
   *
   * @description
   * 把一个对象转换成一个 [key, value] 形式的数组.
   *
   * M.util.pairs({one: 1, two: 2, three: 3});
   * // >> [["one", 1], ["two", 2], ["three", 3]]
   *
   */
  utils.pairs = function(obj) {
    var keys = utils.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };


  /**
   * @type function
   *
   * @name M.util.matches(attrs)
   *
   * @description
   * Returns a predicate function that will tell you if a passed in object
   * contains all of the key/value properties present in attrs.
   *
   * var ready = M.util.matches({selected: true, visible: true});
   * var readyToGoList = M.util.filter(list, ready);
   *
   */
  utils.matches = function(attrs) {
    var pairs = utils.pairs(attrs),
      length = pairs.length;
    return function(obj) {
      if (obj == null) return !length;
      obj = new Object(obj);
      for (var i = 0; i < length; i++) {
        var pair = pairs[i],
          key = pair[0];
        if (pair[1] !== obj[key] || !(key in obj)) return false;
      }
      return true;
    };
  };

  /**
   * @type function
   *
   * @name M.util.isEmpty(object)
   *
   * @description
   * 如果 object 里没包含任何东西, 将返回 true.
   *
   * M.util.isEmpty([1, 2, 3]);
   * // >> false
   *
   */
  utils.isEmpty = function(obj) {
    if (obj == null) return true;
    if (utils.isArray(obj) || utils.isString(obj) || utils.isArguments(obj)) return obj.length === 0;
    for (var key in obj)
      if (utils.has(obj, key)) return false;
    return true;
  };

  /**
   * @type function
   *
   * @name M.util.isArray(object)
   *
   * @description
   * 如果 object 是一个数组, 将返回 true.
   *
   * M.util.isArray([1,2,3]);
   * // >> true
   *
   */
  utils.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  /**
   * @type function
   *
   * @name M.util.isObject(value)
   *
   * @description
   * 如果 value 是一个对象, 将返回 true. 注意在JavaScript中数组和函数都是对象, 而普通的字符串和数字不是.
   *
   * M.util.isObject({});
   * // >> true
   *
   */
  utils.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  /**
   * @type function
   *
   * @name M.util.isArguments(object)
   *
   * @description
   * 如果 object 是参数(Arguments)对象, 将返回 true.
   *
   * (function(){ return M.util.isArguments(arguments); })(1, 2, 3);
   * // >> true
   *
   */
  utils.isArguments = function(obj) {
    return toString.call(obj) === '[object Arguments]';
  };

  /**
   * @type function
   *
   * @name M.util.isFunction(object)
   *
   * @description
   * 如果 object 是函数, 将返回 true.
   *
   * M.util.isFunction(alert)
   * // >> true
   *
   */
  utils.isFunction = function(obj) {
    return toString.call(obj) === '[object Function]';
  };

  /**
   * @type function
   *
   * @name M.util.isString(object)
   *
   * @description
   * 如果 object 是字符串, 将返回 true.
   *
   * M.util.isString("moe");
   * // >> true
   *
   */
  utils.isString = function(obj) {
    return toString.call(obj) === '[object String]';
  };

  /**
   * @type function
   *
   * @name M.util.isNumber(object)
   *
   * @description
   * 如果 object 是一个数字(包括NaN), 将返回 true.
   *
   * M.util.isNumber(8.4 * 5);
   * // >> true
   *
   */
  utils.isNumber = function(obj) {
    return toString.call(obj) === '[object Number]';
  };

  /**
   * @type function
   *
   * @name M.util.isDate(object)
   *
   * @description
   * 如果 object 是时间对象, 将返回 true.
   *
   * M.util.isDate(new Date());
   * // >> true
   *
   */
  utils.isDate = function(obj) {
    return toString.call(obj) === '[object Date]';
  };

  /**
   * @type function
   *
   * @name M.util.isRegExp(object)
   *
   * @description
   * 如果 object 是正则表达式对象, 将返回 true
   *
   * M.util.isRegExp(/moe/);
   * // >> true
   *
   */
  utils.isRegExp = function(obj) {
    return toString.call(obj) === '[object RegExp]';
  };

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!utils.isArguments(arguments)) {
    utils.isArguments = function(obj) {
      return utils.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around an IE 11 bug.
  if (typeof /./ !== 'function') {
    utils.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  /**
   * @type function
   *
   * @name M.util.isUndefined(value)
   *
   * @description
   * 如果 variable 是 undefined, 将会返回 true .
   *
   * M.util.isUndefined(window.missingVariable);
   * // >> true
   *
   */
  utils.isUndefined = function(obj) {
    return obj === void 0;
  };

  /**
   * @type function
   *
   * @name M.util.has(object, key)
   *
   * @description
   * 判断对象 object 包含指定的属性 key 吗? 和 object.hasOwnProperty(key) 相同, 但是使用了 hasOwnProperty 函数的安全引用
   *
   * M.util.has({a: 1, b: 2, c: 3}, "b");
   * // >> true
   *
   */
  utils.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Function (ahem) Functions
  // ------------------
  // Reusable constructor function for prototype setting.
  var Ctor = function() {};

  /**
   * @type function
   *
   * @name M.util.bind(function, object, [*arguments])
   *
   * @description
   * 绑定函数 function 到对象 object 上, 也就是无论何时函数被调用, 函数里的 this 都指向object.
   * 可选参数 arguments 可以绑定到函数 function , 可以填充函数所需要的参数, 这也被成为 部分应用.
   *
   * var func = function(greeting){ return greeting + ': ' + this.name };
   * func = M.util.bind(func, {name: 'moe'}, 'hi');
   * func();
   * // >> 'hi: moe'
   *
   */
  utils.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!utils.isFunction(func)) throw new TypeError('Bind must be called on a function');
    args = slice.call(arguments, 2);
    bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      Ctor.prototype = func.prototype;
      var self = new Ctor;
      Ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (utils.isObject(result)) return result;
      return self;
    };
    return bound;
  };

  /**
   * @type function
   *
   * @name M.util.bindAll(object, [*methodNames])
   *
   * @description
   * 绑定 methodNames 指定的方法到 object 上, 当这些方法被执行时将在对象的上下文执行.
   * 绑定函数用作事件处理时非常方便, 否则函数调用时 this 关键字根本没什么用.
   * 如果不传 methodNames 参数, 对象里的所有方法都被绑定.
   *
   * var buttonView = {
   *   label  : 'underscore',
   *   onClick: function(){ alert('clicked: ' + this.label); },
   *   onHover: function(){ console.log('hovering: ' + this.label); }
   * };
   * M.util.bindAll(buttonView, 'onClick', 'onHover');
   * jQuery('#underscore_button').bind('click', buttonView.onClick);
   *
   */
  utils.bindAll = function(obj) {
    var i, length = arguments.length,
      key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = utils.bind(obj[key], obj);
    }
    return obj;
  };

  /**
   * @type function
   *
   * @name M.util.partial(function, [*arguments])
   *
   * @description
   * Partially apply a function by filling in any number of its arguments, without changing its dynamic this value.
   *
   * var add = function(a, b) { return a + b; };
   * add5 = M.util.partial(add, 5);
   * add5(10);
   * // >> 15
   *
   */
  utils.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  /**
   * @type function
   *
   * @name M.util.memoize(function, [hashFunction])
   *
   * @description
   * 通过缓存计算结果使函数 function 具有记忆功能. 在优化耗时较长的算时法非常有用.
   *  如果传了可选参数 hashFunction, 将用其返回的值作为key来保存函数的运行结果, 以原始函数的参数为基础.
   * hashFunction 默认使用被缓存函数的第一个参数作为key.
   *
   * var fibonacci = M.util.memoize(function(n) {
   *   return n < 2 ? n: fibonacci(n - 1) + fibonacci(n - 2);
   * });
   *
   */
  utils.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = hasher ? hasher.apply(this, arguments) : key;
      if (!utils.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  /**
   * @type function
   *
   * @name M.util.throttle(function, wait)
   *
   * @description
   * 返回一个类似于节流阀一样的函数, 当高频率的调用函数, 实际上会每隔 wait 毫秒才会调用一次.
   * 对于高到您感觉不到的高频率执行的函数时非常有用.
   *
   * var throttled = M.util.throttle(updatePosition, 100);
   * $(window).scroll(throttled);
   *
   */
  utils.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : utils.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = utils.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  /**
   * @type function
   *
   * @name M.util.debounce(function, wait, [immediate])
   *
   * @description
   * 返回 function 函数的防反跳版本, 将延迟函数的执行(真正的执行)在函数最后一次调用时刻的 wait 毫秒之后.
   * 对于必须在一些输入（多是一些用户操作）停止到达之后执行的行为有帮助。
   * 例如: 渲染一个Markdown格式的评论预览, 当窗口停止改变大小之后重新计算布局, 等等.
   * 传参 immediate 为 true 会让debounce 在 wait 间隔之后触发最后的函数调用而不是最先的函数调用. 在类似不小心点了提交按钮两下而提交了两次的情况下很有用.
   *
   * var lazyLayout = M.util.debounce(calculateLayout, 300);
   * $(window).resize(lazyLayout);
   *
   */
  utils.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = utils.now() - timestamp;

      if (last < wait && last > 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = utils.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  /**
   * @type function
   *
   * @name M.util.before(count, function)
   *
   * @description
   * 创建一个只能运行一次的函数. 该函数执行不超过指定的次数,
   *
   * var monthlyMeeting = M.util.before(3, askForRaise);
   * monthlyMeeting();
   * monthlyMeeting();
   * monthlyMeeting();
   * // the result of any subsequent calls is the same as the second call
   *
   */
  utils.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      } else {
        func = null;
      }
      return memo;
    };
  };

  /**
   * @type function
   *
   * @name M.util.once(function)
   *
   * @description
   * 创建一个只能运行一次的函数. 重复调用此修改过的函数会没有效果,
   * 只会返回第一次执行时返回的结果. 作为初始化函数使用时非常有用,
   * 不用再设一个boolean值来检查是否已经初始化完成.
   *
   * var initialize = M.util.once(createApplication);
   * initialize();
   * initialize();
   * // Application只会创建一次.
   *
   */
  utils.once = utils.partial(utils.before, 2);


  // Utility Functions
  // -----------------

  /**
   * @type function
   *
   * @name M.util.noop()
   *
   * @description
   * Returns undefined irrespective of the arguments passed to it.
   *
   * obj.initialize = M.util.noop;
   *
   */
  utils.noop = function() {};

  utils.iteratee = function(value, context, argCount) {
    if (value == null) return utils.identity;
    if (utils.isFunction(value)) return createCallback(value, context, argCount);
    if (utils.isObject(value)) return utils.matches(value);
    return utils.property(value);
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  utils.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  /**
   * @type function
   *
   * @name M.util.random(min, max)
   *
   * @description
   * 返回最小值和最大值之间的一个随机数
   *
   * M.util.random(0, 100);
   * // >> 54
   */
  utils.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  /**
   * @type function
   *
   * @name M.util.now()
   *
   * @description
   * 返回当前时间的时间戳
   *
   * M.util.now();
   * // >> 1419488408850
   */
  utils.now = Date.now || function() {
    return new Date().getTime();
  };

  // Returns a function that will itself return the key property of any passed-in object.
  utils.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // If the value of the named property is a function then invoke it with the object as context; otherwise, return it.
  utils.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return utils.isFunction(value) ? object[property]() : value;
  };

  // Keep the identity function around for default iteratees.
  utils.identity = function(value) {
    return value;
  };

  /**
   * @type function
   *
   * @name M.util.uuid()
   *
   * @description
   * 返回一个随机的UUID
   *
   * M.util.now();
   * // >> 1419488408850
   */
  utils.uuid = function() {
    var S4 = function() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4());
  };


  // Dom Functions
  // -----------------

  var rAF = (function() {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 16);
      };
  })();
  /**
   * @type function
   *
   * @name M.util.requestAnimationFrame(callback)
   *
   * @description
   * 该方法通过在系统准备好绘制动画帧时调用该帧，从而为创建动画网页提供了一种更平滑更高效的方法.
   * 在此 API 之前，使用 setTimeout 和 setInterval 绘制的动画并没有为 Web 开发人员提供有效的方法来规划动画的图形计时器。
   * 这导致了动画过度绘制，浪费 CPU 周期以及消耗额外的电能等问题。而且，即使看不到网站，特别是当网站使用背景选项卡中的页面或浏览器已最小化时，动画都会频繁出现。
   *
   * var handle = setTimeout(renderLoop, PERIOD);
   * ->
   * var handle = requestAnimationFrame(renderLoop);
   */
  utils.requestAnimationFrame = function(cb) {
    return rAF(cb);
  };

  var cancelAF = window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.webkitCancelRequestAnimationFrame;
  /**
   * @type function
   *
   * @name M.util.cancelAnimationFrame(requestId)
   *
   * @description
   * 取消 Animation Frame Request
   *
   */
  utils.cancelAnimationFrame = function(requestId) {
    cancelAF(requestId);
  };

  /**
   * @description
   * When given a callback, if that callback is called 100 times between
   * animation frames, adding Throttle will make it only run the last of
   * the 100 calls.
   *
   * @param {function} callback a function which will be throttled to
   * requestAnimationFrame
   * @returns {function} A function which will then call the passed in callback.
   * The passed in callback will receive the context the returned function is
   * called with.
   */
  utils.animationFrameThrottle = function(cb) {
    var args, isQueued, context;
    return function() {
      args = arguments;
      context = this;
      if (!isQueued) {
        isQueued = true;
        utils.requestAnimationFrame(function() {
          cb.apply(context, args);
          isQueued = false;
        });
      }
    };
  };

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  utils.inherit = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && protoProps.hasOwnProperty('constructor')) {
      child = protoProps.constructor;
    } else {
      child = function() {
        return parent.apply(this, arguments);
      };
    }

    // Add static properties to the constructor function, if supplied.
    utils.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function() {
      this.constructor = child;
    };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) utils.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  module.exports = utils;
});

Mobird.util = function(obj) {
  if (obj instanceof Mobird.util) return obj;
  if (!(this instanceof Mobird.util)) return new Mobird.util(obj);
  this._wrapped = obj;
};

var __utils = require('m/utils');
__utils.each(__utils, function(fn, name) {
  Mobird.util[name] = fn;
});