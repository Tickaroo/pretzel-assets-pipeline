var express = require('express');
var webpackAssetsMiddleware = require('./webpack.js');
var filesAssetsMiddleware = require('./files.js');
var sassAssetsMiddleware = require('./sass.js');
var cors = require('cors');

module.exports = function(config) {
  var app = express();
  var devConfig = config.getDevConfig();

  // allow cross-domain requests
  app.use(cors());

  // sass
  var sassConfig = config.getSassConfig(devConfig);
  app.use(sassAssetsMiddleware(sassConfig));
  app.use(sassConfig.prefix, express.static(sassConfig.dest));

  // files
  var fileDirecories = config.getFileDirecories();
  if (fileDirecories.length) {
    app.use(filesAssetsMiddleware(fileDirecories));
  }

  // webpack
  var webpackConfig = config.getDevEntryConfig(config.getEntryConfig(devConfig));
  app.use(webpackAssetsMiddleware(webpackConfig));

  app.listen(devConfig.port, () => console.log('pretzel-assets-pipeline development server running on port: ' + devConfig.port));
};
