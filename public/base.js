// native dependencies
const util = require('util');

// third-party dependencies
const Intercomm = require('intercomm');

// own dependencies
const aux    = require('./auxiliary');
const errors = require('../shared/errors');

// constants
const TRAILING_SLASH_RE = /\/$/;

const SHARED_CONSTANTS = require('../shared/constants');

/**
 * The BaseClient constructor
 * @param {Object} options
 *        - apiVersion {String}
 *        - serverURI  {String}
 */
function BaseClient(options) {
  /**
   * The id is not assigned until the socket is connected
   * @type {String}
   */
  options.id = 'temporary-unconnected-client';

  Intercomm.call(this, options);

  if (!options.serverURI) { throw new TypeError('serverURI is required'); }

  // save the serverURI
  this.serverURI = options.serverURI.replace(TRAILING_SLASH_RE, '');

  /**
   * Indicates whether the client is connected via ws to the server
   * MUST be changed by the connecting and disconnecting methods
   */
  this.connected = false;
}

util.inherits(BaseClient, Intercomm);

/**
 * Make errors available both in the constructor and in the instance
 * @type {Object}
 */
BaseClient.errors = errors;
BaseClient.prototype.errors = errors;

/**
 * Define the sendMessage method (required by Intercomm interface)
 * @param  {Object} message
 */
BaseClient.prototype.sendMessage = function (message) {

  if (!this.connected) {
    // TODO: let intercomm handle sendMessage errors!
    throw new Error('socket not connected');
  }

  this.socket.emit(SHARED_CONSTANTS.MESSAGE_EVENT, message);
};

BaseClient.prototype.disconnect = function () {
  this.socket.disconnect();
};

BaseClient.prototype.subscribe = function (eventName, eventHandler) {
  this.on(eventName, eventHandler);
};

module.exports = BaseClient;
