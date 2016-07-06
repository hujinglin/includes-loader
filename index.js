var fs = require('fs')
var path = require('path')

var defaultOptions = {
  pattern: {
    re: /#include "(.+?)"/,
    index: 1
  },
  extensions: []
}

module.exports = function (source) {

  var loader = this

  loader.callback = loader.async()

  loader.cacheable()

  parse(loader, source)

}

function parse(loader, source) {

  try {
    var filepath = loader.resourcePath
    var filepathParse = path.parse(filepath)
    var options = Object.assign({}, defaultOptions, loader.options.includes)
    var data = source

    if (typeof options.pattern === 'function') {
      options.pattern = options.pattern(filepath)
    }

    if (!options.pattern) {
      options.pattern = defaultOptions.pattern
    } else if (!(
      options.pattern.re instanceof RegExp && 
      Number.isInteger(options.pattern.index) && 
      options.pattern.index > -1
    )) {
      throw new Error('includes-loader: pattern is invalid')
    }

    options.pattern.re = new RegExp(options.pattern.re, 'g')

    if (typeof options.extensions === 'function') {
      options.extensions = options.extensions(filepath)
    }

    if (Array.isArray(options.extensions) && options.extensions.length === 0) {
      options.extensions = [filepathParse.ext]
    } else if (!(
      Array.isArray(options.extensions) && 
      options.extensions.length > 0
    )) {
      throw new Error('includes-loader: extensions is invalid')
    }

    parseIncludes(loader, source, data, filepath, options)
    
  } catch (err) {
    loader.callback(err)
  }
}


function parseIncludes(loader, source, data, filepath, options) {
  try {
    var includes = []
    var filepathParse = path.parse(filepath)

    data.replace(options.pattern.re, function () {
      includes.push({
        target: arguments[0],
        path: arguments[options.pattern.index]
      })
    })

    if (includes.length === 0) {
      loader.callback(null, 'module.exports = ' + JSON.stringify(source))
    } else {
      includes.forEach(function (include) {
        var filebase = path.resolve(filepathParse.dir, include.path)
        var extensions = [].concat(options.extensions)
        parseSource(loader, source, include, filebase, extensions, options)
      })
    }
  } catch (err) {
    loader.callback(err)
  }
}

function parseSource(loader, source, include, filebase, extensions, options) {
  try {
    if (extensions.length < 1) {
      throw new Error('includes-loader: can not find file ' + filebase)
    } else {
      var filepath = filebase + extensions.shift()
      fs.readFile(filepath, 'utf-8', function (err, data) {
        if (err) {
          parseSource(loader, source, include, filebase, extensions, options)
        } else {
          source = source.replace(include.target, data)
          parseIncludes(loader, source, data, filepath, options)
          loader.dependency(filepath);
        }
      })
    }
  } catch (err) {
    loader.callback(err)
  }
}
