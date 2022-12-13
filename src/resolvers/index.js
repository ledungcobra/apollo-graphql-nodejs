const Mutation = require("./mutation_resolver");
const Project = require("./project_resolver");
const Query = require("./query_resolver");
const Subscription = require("./subscription_resolver");
const Todo = require("./todo_resolver");
const User = require("./user_resolver");
async function loadResolvers(){
  const Upload = await import("graphql-upload/GraphQLUpload.mjs")
return { Todo, Project, User, Query, Mutation, Subscription, Upload };
}
module.exports = loadResolvers;
