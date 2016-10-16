// third-party
const superagent = require('superagent');
const Bluebird   = require('bluebird');

const errors = require('../../shared/errors');

/**
 * Retrieves a workspace either by:
 *   - byProjectId
 *   - byProjectCode
 *   - byId
 * 
 * @param  {String} authToken
 * @param  {String} identifier
 * @param  {Object} options
 *                   - byProjectId: Boolean
 *                   - byProjectCode: Boolean
 * 
 * @return {Bluebird -> Workspace}
 */
exports.get = function (authToken, identifier, options) {
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

/**
 * Ensures the workspace of a project is ready for use.
 * 
 * @param  {String} authToken
 * @param  {String} identifier
 * @param  {Object} workspaceData
 * @return {Bluebird -> Workspace}
 */
exports.ensureReady = function (authToken, identifier, workspaceData) {
  if (!authToken) {
    return Bluebird.reject(new errors.Unauthorized());
  }

  if (!identifier) {
    return Bluebird.reject(new errors.InvalidOption('identifier', 'required', 'identifier is required'));
  }

  workspaceData = workspaceData || {};

  var serverURI = this.serverURI;

  return new Bluebird(function (resolve, reject) {
    superagent
      .post(serverURI + '/project/' + identifier + '/workspace/ensure-ready')
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

/**
 * Loads the latest version of the project into the workspace.
 * @param  {String} authToken
 * @param  {String} identifier
 * @param  {Object} options
 *                   - byProjectId: Boolean
 *                   - byProjectCode: Boolean
 * 
 * @return {Bluebird -> Workspace}
 */
exports.loadLatestVersion = function (authToken, identifier, options) {
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
      .post(serverURI + '/project/' + identifier + '/workspace/load-latest-version')
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

/**
 * Creates a project version from the current files
 * in the workspace
 * @param  {String} authToken
 * @param  {String} identifier
 * @param  {Object} options
 * @return {Bluebird -> Workspace}
 */
exports.createProjectVersion = function (authToken, identifier, options) {
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
      .post(serverURI + '/project/' + identifier + '/workspace/create-project-version')
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
