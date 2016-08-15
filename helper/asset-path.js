module.exports = function(manifest, assetsPathConfig) {
  return {
    image: function(name){
      return this.file(name);
    },
    file: function(name){
      if (name.substring(0, 7) === 'http://' || name.substring(0, 8) === 'https://') {
        return name;
      }
      if (manifest) {
        return manifest['/' + name];
      }
      else if (assetsPathConfig) {
        return "http://localhost:" + assetsPathConfig.port + assetsPathConfig.public + name;
      }
    }
  };
};
