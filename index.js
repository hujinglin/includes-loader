var fs = require('fs')
var path = require('path')

var defaultOptions = {
  pattern: {
    re: /#include\s+?"(.+?)";*?/,
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

    loader.source = source

    loader.options = options

    loader.includes = []

    parseIncludes(loader, filepath, source)

  } catch (err) {
    loader.callback(err)
  }

}

function parseIncludes(loader, filepath, data) {

  try {

    var fileparse = path.parse(filepath)

    data.replace(loader.options.pattern.re, function () {

      var include = {
        iDir: fileparse.dir,
        iPath: arguments[loader.options.pattern.index],
        iTarget: arguments[0],
        iExtensions: [].concat(loader.options.extensions)
      }

      loader.includes.push({include})

      parseFile(loader, include)

    })

  } catch (err) {
    loader.callback(err)
  }
}


function parseFile(loader, include) {
  try {
    var extension = include.iExtensions.shift()
    var filepath = path.resolve(include.iDir, include.iPath + extension)
    fs.readFile(filepath, 'utf-8', function (err, data) {
      if (err) {
        if (include.iExtensions.length) {
          parseFile(loader, include)
        } else {
          loader.callback(new Error('includes-loader: can not find file ' + filepath))
        }
      } else {
        var index = loader.includes.indexOf(include)
        loader.source = loader.source.replace(include.iTarget, data)
        loader.includes.splice(index, 1)
        parseIncludes(loader, filepath, data)
        if (loader.includes.length === 0) {
          loader.callback(null, 'module.exports = ' + JSON.stringify(loader.source))
        }
      }
    })
  } catch (err) {
    loader.callback(err)
  }
}














