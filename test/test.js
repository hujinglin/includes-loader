var fs = require('fs')
var path = require('path')
var jsdom = require('jsdom')
var webpack = require('webpack')
var assert = require('chai').assert
var loaderPath = path.resolve(__dirname, '../')
var eol = require('os').EOL

function equal(actual, expected) {
  assert.equal(actual, expected.replace(/\n/g, eol))
}

var defaultConfig = {
  output: {
    path: path.resolve(__dirname, './output'),
    filename: 'bundle.js'
  }
}

describe('includes-loader', function() {

  it('default', function(done) {
    var config = Object.assign({}, defaultConfig, {
      entry: path.resolve(__dirname, './files/default.js'),
      module: {
        loaders: [{
          test: /\.conf$/,
          loader: loaderPath
        }]
      }
    })
    webpack(config, function(err, stats) {
      stats.compilation.errors.forEach(function (err) {
        console.error(err.message)
      })
      assert.lengthOf(stats.compilation.errors, 0)
      fs.readFile(path.resolve(__dirname, './output/bundle.js'), 'utf-8', function (err, data) {
        jsdom.env({
          html: '<!DOCTYPE html><html><head></head><body></body></html>',
          src: [data],
          done: function (err, window) {
            equal(window.confStr, 'foo\nbar\nfoo\nbar\nconf')
            done()
          }
        })
      })
    })
  })

  it('options', function(done) {
    var config = Object.assign({}, defaultConfig, {
      entry: path.resolve(__dirname, './files/options.js'),
      module: {
        loaders: [{
          test: /\.html$/,
          loader: loaderPath
        }, {
          test: /\.glsl$/,
          loader: loaderPath
        }]
      },
      includes: {
        pattern: function (filepath) {
          var pattern
          if (/\.html$/.test(filepath)) {
            pattern = {
              re: /<!--#\s*?include\s+?virtual=("|')(.+?)\1\s*?-->/,
              index: 2
            }
          }
          return pattern
        },
        extensions: function (filepath) {
          var extensions
          if (/\.html$/.test(filepath)) {
            extensions = ['', '.html', '.shtml', '.htm']
          } else if (/\.glsl$/.test(filepath)) {
            extensions = ['', '.glsl', '.vert', '.frag']
          }
          return extensions
        }
      }
    })
    webpack(config, function(err, stats) {
      stats.compilation.errors.forEach(function (err) {
        console.error(err.message)
      })
      assert.lengthOf(stats.compilation.errors, 0)
      fs.readFile(path.resolve(__dirname, './output/bundle.js'), 'utf-8', function (err, data) {
        jsdom.env({
          html: '<!DOCTYPE html><html><head></head><body></body></html>',
          src: [data],
          done: function (err, window) {
            equal(window.htmlStr, '<p>foo</p>\n<p>bar</p>\n<p>foo</p>\n<p>bar</p>\n<p>html</p>')
            equal(window.glslStr, '// foo\n// bar\n// foo\n// bar\n// glsl')
            done()
          }
        })
      })
    })
  })

})

