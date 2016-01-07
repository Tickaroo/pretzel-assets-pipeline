var express = require('express');
var webpackAssetsMiddleware = require('./webpack.js');
var filesAssetsMiddleware = require('./files.js');
var sassAssetsMiddleware = require('./sass.js');

module.exports = function(config) {
  var app = express();
  var devConfig = config.getDevConfig();

  // webpack
  var webpackConfig = config.getEntryConfig({sourceMap: devConfig.sourceMap});
  app.use(webpackAssetsMiddleware(webpackConfig));

  // sass
  var sassConfig = config.getSassConfig();
  app.use(sassAssetsMiddleware(sassConfig));
  app.use(sassConfig.prefix, express.static(sassConfig.dest));

  // files
  var fileDirecories = config.getFileDirecories();
  if (fileDirecories.length) {
    app.use(filesAssetsMiddleware(fileDirecories));
  }

  app.listen(devConfig.port, () => console.log('prezel-assets-pipeline development server running on port: ' + devConfig.port));
};
