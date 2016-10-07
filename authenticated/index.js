// native
const util = require('util');

// third-party
const Bluebird   = require('bluebird');
const superagent = require('superagent');

// the base client constructor
const BaseClient = require('../base');

const aux = require('../auxiliary');

const SHARED_CONSTANTS = require('../shared/constants');
const errors = require('../shared/errors');

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

aux.assign(AuthenticatedClient.prototype, require('./ws/connect'));
aux.assign(AuthenticatedClient.prototype, require('./ws/h-fs'));
aux.assign(AuthenticatedClient.prototype, require('./rest'));

module.exports = AuthenticatedClient;
