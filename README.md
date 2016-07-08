# includes-loader

A webpack loader for any text file, and support nested includes with flexible options

## Install

``` shell
npm install  includes-loader --save-dev
```

## Usage
[Documentation: Using loaders](http://webpack.github.io/docs/using-loaders.html)

``` javascript
var confStr = require('includes!./file.conf')'
// confStr is 'foo\nbar\nconf'
```
__Details as follow__

directory

```
├── file.conf
└── foo
    ├── part.conf
    └── bar
       └── part.conf
```

./file.conf
```
#include "./foo/part"
conf
```

./foo/part.conf
```
foo
#include "./bar/part"
```

./foo/bar/part.conf
```
bar
```


## Configuration

### includes options

__default options__

``` javascript
includes: {
  pattern: {
    re: /#include\s+?"(.+?)";*?/,
    index: 1
  },
  extensions: [] // the extension will be same to the including file
}
```


__pattern__

An object that should be used to specify how to match the include statement 
_patten.re_ is the RegExp to match the include statement
_patten.index_ is the index of filepath in the matched results

``` javascript
\\ can be set to a function with filepath argument
pattern: function (filepath) {
  var pattern
  if (/\.html$/.test(filepath)) {
    pattern = {
      re: /<!--#\s*?include\s+?virtual=("|')(.+?)\1\s*?-->/,
      index: 2
    }
  }
  return pattern
}
```


__extensions__

An array of extensions that should be used to resolve includes, If you include file with their own extension (e.g. #include './somefile.ext'), you must add an empty string in the array.

``` javascript
\\ can be set to a function with filepath argument
extensions: function (filepath) {
  var extensions
  if (/\.html$/.test(filepath)) {
    extensions = ['', '.html', '.shtml', '.htm']
  } else if (/\.glsl$/.test(filepath)) {
    extensions = ['', '.glsl', '.vert', '.frag']
  }
  return extensions
}
```

### expamle webpack.config

``` javascript
module.exports = {
  module: {
    module: {
      loaders: [{
        test: /\.html$/,
        loader: 'html!includes'
      }, {
        test: /\.glsl$/,
        loader: 'includes'
      }]
    }
  },
  includes: {
    extensions: function (filepath) {
      var extensions
      if (/\.html$/.test(filepath)) {
        extensions = ['', '.html', '.shtml', '.htm']
      } else if (/\.glsl$/.test(filepath)) {
        extensions = ['', '.glsl', '.vert', '.frag']
      }
      return extensions
    },
    pattern: function (filepath) {
      var pattern
      // only custom includes pattern for html
      if (/\.html$/.test(filepath)) {
        pattern = {
          re: /<!--#\s*?include\s+?virtual=("|')(.+?)\1\s*?-->/,
          index: 2
        }
      }
      return pattern
    }
  }
};
```


## License
MIT (http://www.opensource.org/licenses/mit-license.php)
