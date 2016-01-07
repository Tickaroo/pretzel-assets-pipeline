var webpackDevMiddleware = require('webpack-dev-middleware');
var webpack = require('webpack');

module.exports = function(config){
  var compiler = webpack(config);
  return webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
    lazy: true,
    stats: {
      colors: true
    }
  });
};
