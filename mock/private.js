// third-party
const Bluebird = require('bluebird');

// own
const errors = require('../shared/errors');

module.exports = function (mockOptions) {

  if (!mockOptions.data) {
    throw new Error('mockOptions.data is required for h-workspace-client mock');
  }

  /**
   * Array of workspaces. A workspace should 
   * have the format:
   *   - _id
   *   - projectId
   *   - projectCode (mock-only)
   * 
   * @type {Array}
   */
  var mockWorkspaces = mockOptions.data.workspaces;


  function PrivateHWorkspaceMock(options) {}

  PrivateHWorkspaceMock.prototype.get = function (authToken, identifier, options) {
    if (!authToken) {
      return Bluebird.reject(new errors.Unauthorized());
    }

    var workspace;

    if (options.byProjectCode) {

      workspace = mockWorkspaces.find((mockWorkspace) => {
        return mockWorkspace.projectCode === identifier;
      });

    } else if (options.byProjectId) {

      workspace = mockWorkspaces.find((mockWorkspace) => {
        return mockWorkspace.projectId === identifier;
      });

    } else {
      // by default use _id
      workspace = mockWorkspaces.find((mockWorkspace) => {
        return mockWorkspace._id === identifier;
      });
    }

    if (!workspace) {
      return Bluebird.reject(new errors.NotFound());
    } else {
      return Bluebird.resolve(workspace);
    }

  };

  /**
   * Mock management methods
   */
  PrivateHWorkspaceMock._addWorkspace = function (mockWorkspace) {
    mockWorkspaces.push(mockWorkspace);
  };

  return PrivateHWorkspaceMock;
};
