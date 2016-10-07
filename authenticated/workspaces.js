// third-party
const superagent = require('superagent');
const Bluebird   = require('bluebird');

const errors = require('../../shared/errors');

exports.getWorkspaceByCode = function (authToken, identifier) {
  if (!authToken) {
    return Bluebird.reject(new errors.Unauthorized());
  }

  if (!identifier) {
    return Bluebird.reject(new errors.InvalidOption('identifier', 'required', 'identifier is required'));
  }

  var serverURI = this.serverURI;

  return new Bluebird(function (resolve, reject) {
    superagent
      .get(serverURI + '/workspace/' + identifier)
      .set('Authorization', 'Bearer ' + authToken)
      .end(function (err, res) {
        if (err) {

          reject(res.body.error);
          return;
        }

        resolve(res.body.data);
      });
  });
};

exports.createWorkspace = function (authToken, workspaceData) {
  if (!authToken) {
    return Bluebird.reject(new errors.Unauthorized());
  }

  if (!workspaceData.projectCode) {
    return Bluebird.reject(new errors.InvalidOption('projectCode', 'required', 'name is required'));
  }

  var serverURI = this.serverURI;

  return new Bluebird(function (resolve, reject) {
    superagent
      .post(serverURI + '/workspaces')
      .send(workspaceData)
      .set('Authorization', 'Bearer ' + authToken)
      .end(function (err, res) {
        if (err) {
          reject(res.body.error);
          return;
        }

        resolve(res.body.data);
      });
  });
};
