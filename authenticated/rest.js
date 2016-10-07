// third-party
const superagent = require('superagent');
const Bluebird   = require('bluebird');

const errors = require('../shared/errors');

exports.getByProjectId = function (authToken, projectId) {
  if (!authToken) {
    return Bluebird.reject(new errors.Unauthorized());
  }

  if (!projectId) {
    return Bluebird.reject(new errors.InvalidOption('projectId', 'required', 'projectId is required'));
  }

  var serverURI = this.serverURI;

  return new Bluebird(function (resolve, reject) {
    superagent
      .get(serverURI + '/project/' + projectId + '/workspace')
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

exports.create = function (authToken, projectId, workspaceData) {
  if (!authToken) {
    return Bluebird.reject(new errors.Unauthorized());
  }

  if (!projectId) {
    return Bluebird.reject(new errors.InvalidOption('projectId', 'required', 'projectId is required'));
  }

  workspaceData = workspaceData || {};

  var serverURI = this.serverURI;

  return new Bluebird(function (resolve, reject) {
    superagent
      .post(serverURI + '/project/' + projectId + '/workspaces')
      .send(workspaceData)
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
