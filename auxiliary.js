// native
const url = require('url');

// third-party dependencies
const socketIOClient = require('socket.io-client');
const Bluebird       = require('bluebird');

// own dependencies
const errors = require('./shared/errors');
const SHARED_CONSTANTS = require('./shared/constants');

const TRALING_SLASH_RE = /\/$/;
const STARTING_SLASH_RE = /^\//;

function _pathJoin(part1, part2) {
  return part1.replace(TRALING_SLASH_RE, '') + '/' + part2.replace(STARTING_SLASH_RE, '');
}

exports._pathJoin = _pathJoin;

/**
 * Auxiliary method that starts the
 * socket.io connection
 * @param  {String} serverURI
 * @return {Promise -> Socket.io Socket}
 */
exports._connectSocket = function _connectSocket(serverURI) {

  return new Bluebird(function (resolve, reject) {
    var parsedServerURI = url.parse(serverURI);

    var connectionOptions = {};

    if (parsedServerURI.path !== '/') {
      // use engine.io `path` option to inform location of the socket.io server
      // we must append /socket.io/ to the end of the string,
      // as the server is agnostic to its location and just uses
      // the default socket.io path.
      // 
      // https://github.com/socketio/engine.io-client#methods
      connectionOptions.path = _pathJoin(parsedServerURI.pathname, '/socket.io/');
    }

    // the connection URI should contain only
    // the protocol and the host! the path
    // is interpreted by socket.io as a `namespace`
    var connectionURI = url.format({
      protocol: parsedServerURI.protocol,
      host: parsedServerURI.host
    });

    var socket = socketIOClient(connectionURI, connectionOptions);

    function _onConnect() {

    }

    function _onConnectError(err) {

    }

    function _onConnectTimeout() {

    }

    function _onError(err) {
      
    }

    /**
     * Removes all event listeners that were set up
     * before connection.
     */
    function _off() {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('connect_timeout');
      socket.off('error');
    }

    function _resolve(res) {
      _off();
      resolve(res);
    }

    function _reject(err) {
      _off();
      reject(err);
    }

    socket.once('connect', function () {
      _resolve(socket);
    });
    socket.once('connect_error', function (err) {
      _reject(new errors.ConnectionError(err));
    });
    socket.once('connect_timeout', function () {
      _reject(new errors.ConnectionTimeoutError('socket.io connection timeout error'));
    });
    socket.once('error', function (err) {
      _reject(new errors.ConnectionError(err));
    });

  });
};

exports.assign = function (target, object) {
  if (Object.assign) {
    Object.assign(target, object);
  } else {
    for (var prop in object) {
      target[prop] = object[prop];
    }
  }
};
