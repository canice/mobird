/**
 * @type module
 *
 * @name M.require.lazyLoad
 *
 * @description
 * JavaScript, CSS文件延迟加载器
 *
 * 1. 支持JS文件异步加载依赖管理
 * 2. 支持文件客户端缓存管理
 *
 * 异步加载：
 *   M.require.lazyLoad(['a.js', 'a.css']);
 *   或
 *   M.require.lazyLoad('a.js,a.css');
 *
 * 依赖管理：
 *  使用操作符'<'定义依赖关系， x<y意味着：x文件依赖y文件，即y文件在x文件加载前加载
 *    M.require.lazyLoad(['a.js < b.js < c.js'], ['loadMeWhenEver.js', 'loadMeWhenEverAsWell.js']);
 *
 * 带有callback的延迟加载：
 *   M.require.lazyLoad(['a.js < b.js', 'loadMeWhenEver.js'], function() {
 *     // console.log('所有文件加载完毕！');
 *   });
 *
 * 缓存管理：
 *  M.require.lazyLoad(['a.js','b.js','a.js']); a.js文件只会被加载一次
 *
 */
Mobird.require.lazyLoad = (function() {

  var cachedFiles = {};

  var dumpError = function(msg) {
    console.log('~ M.require.lazyLoad 延迟加载错误: ' + msg);
  };

  var extractFileExtention = function(fileString) {
    var ext = fileString.split(/\#|\?/)[0].split('.').pop();
    if (!/^\w+$/.test(ext)) {
      dumpError('没有指定文件 ( ' + fileString + ' ) 扩展名');
      return false;
    } else {
      return ext;
    }
  };

  var buildFileObject = function(fileString) {
    var fileObj = {};
    fileObj.ext = extractFileExtention(fileString);
    if (fileObj.ext) {
      fileObj.path = fileString.split(/\#|\?/)[0];
      return fileObj;
    } else {
      return false;
    }
  };

  var getXmlHttp = function() {
    if (window.XMLHttpRequest) {
      var xmlhttp = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
      var xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
    }
    if (xmlhttp === null) {
      dumpError('你的浏览器不支持 XMLHTTP');
    }
    return xmlhttp;
  };

  var createDomElement = function(fileObj) {
    switch (fileObj.ext) {
      case 'css':
        var elm = document.createElement('link');
        elm.href = fileObj.path;
        elm.rel = 'stylesheet';
        return elm;
      case 'js':
        var elm = document.createElement('script');
        elm.src = fileObj.path;
        elm.type = 'text/javascript';
        return elm;
      default:
        dumpError('暂不支持该文件扩展类型 ( ' + fileObj.ext + ' ) 文件');
        return false;
    }
  };

  return function(files, externalClbk) {

    var removeFileString = function(fileString) {
      return function() {
        for (var i = 0, len = files.length; i < len; i++) {
          if (files[i] === fileString) {
            files.splice((i > 0 ? i-- : i), 1);
          }
        }
        if (!files.length) {
          externalClbk();
        }
      };
    };

    var stageFileString = function(fileString, clbk) {
      //if any case of 'file1,file2,file3' (not an array of files)
      var fileSrtingArr = fileString.split(',');
      for (var i = 0, len = fileSrtingArr.length; i < len; i++) {
        if (typeof(cachedFiles[fileSrtingArr[i]]) === 'undefined') {
          // If not cached, Loading the file
          var fileObj = buildFileObject(fileString);
          if (fileObj) {
            //valid file
            loadFile(fileObj, clbk);
          } else {
            break;
          }
        }
      }
    };

    var loadFile = function(fileObj, clbk) {
      cachedFiles[fileObj.path] = 1;

      var elm = createDomElement(fileObj),
        done = false,
        head = document.getElementsByTagName('head')[0];
      if (elm) {
        head.appendChild(elm);
        if (fileObj.ext === 'css') {
          //Hack for listening to link tag onload event
          var img = document.createElement('img');
          img.onerror = function() {
            if (typeof(clbk) !== 'undefined') {
              clbk();
            }
          };
          img.src = '#';
        } else {
          // js file
          elm.onload = elm.onreadystatechange = function() {
            if (!done && (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete')) {
              done = true;
              // Handle memory leak in IE
              elm.onload = elm.onreadystatechange = null;
              if (head && elm.parentNode) {
                head.removeChild(elm);
              }
              if (typeof(clbk) !== 'undefined') {
                clbk();
              }
            }
          };
        }
      }
    };

    files = files instanceof Array ? files : [files];
    for (var i = 0, len = files.length; i < len; i++) {
      var fileString = files[i].replace(/\s+/g, ''); //strip spaces

      if (fileString.lastIndexOf('<') > 2) {
        //Handling dependencies
        (function() {
          var filesString = files[i];
          var dependencies = fileString.split('<');
          return (function loadDependency() {
            if (dependencies.length) {
              //loading dependencies recursively
              stageFileString(dependencies.pop(), loadDependency);
            } else {
              // no more dependencies, remove file string (dependencies string)
              removeFileString(filesString)();
            }
          }());
        }());
      } else {
        //load non-decadency file string asynchronously
        stageFileString(fileString, removeFileString(files[i]));
      }
    }
  };

})();