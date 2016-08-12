var path = require('path');

module.exports = function(grunt, config) {

  var files = null;
  var mainDest = config.getDestinationDirectory();
  var manifestFilesPath = path.join(mainDest, 'manifest-files.json');
  var manifestCssPath = path.join(mainDest, 'manifest-stylesheets.json');
  var sassConfig = config.getSassConfig();
  var stylesheetsDir = sassConfig.dest;
  var stylesheetsTempDir = path.join(stylesheetsDir, 'temp');
  var filerevFiles = [];
  var fileDirecories = config.getFileDirecories();
  fileDirecories.forEach((file) => {
    filerevFiles.push({
      expand: true,
      cwd: file,
      src: '**/*',
      dest: path.join(mainDest, 'files')
    });
  });

  grunt.registerMultiTask('filerev_assets_cleanup', 'cleanup absolute paths', function() {
    var options = this.options();
    this.files.forEach((file) => {
      var manifestData = grunt.file.readJSON(file.src[0]);
      var newManifestData = {};
      Object.keys(manifestData).forEach((key) => {
        options.keys.forEach((keyPath) => {
          if (key.indexOf(keyPath) === 0) {
            var newKey = key.replace(keyPath, '');
            var newValue = manifestData[key].replace(options.value, '');
            newManifestData[newKey] = path.join(options.prependValue, newValue);
          }
        });
      });
      grunt.file.write(file.src[0], JSON.stringify(newManifestData));
      grunt.log.writeln('File', file.src[0].replace(options.value, ''), 'created.');
    });
  });

  grunt.registerTask('pretzel-update-webpack-entries-config', function() {
    grunt.config.merge({
      webpack: {
        'pretzel-entries': config.getEntryConfig({
          sourceMap: grunt.option('sourceMap') || 'cheap-module-source-map',
          hashedName: true,
          shouldMinify: true,
          manifestData: grunt.file.read(manifestFilesPath)
        })
      }
    });
  });

  grunt.registerTask('pretzel-build-javascript', 'Build dll and entry files with webpack', [
    'webpack:pretzel-dll',
    'pretzel-update-webpack-entries-config',
    'webpack:pretzel-entries'
  ]);

  grunt.registerTask('pretzel-build-stylesheets', 'Build stylesheet files with sass and put into `dist` dir and add digest to file names', [
    'sass:pretzel',
    'filerev:pretzel-css-temp',
    'clean:pretzel-css-temp',
    'filerev_assets:pretzel-css',
    'filerev_assets_cleanup:pretzel-css',
    'replace:pretzel-css',
  ]);

  grunt.registerTask('pretzel-build-files', 'Move other files from variouse `public/` dirs into `dist` and add digest to file names', [
    'filerev:pretzel-files',
    'filerev_assets:pretzel-files',
    'filerev_assets_cleanup:pretzel-files',
  ]);

  grunt.registerTask('pretzel-build-assets', 'Clean, build, move and add digest to all assets', [
    'clean:pretzel',
    'pretzel-build-files',
    'pretzel-build-javascript',
    'pretzel-build-stylesheets'
  ]);

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-filerev');
  grunt.loadNpmTasks('grunt-filerev-assets');
  grunt.loadNpmTasks('grunt-text-replace');

  return {
    clean: {
      pretzel: mainDest,
      'pretzel-css-temp': stylesheetsTempDir
    },
    filerev: {
      options: {
        algorithm: 'md5',
        summary: 'foo',
        length: 8
      },
      'pretzel-css-temp': {
        expand: true,
        cwd: stylesheetsTempDir,
        src: '**/*',
        dest: stylesheetsDir
      },
      'pretzel-files': {
        files: filerevFiles
      },
    },
    filerev_assets: {
      'pretzel-files': {
        options: {
          dest: manifestFilesPath,
        }
      },
      'pretzel-css': {
        options: {
          dest: manifestCssPath,
        }
      },
    },
    filerev_assets_cleanup: {
      'pretzel-files': {
        options: {
          keys: fileDirecories,
          value: mainDest,
          prependValue: config.getPublicPrefix()
        },
        src: manifestFilesPath,
      },
      'pretzel-css': {
        options: {
          keys: [stylesheetsTempDir],
          value: mainDest,
          prependValue: config.getPublicPrefix()
        },
        src: manifestCssPath,
      },
    },
    webpack: {
      'pretzel-dll': config.getDllConfig(grunt.option('hashedName'))
    },
    sass: {
      pretzel: {
        options: {
          sourceMap: false,
          outputStyle: 'compressed'
        },
        expand: true,
        cwd: sassConfig.src,
        src: path.join('**', '*.{sass,scss}'),
        dest: stylesheetsTempDir,
        ext: '.css'
      }
    },
    replace: {
      'pretzel-css': {
        expand: true,
        src: path.join(stylesheetsDir, '**', '*.css'),
        overwrite: true,
        replacements: [
          {
            from: /url\((.*?)\)/g,
            to: function(matchedWord, index, fullText, regexMatches) {
              if (matchedWord.indexOf('url(data:') === 0) {
                return matchedWord;
              }

              if ( ! files) {
                files = grunt.file.readJSON(manifestFilesPath);
              }

              var file = regexMatches[0] && regexMatches[0].replace(/\"|\'/g, '');
              if (file && files[file]) {
                return "url('" + files[file] + "')";
              }
              else {
                return matchedWord;
              }
            }
          }
        ]
      }
    }
  };
};
