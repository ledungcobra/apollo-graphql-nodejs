const { findProjectById } = require("../service/project_service");
const { getTodosByUserId, getTodoById } = require("../service/todo_service");
const { print, extractUserId } = require("../utils/utils");

module.exports = {
  todos: (a, b, { headers }) => {
    return getTodosByUserId(extractUserId(headers));
  },
  todoById: (_, { id }, { headers }) => {
    return getTodoById(id, extractUserId(headers));
  },
  projectById: (parent, { projectId }, { headers }) => {
    print(parent);
    return findProjectById(projectId, extractUserId(headers));
  },
};
