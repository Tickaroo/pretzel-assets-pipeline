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
  var entriesDirPath = path.join(src, 'entries');
  var entries = {};
  var buildEntries = function(dirPath, kind) {
    return function(filename) {
      var file = fs.statSync(filename);
      if (file.isDirectory()) { return; }
      var name = filename.replace(dirPath, '');
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
    // glob.sync(allFiles(path.join(src, 'stylesheets'))).forEach(buildEntries(path.join(src, 'stylesheets'), 'stylesheets/'));
    // might be useful to compile css with webpack
    glob.sync(allFiles(entriesDirPath)).forEach(buildEntries(entriesDirPath, 'entries'));
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
    entries[vendor] = Object.keys(vendors[vendor]);
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

function getMinifyPlugin() {
  return new webpack.optimize.UglifyJsPlugin({
    sourceMap: true,
    minimize: true,
    output: {
      comments: false,
    },
  });
}

function getPlugins(config, shouldMinify, manifestData) {
  var plugins = [];

  /*
  maybe useful later
  if (config.plugins.indexOf('extractText') !== -1) {
    plugins.push(new ExtractTextPlugin('[name].css'));
  }
  */

  if (shouldMinify && config.plugins.indexOf('minify') !== -1) {
    plugins.push(getMinifyPlugin());
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

function getJsFilename(hashedName, digestLength){
  if (hashedName) {
    return '[name].[chunkhash:' + digestLength + '].js';
  }
  else {
    return '[name].js';
  }
}

module.exports = function(options) {
  var config = Object.assign({
    digestLength: 8,
    dll: {},
    path: {},
    loaders: [],
    plugins: ['minify', 'manifest']
  }, options);
  config.dev = Object.assign({
    port: 4010,
    noLog: true,
    lazy: true,
    sourceMap: 'cheap-module-source-map',
  }, options.dev);

  var normalizedPublicPath = path.join(config.path.public);

  return {
    getDllConfig: (o) => {
      o = o || {};
      return {
        devtool: 'source-map',
        entry: getVendorEntryPoints(config.dll),
        output: {
          filename: getJsFilename(o.hashedName, config.digestLength),
          path: path.join(config.path.dest, 'dll'),
          publicPath: normalizedPublicPath,
          libraryTarget: 'var',
          library: '[name]_lib',
        },
        resolve: {
          extensions: config.extensions,
          alias: mergedVendorMoudle(config.dll),
        },
        plugins: [
          getMinifyPlugin(),
          new webpack.DllPlugin({
            path: path.join(config.path.dest, 'dll', '[name].json'),
            name: '[name]_lib',
          }),
          new AssetsPlugin({
            update: true,
            filename: 'manifest-entries+dll.json',
            path: config.path.dest,
            processOutput: function (assets) {
              var dllMainfest = {};
              Object.keys(assets).forEach((key) => {
                var dllKey, dllValue;
                if (key.substr(0, 4) === 'dll/') {
                  dllKey = key;
                  dllValue = path.join(
                    normalizedPublicPath,
                    assets[key].js.replace(normalizedPublicPath, '')
                  );
                }
                else {
                  dllKey = path.join('dll', key);
                  dllValue = path.join(
                    normalizedPublicPath,
                    'dll',
                    assets[key].js.replace(normalizedPublicPath, '')
                  );
                }
                dllMainfest[dllKey] = {
                  js: dllValue,
                };
              });
              return JSON.stringify(dllMainfest, null, 2);
            }
          }),
        ],
      };
    },
    getEntryConfig: (o) => {
      o = o || {};
      return {
        devtool: o.sourceMap,
        module: {
          rules: config.loaders,
        },
        context: config.path.src,
        entry: getEntryPoints(config.path.src, 'entries'),
        output: {
          filename: getJsFilename(o.hashedName, config.digestLength),
          path: config.path.dest,
          publicPath: normalizedPublicPath,
        },
        resolve: {
          symlinks: false,
          extensions: config.extensions,
          alias: mergedVendorMoudle(config.dll),
        },
        plugins: getPlugins(config, o.shouldMinify, o.manifestData),
      };
    },
    getDevEntryConfig: (entriesConfig) => {
      var devConfigs = Object.keys(entriesConfig.entry).map((entry) => {
        var newEntry = {};
        newEntry[entry] = entriesConfig.entry[entry];
        return {
          compiler: Object.assign({}, entriesConfig, {entry: newEntry})
        };
      });
      devConfigs.forEach((devConfig) => {
        var firstAndOnlyEntryPath = Object.keys(devConfig.compiler.entry)[0];
        devConfig.server = {
          publicPath: entriesConfig.output.publicPath,
          lazy: config.dev.lazy,
          noInfo: config.dev.noLog,
          filename: new RegExp(firstAndOnlyEntryPath),
          stats: {
            hash: false,
            cached: false,
            cachedAssets: false,
            colors: true,
          },
        };
      });
      return devConfigs;
    },
    getDigestLength: () => {
      return config.digestLength;
    },
    getDestinationDirectory: () => {
      return config.path.dest;
    },
    getPublicPrefix: () => {
      return normalizedPublicPath;
    },
    getDevConfig: () => {
      return config.dev;
    },
    getPathConfig: () => {
      return {
        public: normalizedPublicPath,
        port: config.dev.port,
      };
    },
    getSassConfig: (o) => {
      o = o || {};
      var hasSourceMap = !!o.sourceMap;
      return {
        sourceMap: hasSourceMap,
        sourceMapEmbed: hasSourceMap,
        sourceMapContents: hasSourceMap,
        src: path.join(config.path.src, 'stylesheets'),
        dest: path.join(config.path.dest, 'stylesheets'),
        prefix: path.join(config.path.public, 'stylesheets'),
        indentedSyntax: true,
        noLog: config.dev.noLog,
      };
    },
    getFileDirecories: () => {
      return getPublicDirecories(config.publicFileDirecories);
    },
  };
};
