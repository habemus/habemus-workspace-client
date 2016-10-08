// native
const util = require('util');

// third-party
const Bluebird = require('bluebird');

// base client constructor
const BaseClient = require('./base');

const aux = require('./auxiliary');

const SHARED_CONSTANTS = require('../shared/constants');
const ROLES = SHARED_CONSTANTS.ROLES;
const errors = require('../shared/errors');

function _authenticateAnonymousSocketConnection(client, socket, code) {

  return new Bluebird(function (resolve, reject) {

    function _resolve(res) {
      _off();
      resolve(res);
    }

    function _reject(err) {
      _off();
      reject(err);
    }

    function _onAuthSuccess() {
      _resolve();
    }

    function _onAuthError(err) {
      var ErrConstructor = errors[err.name] || Error;
      _reject(new ErrConstructor('authentication failed'));
    }

    function _off() {
      socket.off(SHARED_CONSTANTS.AUTH_SUCCESS_EVENT, _onAuthSuccess);
      socket.off(SHARED_CONSTANTS.AUTH_ERROR_EVENT, _onAuthError);
    }

    socket.once(SHARED_CONSTANTS.AUTH_SUCCESS_EVENT, _onAuthSuccess);
    socket.once(SHARED_CONSTANTS.AUTH_ERROR_EVENT, _onAuthError);

    socket.emit(SHARED_CONSTANTS.AUTH_REQUEST_EVENT, {
      code: code,
      role: ROLES.ANONYMOUS_CLIENT,
    });

  });

}

/**
 * Anonymous client constructor
 * @param {Object} options [description]
 */
function AnonymousClient(options) {

  /**
   * Anonymous clients are only servers
   * @type {String}
   */
  options.type = 'server';

  BaseClient.call(this, options);

}
util.inherits(AnonymousClient, BaseClient);

/**
 * Method used to connect and authenticate the client
 * with the server.
 *   
 * @param  {String} code
 * @return {Promise -> undefined}           
 */
AnonymousClient.prototype.connect = function (code) {
  if (!code) { throw new Error('code is required'); }

  var self = this;

  return aux._connectSocket(this.serverURI)
    .then(function (socket) {
      // client is connected

      self.socket = socket;

      return new Bluebird(function (resolve, reject) {

        socket.once(SHARED_CONSTANTS.AUTH_SUCCESS_EVENT, function () {
          resolve();
        });

        socket.once(SHARED_CONSTANTS.AUTH_ERROR_EVENT, function (err) {
          reject(new errors.AuthenticationError('authentication failed'));
        });

        socket.emit(SHARED_CONSTANTS.AUTH_REQUEST_EVENT, {
          code: code,
          role: ROLES.ANONYMOUS_CLIENT,
        });

      });

    })
    .then(function () {
      // client is authenticated
      
      var socket = self.socket;

      socket.on('disconnect', function (message) {
        self.emit('disconnect');
      });

      // save reference to the code
      self.code = code;
      
      // socket.io on the server adds '/#' to the socket client id.
      // The '/' stands for the default namespace
      // and the '#' is for rooom naming
      // https://github.com/socketio/socket.io/blob/master/lib/socket.js#L62

      // set the ipc node's id to match the socket's id
      self.id = '/#' + socket.id;
  
      // connect the socket messages to the Intercomm#handleMessage method
      socket.on(SHARED_CONSTANTS.MESSAGE_EVENT, self.handleMessage);

      // return nothing for the promise
      return;

    });
};


module.exports = AnonymousClient;
