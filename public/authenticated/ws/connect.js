// third-party
const Bluebird = require('bluebird');

const aux = require('../../auxiliary');

const CONSTANTS = require('../../../shared/constants');
const ROLES = CONSTANTS.ROLES;
const errors = require('../../../shared/errors');

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
      socket.off(CONSTANTS.AUTH_SUCCESS_EVENT, _onAuthSuccess);
      socket.off(CONSTANTS.AUTH_ERROR_EVENT, _onAuthError);
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

    socket.once(CONSTANTS.AUTH_SUCCESS_EVENT, _onAuthSuccess);
    socket.once(CONSTANTS.AUTH_ERROR_EVENT, _onAuthError);

    socket.emit(CONSTANTS.AUTH_REQUEST_EVENT, {
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
 * Method used to connect and authenticate the client
 * with the server.
 *   
 * @param  {String} code
 * @param  {String} authToken
 * @return {Promise -> undefined}           
 */
exports.connect = function (authToken, code) {
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

      // set the connected property to true
      self.connected = true;

      /**
       * Handle h-workspace specific events
       * - message
       * - room-destroyed
       * - workspace-update-started
       * - workspace-update-finished
       * - workspace-update-failed
       */
      // connect the socket messages to the Intercomm#handleMessage method
      socket.on(CONSTANTS.MESSAGE_EVENT, self.handleMessage);

      /**
       * When the workspace room is destroyed,
       * a special event is emitted by the socket connection
       * This event MUST be handled by clients, as it indicates that 
       * the client connection is not valid anymore and a new
       * connection should be instantiated.
       */
      socket.on(
        CONSTANTS.ROOM_DESTROYED_EVENT,
        function () {
          self.connected = false;
          self.emit(CONSTANTS.ROOM_DESTROYED_EVENT);
        }
      );

      socket.on(
        CONSTANTS.WORKSPACE_EVENTS.UPDATE_STARTED,
        function () {
          // prevent any writes during update
          self.connected = false;
          self.emit(CONSTANTS.WORKSPACE_EVENTS.UPDATE_STARTED);
        }
      );

      socket.on(
        CONSTANTS.WORKSPACE_EVENTS.UPDATE_FINISHED,
        function () {
          // reenable writes after update finished
          self.connected = true;
          self.emit(CONSTANTS.WORKSPACE_EVENTS.UPDATE_FINISHED);
        }
      );

      socket.on(
        CONSTANTS.WORKSPACE_EVENTS.UPDATE_FAILED,
        function () {
          // reenable writes after update finished
          self.connected = true;
          self.emit(CONSTANTS.WORKSPACE_EVENTS.UPDATE_FAILED);
        }
      );

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
      socket.on('disconnect', function () {
        self.connected = false;
      });
      socket.on('reconnect', function () {
        _authenticateSocketConnection(self, socket, authToken, code)
          .then(function () {
            self.connected = true;
            console.log('reauth successful');
          })
          .catch(function (err) {
            self.connected = false;
            console.log('reauth error', err);
          });
      });
      socket.on('reconnect_attempt', function () {
        self.connected = false;
        console.log('reconnect_attempt');
      });
      socket.on('reconnecting', function () {
        self.emit('reconnecting');

        self.connected = false;
        console.log('reconnecting');
      });
      socket.on('reconnect_error', function () {
        self.connected = false;
        console.log('reconnect_error');
      });
      socket.on('reconnect_failed', function () {
        self.connected = false;
        console.log('reconnect_failed');
      });

      // return nothing for the promise
      return;

    });
};
