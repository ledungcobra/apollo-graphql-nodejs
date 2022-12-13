const { makeExecutableSchema } = require("@graphql-tools/schema");
const dotenv = require("dotenv");
const loadResolvers = require("./resolvers/index.js");
const ApolloGraphQLServer = require("./server.js");
const { findUserWithProjectId } = require("./service/user_service");
const { extractUserId, print, readAllText } = require("./utils/utils");
dotenv.config();

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
