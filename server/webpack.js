var webpackDevMiddleware = require('webpack-dev-middleware');
var webpack = require('webpack');

module.exports = function(configs){
  return configs.map((config) => {
    var compiler = webpack(config.compiler);
    return webpackDevMiddleware(compiler, config.server);
  });
};
