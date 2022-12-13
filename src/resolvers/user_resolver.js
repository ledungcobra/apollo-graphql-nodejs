const { findAssignedTodos, findProjects, findTodosByUserId } = require("../service/user_service");

module.exports = {
  projects: (user) => {
    return findProjects(user.id);
  },
  todos: (user) => {
    return findTodosByUserId(user.id);
  },
  assignedTodos: (user) => {
    return findAssignedTodos(user.id);
  },
};
