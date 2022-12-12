const { findProjectById, getProjectsByUserId } = require("../service/project_service");
const { getTodosByUserId, getTodoById } = require("../service/todo_service");
const { findUser } = require("../service/user_service");
const { print, extractUserId } = require("../utils/utils");

module.exports = {
  todos: (a, b, { headers }) => {
    return getTodosByUserId(extractUserId(headers));
  },
  projects: (a, b, { headers }) => {
    return getProjectsByUserId(extractUserId(headers));
  },
  todoById: (_, { id }, { headers }) => {
    return getTodoById(id, extractUserId(headers));
  },
  projectById: (_, { projectId }, { headers }) => {
    return findProjectById(projectId, extractUserId(headers));
  },
  profile: (paren, params, { headers }) => {
    return findUser(extractUserId(headers));
  },
};
