require("dotenv").config();
const { createServer } = require("http");
const { ApolloServerPluginDrainHttpServer } = require("@apollo/server/plugin/drainHttpServer");
const { expressMiddleware } = require("@apollo/server/express4");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const app = require("express")();
const httpServer = createServer(app);
const cors = require("cors");

const { ApolloServer } = require("@apollo/server");

const todoResolver = require("./resolvers/todo_resolver");
const projectResolver = require("./resolvers/project_resolver");
const userResolver = require("./resolvers/user_resolver");
const queryResolver = require("./resolvers/query_resolver");
const mutationResolver = require("./resolvers/mutation_resolver");
const subscriptionResolver = require("./resolvers/subscription_resolver");

const { readAllText, print, extractUserId, verifyToken } = require("./utils/utils");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const bodyParser = require("body-parser");
const { listenToDbEvent } = require("./listeners/db_listeners");
const { GraphQLError } = require("graphql");
const { findUser } = require("./service/user_service");
const PORT = process.env.PORT || 5000;
const typeString = readAllText("/graphql/typeDef.graphql");
const typeDefs = typeString;

const resolvers = {
  Todo: todoResolver,
  Project: projectResolver,
  User: userResolver,
  Query: queryResolver,
  Mutation: mutationResolver,
  Subscription: subscriptionResolver,
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const wsServer = new WebSocketServer({
  // This is the `httpServer` we created in a previous step.
  server: httpServer,
  // Pass a different path here if app.use
  // serves expressMiddleware at a different path
  path: "/graphql",
  handleProtocols: "graphql-ws",
});

const serverCleanup = useServer(
  {
    schema,
    onConnect: () => {
      print("Connected");
    },
    onDisconnect: () => {
      print("Disconnect");
    },
    context: async (ctx) => {
      if (!ctx.connectionParams) {
        return;
      }
      const authToken = ctx.connectionParams["Authorization"];
      if (!authToken) {
        return;
      }
      const data = verifyToken(authToken);
      if (data.error) {
        throw new GraphQLError("Invalid jwt token: " + data.message);
      }
      return await findUser(data.data.id);
    },
  },
  wsServer
);

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
  subscriptions: {
    path: "/graphql",
    keepAlive: 100000,
    onConnect: () => console.log("connected"),
    onDisconnect: () => console.log("disconnected"),
  },
});
server.start().then(() => {
  app.use(
    "/graphql",
    cors(),
    bodyParser.json(),
    expressMiddleware(server, {
      context: (ctx) => ({ headers: ctx.req.headers }),
    })
  );
  httpServer.listen(PORT, () => {
    print("Listening at port " + PORT);
  });

  listenToDbEvent();
});
