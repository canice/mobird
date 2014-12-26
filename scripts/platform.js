define('m/platform', function(require, exports, module) {

  var __utils = require('m/utils');

  var IOS = 'ios';
  var ANDROID = 'android';
  var WINDOWS_PHONE = 'windowsphone';

  var platformName = null, // just the name, like iOS or Android
    platformVersion = null; // a float of the major and minor, like 7.1

  var platform = {

    navigator: window.navigator,

    platforms: null,

    grade: null,

    ua: navigator.userAgent,

    detect: function() {
      platform._checkPlatforms();

      __utils.requestAnimationFrame(function() {
        // only add to the body class if we got platform info
        for (var i = 0; i < platform.platforms.length; i++) {
          document.body.classList.add('platform-' + platform.platforms[i]);
        }
      });
    },

    setGrade: function(grade) {
      var oldGrade = this.grade;
      this.grade = grade;
      __utils.requestAnimationFrame(function() {
        if (oldGrade) {
          document.body.classList.remove('grade-' + oldGrade);
        }
        document.body.classList.add('grade-' + grade);
      });
    },

    _checkPlatforms: function(platforms) {
      this.platforms = [];
      var grade = 'a';

      if (this.isIPad()) this.platforms.push('ipad');

      var platform = this.platform();
      if (platform) {
        this.platforms.push(platform);

        var version = this.version();
        if (version) {
          var v = version.toString();
          if (v.indexOf('.') > 0) {
            v = v.replace('.', '_');
          } else {
            v += '_0';
          }
          this.platforms.push(platform + v.split('_')[0]);
          this.platforms.push(platform + v);

          if (this.isAndroid() && version < 4.4) {
            grade = (version < 4 ? 'c' : 'b');
          } else if (this.isWindowsPhone()) {
            grade = 'b';
          }
        }
      }

      this.setGrade(grade);
    },

    isIPad: function() {
      if (/iPad/i.test(platform.navigator.platform)) {
        return true;
      }
      return /iPad/i.test(this.ua);
    },

    isIOS: function() {
      return this.is(IOS);
    },

    isAndroid: function() {
      return this.is(ANDROID);
    },

    isWindowsPhone: function() {
      return this.is(WINDOWS_PHONE);
    },

    platform: function() {
      // singleton to get the platform name
      if (platformName === null) this.setPlatform();
      return platformName;
    },

    setPlatform: function() {
      if (this.ua.indexOf('Android') > 0) {
        platformName = ANDROID;
      } else if (this.ua.indexOf('iPhone') > -1 || this.ua.indexOf('iPad') > -1 || this.ua.indexOf('iPod') > -1) {
        platformName = IOS;
      } else if (this.ua.indexOf('Windows Phone') > -1) {
        platformName = WINDOWS_PHONE;
      } else {
        platformName = platform.navigator.platform && navigator.platform.toLowerCase().split(' ')[0] || '';
      }
    },

    version: function() {
      // singleton to get the platform version
      if (platformVersion === null) this.setVersion();
      return platformVersion;
    },

    setVersion: function(v) {

      platformVersion = 0;

      // fallback to user-agent checking
      var pName = this.platform();
      var versionMatch = {
        'android': /Android (\d+).(\d+)?/,
        'ios': /OS (\d+)_(\d+)?/,
        'windowsphone': /Windows Phone (\d+).(\d+)?/
      };
      if (versionMatch[pName]) {
        v = this.ua.match(versionMatch[pName]);
        if (v && v.length > 2) {
          platformVersion = parseFloat(v[1] + '.' + v[2]);
        }
      }
    },

    is: function(type) {
      type = type.toLowerCase();
      // check if it has an array of platforms
      if (this.platforms) {
        for (var x = 0; x < this.platforms.length; x++) {
          if (this.platforms[x] === type) return true;
        }
      }
      // exact match
      var pName = this.platform();
      if (pName) {
        return pName === type.toLowerCase();
      }

      // A quick hack for to check userAgent
      return this.ua.toLowerCase().indexOf(type) >= 0;
    }

  };

  module.exports = platform;
});

Mobird.platform = require('m/platform');