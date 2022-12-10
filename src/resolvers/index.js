const todoResolver = require("./todo_resolver");
const projectResolver = require("./project_resolver");
const userResolver = require("./user_resolver");
const queryResolver = require("./query_resolver");
const mutationResolver = require("./mutation_resolver");
const subscriptionResolver = require("./subscription_resolver");

module.exports = {
  Todo: todoResolver,
  Project: projectResolver,
  User: userResolver,
  Query: queryResolver,
  Mutation: mutationResolver,
  Subscription: subscriptionResolver,
};
