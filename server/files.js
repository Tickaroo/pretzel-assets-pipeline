var express = require('express');

module.exports = function(fileDirecories){
  var m = [];
  fileDirecories.forEach(function(publicDir){
    m.push(express.static(publicDir));
  });
  return m;
};
