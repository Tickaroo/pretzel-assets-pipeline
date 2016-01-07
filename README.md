# pretzel-assets-pipeline
[![npm version](https://badge.fury.io/js/pretzel-assets-pipeline.svg)](https://www.npmjs.com/package/pretzel-assets-pipeline) [![Build Status](https://travis-ci.org/Tickaroo/pretzel-assets-pipeline.svg?branch=master)](https://travis-ci.org/Tickaroo/pretzel-assets-pipeline)

Isomorphic asset pipeline for Pretzel apps, it uses Webpack, Sass-lib and Grunt to compile assets.

## Install

```bash
$ npm install --save-dev pretzel-assets-pipeline
```


## `pretzel_config.js` example

```javascript
module.exports = require('pretzel-assets-pipeline')({
  extensions: ['', '.coffee', '.pug', '.js'],
  dll: {
    'vendor': {
      'jquery': path.resolve(__dirname, '../node_modules/jquery/dist/jquery.min.js'),
      'backbone': path.resolve(__dirname, '../node_modules/backbone/backbone-min.js'),
      'underscore': path.resolve(__dirname, '../node_modules/underscore/underscore-min.js')
    },
    'chart_js': {
      'chart.js': path.resolve(__dirname, '../node_modules/chart.js/dist/Chart.min.js'),
    }
  },
  loaders: [
    { test: /\.json$/, loader: 'json' },
    { test: /\.pug$/, loader: 'pug?root=' + path.resolve(__dirname, '../')  },
    { test: /\.coffee$/, loader: 'coffee' },
  ],
  publicFileDirecories: [
    path.resolve(__dirname, '../components'),
    path.resolve(__dirname, '../apps'),
    path.resolve(__dirname, '../node_modules/my_module_a')
  ],
  plugins: ['extractText', 'minify', 'manifest'],
  path: {
    src: path.resolve(__dirname, './'),
    dest: path.resolve(__dirname, '../public/build'), // must match with `public` value!
    public: '/build', // must match with `dest` value!
  }
});
```

## `pretzel_server.js` example

Use only for development!

```javascript
require('pretzel-assets-pipeline/lib/server')(require('./pretzel_config.js'));
```


## `Gruntfile.js` example

```javascript
var pretzelConfig = require('./assets/pretzel_config.js');
grunt.initConfig({});

grunt.config.merge(pretzelConfig.getGruntConfig());
```


## Source directory structure

```
├── assets/
│   ├── pretzel_config.js
│   ├── pretzel_server.js
│   ├── entries/
│   │   ├── app_a.js
│   │   ├── app_b.js
│   ├── stylesheets/
│   │   ├── style_a.sass
│   │   ├── style_b.sass
├── components/
│   ├── component_a/
│   │   ├── public/
│   │   │   ├── stuff.txt
├── Gruntfile.js
```



## Compiled directory structure

```
├── public/
│   ├── build/
│   │   ├── manifest-entries+dll.json
│   │   ├── manifest-stylesheets.json
│   │   ├── manifest-files.json
│   │   ├── files/
│   │   │   ├── stuff-DIGEST.txt
│   │   ├── dll/
│   │   │   ├── chart_js-DIGEST.js
│   │   │   ├── chart_js.json
│   │   │   ├── vendor-DIGEST.js
│   │   │   ├── vendor.json
│   │   ├── entries/
│   │   │   ├── app_a-DIGEST.js
│   │   │   ├── app_a-DIGEST.js.map
│   │   │   ├── app_b-DIGEST.js
│   │   │   ├── app_b-DIGEST.js.map
│   │   ├── stylesheets/
│   │   │   ├── style_a-DIGEST.css
│   │   │   ├── style_b-DIGEST.css
```
