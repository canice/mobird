var require, define;

(function() {
  var modules = {},
    requireStack = [],
    inProgressModules = {};

  function build(module) {
    var factory = module.factory,
      localRequire = function(id) {
        var resultantId = id;
        if (id.charAt(0) === '.') {
          resultantId = module.id.slice(0, module.id.lastIndexOf('.')) + '.' + id.slice(2);
        }
        return require(resultantId);
      };
    module.exports = {};
    delete module.factory;
    factory(localRequire, module.exports, module);
    return module.exports;
  }

  /**
   * @type core
   *
   * @name M.require
   *
   * @description
   * 引入定义好的模块
   *
   * 引入模块的方式：
   * 1. 在定义模块时，引入其它已经定义好的模块，直接使用 var xxx = require('xxx');
   * 2. 在非模块定义代码中，引入已经定义好的模块，使用 var xxx = M.require('xxx');
   *
   *   M.define('foo/title', function(require, exports, module) {
   *
   *     var utils = require('foo/utils');
   *
   *     exports.foo = function () {
   *       return utils.bar();
   *     };
   *     // TODO ...
   *
   *   });
   *
   *   =================================================================================
   *
   *  (function() {
   *
   *    var utils = M.require('foo/utils');
   *
   *    // TODO ...
   *
   *  })();
   *
   */
  require = function(id) {
    if (!modules[id]) {
      throw '模块 ' + id + ' 未定义！';
    } else if (id in inProgressModules) {
      var cycle = requireStack.slice(inProgressModules[id]).join('->') + '->' + id;
      throw '模块与模块不能循环调用: ' + cycle;
    }
    if (modules[id].factory) {
      try {
        inProgressModules[id] = requireStack.length;
        requireStack.push(id);
        return build(modules[id]);
      } finally {
        delete inProgressModules[id];
        requireStack.pop();
      }
    }
    return modules[id].exports;
  };

  /**
   *
   * @name M.define
   *
   * @description
   * 定义一个命名模块
   *
   *   M.define('foo/title', function(require, exports, module) {
   *     // 定义 foo/title 对象
   *   });
   *
   * 在模块定义中，如何导出一个对象或者若干个方法，以便用户使用 M.require('foo/title') 引入模块？
   *
   * 如果你熟悉CommonJS，你可以考虑使用 exports 为模块建立一个空object，该object可以立即被其他模块引用；
   * 或者可以使用 module.exports = {{object}} 方式。
   *
   *   M.define('foo/title', function(require, exports, module) {
   *     var utils = require('foo/utils');
   *
   *     exports.foo = function () {
   *       return utils.bar();
   *     };
   *
   *   });
   *
   *   =================================================================================
   *
   *   M.define('foo/title', function(require, exports, module) {
   *     var utils = require('foo/utils');
   *     var title = {};
   *
   *     title.foo = function () {
   *       return utils.bar();
   *     };
   *
   *     title.bar = function () {
   *
   *     };
   *
   *     module.exports = title;
   *
   *   });
   *
   */
  define = function(id, factory) {
    if (modules[id]) {
      throw '模块 ' + id + ' 已经存在，不能重复定义';
    }

    modules[id] = {
      id: id,
      factory: factory
    };
  };

  /**
   *
   * @name M.define.remove
   *
   * @description
   * 删除定义好的模块
   *
   * M.define.remove('foo/title');
   *
   */
  define.remove = function(id) {
    delete modules[id];
  };

  define.moduleMap = modules;
})();

Mobird.require = require;
Mobird.define = define;

