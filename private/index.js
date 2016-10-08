// third-party
const superagent = require('superagent');
const Bluebird   = require('bluebird');

const errors = require('../shared/errors');

// constants
const TRAILING_SLASH_RE = /\/$/;

function PrivateHWorkspaceClient(options) {
  // save the data
  this.serverURI = options.serverURI.replace(TRAILING_SLASH_RE, '');
}

PrivateHWorkspaceClient.prototype.get = function (authToken, identifier, options) {
  if (!authToken) {
    return Bluebird.reject(new errors.Unauthorized());
  }

  if (!identifier) {
    return Bluebird.reject(new errors.InvalidOption('identifier', 'required', 'identifier is required'));
  }

  options = options || {};

  var serverURI = this.serverURI;
  var query = {};

  if (options.byProjectId) {
    query.byProjectId = true;
  }

  if (options.byProjectCode) {
    query.byProjectCode = true;
  }

  return new Bluebird(function (resolve, reject) {
    superagent
      .get(serverURI + '/project/' + identifier + '/workspace')
      .query(query)
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

module.exports = PrivateHWorkspaceClient;
