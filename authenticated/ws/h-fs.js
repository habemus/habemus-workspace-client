// third-party dependencies
const Bluebird = require('bluebird');

const HFS_METHODS = [
  // create
  'createFile',
  'createDirectory',
  
  // read
  'readFile', // defined in fs methods
  'readDirectory',
  
  // update
  'updateFile',
  
  // move
  'move',
  
  // removal
  'remove',

  // path
  'pathExists',

  // file watching,
  'startWatching',
  'stopWatching'
];

HFS_METHODS.forEach(function (method) {
  exports[method] = function () {
    var args = Array.prototype.slice.call(arguments, 0);
    
    return Bluebird.resolve(this.exec('h-fs', method, args));
  };
});
