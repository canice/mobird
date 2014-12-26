// Save the previous value of the `M` variable.
var previousMobird = window.M;

var Mobird = {};
Mobird.VERSION = '0.3.0';

/**
 *  把 "M" 变量的控制权还给它原有的所有者, 返回一个 Mobird 对象的引用.
 *
 */
Mobird.noConflict = function() {
  window.M = previousMobird;
  return this;
};