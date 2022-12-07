const { findMembers, findTodosByProjectId } = require("../service/project_service");
const { findViewUser } = require("../service/user_service");
const { extractUserId } = require("../utils/utils");

module.exports = {
  manager: (project) => findViewUser(project.manager_id),
  members: (project, _, { headers }) => findMembers(project.id, extractUserId(headers)),
  todos: (project) => findTodosByProjectId(project.id),
};
