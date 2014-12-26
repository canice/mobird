define('m/viewport', function(require, exports, module) {

  var __platform = require('m/platform');

  var viewportTag;
  var viewportProperties = {};

  function viewportLoadTag() {
    var x;

    for (x = 0; x < document.head.children.length; x++) {
      if (document.head.children[x].name == 'viewport') {
        viewportTag = document.head.children[x];
        break;
      }
    }

    if (viewportTag) {
      var props = viewportTag.content.toLowerCase().replace(/\s+/g, '').split(',');
      var keyValue;
      for (x = 0; x < props.length; x++) {
        if (props[x]) {
          keyValue = props[x].split('=');
          viewportProperties[keyValue[0]] = (keyValue.length > 1 ? keyValue[1] : '_');
        }
      }
      viewportUpdate();
    }
  }

  function viewportUpdate() {
    // unit tests in viewport.unit.js

    var initWidth = viewportProperties.width;
    var initHeight = viewportProperties.height;
    var p = __platform;
    var version = p.version();
    var DEVICE_WIDTH = 'device-width';
    var DEVICE_HEIGHT = 'device-height';
    var orientation = viewport.orientation();

    // Most times we're removing the height and adding the width
    // So this is the default to start with, then modify per platform/version/oreintation
    delete viewportProperties.height;
    viewportProperties.width = DEVICE_WIDTH;

    if (p.isIPad()) {
      // iPad

      if (version > 7) {
        // iPad >= 7.1
        // https://issues.apache.org/jira/browse/CB-4323
        delete viewportProperties.width;

      } else {

        // iPad <= 6.1 Browser
        if (version < 7) {
          viewportProperties.height = '0';
        }
      }

    } else if (p.isIOS()) {

      // iPhone Browser

      if (version < 7) {
        // iPhone <= 6.1 Browser
        // if height was set it needs to get removed with this hack for <= 6.1
        if (initHeight) viewportProperties.height = '0';
      }

    }

    // only update the viewport tag if there was a change
    if (initWidth !== viewportProperties.width || initHeight !== viewportProperties.height) {
      viewportTagUpdate();
    }
  }

  function viewportTagUpdate() {
    var key, props = [];
    for (key in viewportProperties) {
      if (viewportProperties[key]) {
        props.push(key + (viewportProperties[key] == '_' ? '' : '=' + viewportProperties[key]));
      }
    }

    viewportTag.content = props.join(', ');
  }

  var viewport = {
    orientation: function() {
      // 0 = Portrait
      // 90 = Landscape
      // not using window.orientation because each device has a different implementation
      return (window.innerWidth > window.innerHeight ? 90 : 0);
    },

    syncUpdate: function() {
      viewportLoadTag();
      window.addEventListener('orientationchange', function() {
        setTimeout(viewportUpdate, 1000);
      }, false);
    }
  };

  module.exports = viewport;
});

Mobird.viewport = require('m/viewport');