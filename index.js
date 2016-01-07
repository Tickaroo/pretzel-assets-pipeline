var fs = require('fs');
var path = require('path');
var glob = require('glob');
var debug = require('debug')('pretzel-assets');
var webpack = require('webpack');
var AssetsPlugin = require('assets-webpack-plugin');

function allFiles(dir, extension) {
  return path.join(dir, '**', '*', (extension ? extension : ''));
}

function getEntryPoints(src) {
  var entries = {};
  var buildEntries = function(kind) {
    return function(filename) {
      var name = path.basename(filename);
      var extension = path.extname(name);
      var chunkName = name;
      if (extension) {
        // find extention, from: '.js' to: /\.js$/i
        var regex = new RegExp('\\' + extension + '$', 'i');
        chunkName = chunkName.replace(regex, '');
      }
      entries[kind + chunkName] = './' + kind + name; // "./" at the start is very important, don't use `path.join()`
    };
  };

  if (src) {
    //glob.sync(allFiles(path.join(src, 'stylesheets'))).forEach(buildEntries('stylesheets/'));
    glob.sync(allFiles(path.join(src, 'entries'))).forEach(buildEntries('entries/'));
  }
  debug(entries);
  return entries;
}

function getPublicDirecories(topLevelDirecotries){
  if ( ! topLevelDirecotries) {
    return [];
  }
  var publicDirecotries = [];
  topLevelDirecotries.forEach(function(topLevelDirecotry){
    glob.sync(path.join(topLevelDirecotry, '**', '*')).forEach(function(filename) {
      var file = fs.statSync(filename);
      if (file.isDirectory() && /public$/.test(filename)) {
        publicDirecotries.push(filename);
      }
    });
  });
  return publicDirecotries;
}

function getVendorEntryPoints(vendors) {
  if ( ! vendors) { return {}; }
  var entries = {};
  Object.keys(vendors).forEach((vendor) => {
    entries['dll/' + vendor] = Object.keys(vendors[vendor]);
  });
  return entries;
}

function mergedVendorMoudle(vendors) {
  if ( ! vendors) { return; }
  var merged = {};
  Object.keys(vendors).forEach((vendor) => {
    Object.keys(vendors[vendor]).forEach((vendorModule) => {
      if ( ! vendors[vendor][vendorModule]) { return; }
      merged[vendorModule] = vendors[vendor][vendorModule];
    });
  });
  return merged;
}

function getPlugins(config, shouldMinify, manifestData){
  var plugins = [];

  /*
  maybe useful later
  if (config.plugins.indexOf('extractText') !== -1) {
    plugins.push(new ExtractTextPlugin('[name].css'));
  }
  */

  if (shouldMinify && config.plugins.indexOf('minify') !== -1) {
    plugins.push(new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      output: {
        comments: false
      },
    }));
  }

  if (manifestData && config.plugins.indexOf('manifest') !== -1) {
    plugins.push(new AssetsPlugin({
      update: true,
      filename: 'manifest-entries+dll.json',
      path: config.path.dest,
      prettyPrint: true,
    }));
  }

  plugins.push(new webpack.DefinePlugin({
    MANIFEST_FILES: manifestData
  }));

  Object.keys(config.dll).forEach((vendor) => {
    var jsonDllPath = path.join(config.path.dest, 'dll', vendor + '.json');
    try {
      fs.accessSync(jsonDllPath);
      plugins.push(new webpack.DllReferencePlugin({
        context: '.',
        manifest: require(jsonDllPath)
      }));
    } catch(e) {
      console.warn('File not found, skiping DllReferencePlugin for "' + vendor + '"');
      console.warn(jsonDllPath);
    }
  });

  return plugins;
}

function getJsFilename(hashedName){
  return hashedName ? '[name]-[hash:6].js': '[name].js';
}

module.exports = function(options) {
  var config = {
    dll: {},
    path: {},
    loaders: [],
    plugins: ['minify', 'manifest']
  };
  Object.assign(config, options);

  return {
    getDllConfig: (hashedName) => {
      return {
        entry: getVendorEntryPoints(config.dll),
        output: {
          filename: getJsFilename(hashedName),
          path: config.path.dest,
          publicPath: path.join(config.path.public),
          libraryTarget: 'var',
          library: '[name]_lib'
        },
        resolve: {
          extensions: config.extensions,
          alias: mergedVendorMoudle(config.dll),
        },
        plugins: [
          new webpack.DllPlugin({
            path: path.join(config.path.dest, '[name].json'),
            name: '[name]_lib'
          }),
          new AssetsPlugin({
            update: true,
            filename: 'manifest-entries+dll.json',
            path: config.path.dest,
            prettyPrint: true,
          })
        ]
      };
    },
    getEntryConfig: (o) => {
      o = o || {};
      return {
        devtool: o.sourceMap,
        module: {
          loaders: config.loaders,
        },
        context: config.path.src,
        entry: getEntryPoints(config.path.src, 'entries'),
        output: {
          filename: getJsFilename(o.hashedName),
          path: config.path.dest,
          publicPath: path.join(config.path.public),
        },
        resolve: {
          extensions: config.extensions,
          alias: mergedVendorMoudle(config.dll)
        },
        plugins: getPlugins(config, o.shouldMinify, o.manifestData),
      };
    },
    getDestinationDirectory: () => {
      return config.path.dest;
    },
    getPublicPrefix: () => {
      return path.join(config.path.public);
    },
    getDevConfig: () => {
      return Object.assign({
        port: 4010
      }, config.dev);
    },
    getSassConfig: () => {
      return {
        src: path.join(config.path.src, 'stylesheets'),
        dest: path.join(config.path.dest, 'stylesheets'),
        prefix: path.join(config.path.public, 'stylesheets'),
        indentedSyntax: true,
      };
    },
    getFileDirecories: () => {
      return getPublicDirecories(config.publicFileDirecories);
    }
  };
};
