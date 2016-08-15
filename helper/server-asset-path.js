module.exports = function(manifestsEntriesAndDll, manifestsStylesheets, assetsPathConfig) {
  if (manifestsEntriesAndDll && manifestsStylesheets) {
    return {
      js: function(name){
        var entry = manifestsEntriesAndDll['entries/' + name];
        if (entry) {
          return entry.js;
        }
      },
      dll: function(name){
        var dll = manifestsEntriesAndDll['dll/' + name];
        if (dll) {
          return dll.js;
        }
      },
      css: function(name){
        return manifestsStylesheets['/' + name + '.css'];
      },
    };
  }
  else if (assetsPathConfig) {
    return {
      dll: function(name) {
        return  assetsPathConfig.public + 'dll/' + name + '.js';
      },
      js: function(name) {
        return 'http://localhost:' + assetsPathConfig.port + assetsPathConfig.public + 'entries/' + name + '.js';
      },
      css: function(name) {
        return 'http://localhost:' + assetsPathConfig.port + assetsPathConfig.public + 'stylesheets/' + name + '.css';
      },
    };
  }
};
