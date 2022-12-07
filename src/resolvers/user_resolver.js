const { findProjects, findTodosByUserId } = require("../service/user_service");
const { print } = require("../utils/utils");

module.exports = {
  projects: (user) => {
    return findProjects(user.id);
  },
  todos: (user) => {
    return findTodosByUserId(user.id);
  },
  assigedTodos: (user) => {
    return findAssignedTodos(user.id);
  },
};
