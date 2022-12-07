const { findUser, updateUserLastSeen, register } = require("../service/user_service");
const bcrypt = require("bcrypt");
const { GraphQLError } = require("graphql");
const { print, extractUserId, generateToken } = require("../utils/utils");
const { insertTodo, deleteTodo, assignTodoProject, assignTodoToMember, markDone } = require("../service/todo_service");
const { createProject, addMember } = require("../service/project_service");

const _login = async (_, { user, password }) => {
  const foundUser = await findUser(user);
  if (!foundUser) {
    throw new GraphQLError("User not found for user=" + user);
  }
  if (!(await bcrypt.compare(password, foundUser.password))) {
    return {
      success: false,
      user: null,
      token: null,
    };
  }
  foundUser.password = null;
  updateUserLastSeen(foundUser.id).then(print);
  return {
    success: true,
    token: generateToken(foundUser.id),
    user: foundUser,
  };
};

module.exports = {
  login: _login,
  addTodo: (_, { todo }, { headers }) =>
    insertTodo({
      ...todo,
      created_user_id: extractUserId(headers),
    }),
  deleteTodo: (_, { id }, { headers }) => deleteTodo(id, extractUserId(headers)),
  assignTodoProject: (_, { todoId, projectId }, { headers }) => assignTodoProject(todoId, projectId, extractUserId(headers)),
  assignTodoToMember: (_, { todoId, userId }, { headers }) => assignTodoToMember(todoId, userId, extractUserId(headers)),
  register: (_, { id, name, password }) => register(id, name, password),
  createProject: (_, { name }, { headers }) => createProject(name, extractUserId(headers)),
  addMember: (_, { userId, projectId }, { headers }) => addMember(userId, projectId, extractUserId(headers)),
  markDone: (_, { todoId, value }, { headers }) => markDone(todoId, value, extractUserId(headers)),
};
