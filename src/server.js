
const { createServer } = require("http");
const { ApolloServerPluginDrainHttpServer } = require("@apollo/server/plugin/drainHttpServer");
const { expressMiddleware } = require("@apollo/server/express4");
const { useServer } = require("graphql-ws/lib/use/ws");
const app = require("express")();
const cors = require("cors");
const ws = require("ws");
const { ApolloServer } = require("@apollo/server");

const { readAllText, print, extractUserId } = require("./utils/utils");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const bodyParser = require("body-parser");
const { execute, subscribe } = require("graphql");
const { findUserWithProjectId } = require("./service/user_service");
const { GRAPHQL_WS, SubscriptionServer } = require("subscriptions-transport-ws");
const { GRAPHQL_TRANSPORT_WS_PROTOCOL } = require("graphql-ws");
const resolvers = require("./resolvers/index");


class GraphQLServer {
  constructor(port) {
    this.port = port;
  }

  setUpAuth(authContextFunction) {}

  _upgradeWebsocketServer() {}

  listen() {}
}
