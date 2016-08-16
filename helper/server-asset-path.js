function isUrl(name){
  return name.substring(0, 7) === 'http://' || name.substring(0, 8) === 'https://';
}

module.exports = function(manifestsEntriesAndDll, manifestsStylesheets, assetsPathConfig) {
  if (manifestsEntriesAndDll && manifestsStylesheets) {
    return {
      js: function(name){
        if (isUrl(name)) { return name; }
        var entry = manifestsEntriesAndDll['entries/' + name];
        if (entry) {
          return entry.js;
        }
      },
      dll: function(name){
        if (isUrl(name)) { return name; }
        var dll = manifestsEntriesAndDll['dll/' + name];
        if (dll) {
          return dll.js;
        }
      },
      css: function(name){
        if (isUrl(name)) { return name; }
        return manifestsStylesheets['/' + name + '.css'];
      },
    };
  }
  else if (assetsPathConfig) {
    return {
      dll: function(name) {
        if (isUrl(name)) { return name; }
        return  assetsPathConfig.public + 'dll/' + name + '.js';
      },
      js: function(name) {
        if (isUrl(name)) { return name; }
        return 'http://localhost:' + assetsPathConfig.port + assetsPathConfig.public + 'entries/' + name + '.js';
      },
      css: function(name) {
        if (isUrl(name)) { return name; }
        return 'http://localhost:' + assetsPathConfig.port + assetsPathConfig.public + 'stylesheets/' + name + '.css';
      },
    };
  }
};
