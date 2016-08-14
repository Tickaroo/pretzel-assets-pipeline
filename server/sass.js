var sassMiddleware = require('node-sass-middleware');

module.exports = function(config){
  return sassMiddleware(Object.assign({
    debug: !config.noLog
  }, config));
};
