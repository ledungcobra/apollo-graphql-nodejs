require("dotenv").config();
const { ApolloServer, gql } = require("apollo-server");
const fs = require("fs");
const path = require("path");
const todoResolver = require("./resolvers/todo_resolver");
const projectResolver = require("./resolvers/project_resolver");
const userResolver = require("./resolvers/user_resolver");

const { print, readAllText } = require("./utils/utils");
const PORT = process.env.PORT || 3000;
const typeString = readAllText("/graphql/typeDef.graphql");
const typeDefs = gql(typeString);
const queryResolver = require("./resolvers/query_resolver");
const mutationResolver = require("./resolvers/mutation_resolver");

const resolvers = {
  Todo: todoResolver,
  Project: projectResolver,
  User: userResolver,
  Query: queryResolver,
  Mutation: mutationResolver,
};

const server = new ApolloServer({
  context: (ctx) => ({ headers: ctx.req.headers, url: ctx.req.url }),
  typeDefs: typeDefs,
  resolvers,
});

server.listen({ port: PORT }).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
