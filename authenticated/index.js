// native
const util = require('util');

// third-party
const Bluebird   = require('bluebird');
const superagent = require('superagent');

// the base client constructor
const BaseClient = require('../base');

const aux = require('../auxiliary');

const SHARED_CONSTANTS = require('../shared/constants');
const ROLES = SHARED_CONSTANTS.ROLES;
const errors = require('../shared/errors');

/**
 * Auxiliary function that authenticates a socket connection
 * @param  {AuthenticatedClient} client
 * @param  {Socket.io#Socket} socket
 * @param  {String} code
 * @param  {String} authToken
 * @return {Bluebird}
 */
function _authenticateSocketConnection(client, socket, authToken, code) {

  return new Bluebird(function (resolve, reject) {

    // removes auth success/error handlers
    function _off() {
      // remove auth event listeners
      socket.off(SHARED_CONSTANTS.AUTH_SUCCESS_EVENT, _onAuthSuccess);
      socket.off(SHARED_CONSTANTS.AUTH_ERROR_EVENT, _onAuthError);
    }

    function _resolve(res) {
      _off();
      resolve(res);
    }

    function _reject(err) {
      _off();
      console.warn('authentication error', err);
      reject(err);
    }

    function _onAuthSuccess() {
      _resolve();
    }

    function _onAuthError(err) {
      _reject(new errors.AuthenticationError(err));
    }

    socket.once(SHARED_CONSTANTS.AUTH_SUCCESS_EVENT, _onAuthSuccess);
    socket.once(SHARED_CONSTANTS.AUTH_ERROR_EVENT, _onAuthError);

    socket.emit(SHARED_CONSTANTS.AUTH_REQUEST_EVENT, {
      authToken: authToken,
      code: code,
      role: ROLES.AUTHENTICATED_CLIENT,
    });

  })
  .then(function () {
    // client is authenticated

    var socket = client.socket;

    // save reference to the code
    client.code = code;
    
    // socket.io on the server adds '/#' to the socket client id.
    // The '/' stands for the default namespace
    // and the '#' is for rooom naming
    // https://github.com/socketio/socket.io/blob/master/lib/socket.js#L62
    // NOTE: since 1.5.0 this behavior is not anymore.
    // we'll keep the two versions around just in case,
    // but it seems to have been solved.
    // https://github.com/socketio/socket.io/releases/tag/1.5.0

    // set the ipc node's id to match the socket's id
    // client.id = '/#' + socket.id;
    client.id = socket.id;

    return;
  });
}


/**
 * Authenticated client constructor
 * @param {Object} options
 */
function AuthenticatedClient(options) {

  /**
   * Authenticated clients are both server and clients
   * @type {String}
   */
  options.type = 'both';

  BaseClient.call(this, options);
}
util.inherits(AuthenticatedClient, BaseClient);

/**
 * Method used to connect and authenticate the client
 * with the server.
 *   
 * @param  {String} code
 * @param  {String} authToken
 * @return {Promise -> undefined}           
 */
AuthenticatedClient.prototype.connect = function (authToken, code) {
  if (!code) { throw new Error('code is required'); }

  var self = this;

  return aux._connectSocket(this.serverURI)
    .then(function (socket) {
      // client is connected
      self.socket = socket;

      return _authenticateSocketConnection(self, socket, authToken, code);
    })
    .then(function () {
      // client is authenticated
      var socket = self.socket;

      // connect the socket messages to the Intercomm#handleMessage method
      socket.on(SHARED_CONSTANTS.MESSAGE_EVENT, self.handleMessage);

      /**
       * Handle socket.io socket's events
       * connect
       * error
       * disconnect
       * reconnect
       * reconnect_attempt
       * reconnecting
       * reconnect_error
       * reconnect_failed
       */
      socket.on('connect', function () { console.log('connect'); });
      socket.on('error', function () { console.log('error'); });
      socket.on('disconnect', function () { console.log('disconnect'); });
      socket.on('reconnect', function () {
        _authenticateSocketConnection(self, socket, authToken, code)
          .then(function () {
            console.log('reauth successful');
          })
          .catch(function (err) {
            console.log('reauth error', err);
          });
      });
      socket.on('reconnect_attempt', function () { console.log('reconnect_attempt'); });
      socket.on('reconnecting', function () { console.log('reconnecting'); });
      socket.on('reconnect_error', function () { console.log('reconnect_error'); });
      socket.on('reconnect_failed', function () { console.log('reconnect_failed'); });

      // return nothing for the promise
      return;

    });
};

AuthenticatedClient.prototype.ensureWorkspaceExists = function (authToken, code) {

  var self = this;

  return new Bluebird(function (resolve, reject) {
    superagent
      .post(self.serverURI + '/workspace/' + code + '/ensure-exists')
      .set('Authorization', 'Bearer ' + authToken)
      .end(function (err, res) {
        if (err) {
          if (res && res.body && res.body.error) {
            reject(res.body.error);
          } else {
            reject(err);
          }

          return;
        }

        resolve(res.body.data);
      });
  });
};

aux.assign(AuthenticatedClient.prototype, require('./h-fs'));
aux.assign(AuthenticatedClient.prototype, require('./workspaces'));

module.exports = AuthenticatedClient;
