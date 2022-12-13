const { findProjectById, getProjectsByUserId } = require("../service/project_service");
const { getTodoById, getTodosByUserId } = require("../service/todo_service");
const { findUser } = require("../service/user_service");
const { extractUserId } = require("../utils/utils");
const todos = (a, b, { headers }) => {
  return getTodosByUserId(extractUserId(headers));
};
const projects = (a, b, { headers }) => {
  return getProjectsByUserId(extractUserId(headers));
};
const todoById = (_, { id }, { headers }) => {
  return getTodoById(id, extractUserId(headers));
};

const projectById = (_, { projectId }, { headers }) => {
  return findProjectById(projectId, extractUserId(headers));
};
const profile = (paren, params, { headers }) => {
  return findUser(extractUserId(headers));
};
module.exports = { todos, projects, todoById, projectById, profile };
