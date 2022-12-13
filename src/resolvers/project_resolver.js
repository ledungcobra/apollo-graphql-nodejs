const { findMembers, findTodosByProjectId } = require("../service/project_service");
const { findViewUser } = require("../service/user_service");
const { extractUserId } = require("../utils/utils");
const manager = (project) => findViewUser(project.manager_id);
const members = (project, _, { headers }) => findMembers(project.id, extractUserId(headers));
const todos = (project) => findTodosByProjectId(project.id);
module.exports = { manager, members, todos };
