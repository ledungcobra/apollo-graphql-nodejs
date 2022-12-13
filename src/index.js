const dotenv = require("dotenv");
dotenv.config();
const { makeExecutableSchema } = require("@graphql-tools/schema");
const loadResolvers = require("./resolvers/index.js");
const ApolloGraphQLServer = require("./server.js");
const { findUserWithProjectId } = require("./service/user_service");
const { extractUserId, print, readAllText } = require("./utils/utils");

const PORT = process.env.PORT || 5000;
const typeDefs = readAllText("graphql/typeDef.graphql");
(async function () {
  const schema = makeExecutableSchema({ typeDefs, resolvers: await loadResolvers() });

  const server = new ApolloGraphQLServer({
    port: PORT,
    schema,
    authContextFunc: (token) => findUserWithProjectId(extractUserId({ authorization: token })),
  });

  server.listen();
})();
