# pretzel-assets-pipeline
[![npm version](https://badge.fury.io/js/pretzel-assets-pipeline.svg)](https://www.npmjs.com/package/pretzel-assets-pipeline) [![Build Status](https://travis-ci.org/Tickaroo/pretzel-assets-pipeline.svg?branch=master)](https://travis-ci.org/Tickaroo/pretzel-assets-pipeline)

Isomorphic asset pipeline for **Pretzel** apps, it uses **webpack**, **node-sass** and **Grunt** to compile assets. Check out the [example project](https://github.com/Tickaroo/pretzel-assets-pipeline-example) to see this module in action.


The goals are:

- One simple configuration file across development, staging and production environments
- Fast build times in development and CI environment (with "true" lazy loading for webpack entries).
- Being able to require templates, stylesheets, images or other static files from other modules, on Node.js and in client-side code.

## Install

```bash
$ npm install --save-dev pretzel-assets-pipeline
```


## `pretzel_config.js`

### Options  

#### `path` (optional)  
- `src` directory where `entries/` and `stylesheets/` can be found.
- `dest` directory where the asset build will go to.
- `public` prefix that defines what the path scope for assets.

#### `publicFileDirecories` (optional)  
This will search for `public/` directories inside this directories and make all files available in dev server in development and move them to `files/` and add digest to filenames in production.

#### `dll` (optional)  
First level keys define the names of the DLL libs. Second level keys define the modules names that will go into the DLL lib. Second level value defines the path to that lib or the module name.

#### `loaders` (optional)  
[Same as webpack loaders](https://webpack.js.org/concepts/loaders/).

#### `plugins` (optional)  
(default: `['minify', 'manifest']`). List of plugins used in webpack.  
Available options:

- `'minify'` minifies javascript. Ignored on dev server.
- `'manifest'` creates javascript manifest file. Ignored on dev server.

#### `dev` (optional)  
- `port` (default: `4010`) set port for assets dev server.
- `noLog` (default: `true`) `true` will hide compiler logs, but still show errors traces.
- `lazy` (default: `true`) `true` compiles entries on http request, `false` precompiles all entries to memory on startup.
- `sourceMap` (default: `'cheap-module-source-map'`) set type of javascript source maps ([Available options](https://webpack.js.org/configuration/)).


### Example
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
grunt.initConfig({
  // feel free to add your additional tasks here
});

grunt.config.merge(pretzelConfig.getGruntConfig());
```

## `node-app.js` example

```javascript
var express = require('express');

var app = module.exports = express();

var assetsPathConfig = require('./assets/pretzel_config.js').getPathConfig();

var manifests = {};
if (process.env.NODE_ENV !== 'development') {
  manifests.files = require('./public/build/manifest-files.json');
  manifests.entriesAndDll = require('./public/build/manifest-entries+dll.json');
  manifests.stylesheets = require('./public/build/manifest-stylesheets.json');
}
app.locals.assets = require('pretzel-assets-pipeline/helper/asset-path')(manifests.files, assetsPathConfig);
app.locals.serverAssets = require('pretzel-assets-pipeline/helper/server-asset-path')(manifests.entriesAndDll, manifests.stylesheets, assetsPathConfig);

app.use(express.static('./public/'));

// …

```

## `browser-app.js` example

It is not possible to have access to `serverAssets` in browser.

```javascript
var assetPath = require('pretzel-assets-pipeline/helper/asset-path');

window.assets = assetPath(MANIFEST_FILES, {port: 4010});

// …

```

## `template.pug` example

```pug
html
  head
    link(href=serverAssets.css('test') media="all" rel="stylesheet")
    script(src=serverAssets.dll('vendor'))
    script(src=serverAssets.js('app'))

  body
    img(src=assets.image('test.jpg'))
    a(href=assets.file('test.txt'))
```



## Useful `scripts`

```javascript
  "scripts": {
    "assets:server:dev": "node ./assets/pretzel_server.js",
    "assets:clean":      "grunt clean:pretzel",
    "assets:build:dll":  "grunt webpack:pretzel-dll",
    "assets:build:all":  "grunt pretzel-build-assets --hashedName=true"
  }
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
│   │   │   ├── stuff.DIGEST.txt
│   │   ├── dll/
│   │   │   ├── chart_js.DIGEST.js
│   │   │   ├── chart_js.DIGEST.js.map
│   │   │   ├── chart_js.json
│   │   │   ├── vendor.DIGEST.js
│   │   │   ├── vendor.DIGEST.js.map
│   │   │   ├── vendor.json
│   │   ├── entries/
│   │   │   ├── app_a.DIGEST.js
│   │   │   ├── app_a.DIGEST.js.map
│   │   │   ├── app_b.DIGEST.js
│   │   │   ├── app_b.DIGEST.js.map
│   │   ├── stylesheets/
│   │   │   ├── style_a.DIGEST.css
│   │   │   ├── style_a.DIGEST.css.map
│   │   │   ├── style_b.DIGEST.css
│   │   │   ├── style_b.DIGEST.css.map
```

## What is DLL and why to use it

Read about [webpack's DLL in this blog post](https://robertknight.github.io/posts/webpack-dll-plugins/). This module will make using it even simpler.


## Gotchas

### `pug`
- Make sure to set `app.locals.basedir = __dirname;` in your express app and `loader: 'pug?root=' + path.resolve(__dirname, '../')` in your `pretzel_config.js` to be able to use `include /node_modules/module_a/template_a`.
- You can not have multiple `public/` directories or files with the same name.
