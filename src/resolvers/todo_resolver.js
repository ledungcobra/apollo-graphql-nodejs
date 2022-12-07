const { findProjectById } = require("../service/project_service");
const { findViewUser } = require("../service/user_service");
const { print, extractUserId } = require("../utils/utils");

module.exports = {
  createdUser: (todo) => {
    return findViewUser(parent.created_user_id);
  },
  project: (todo, _, { headers }) => {
    return findProjectById(todo.project_id, extractUserId(headers));
  },
  assignee: (todo) => {
    return findViewUser(todo.assignee);
  },
};
