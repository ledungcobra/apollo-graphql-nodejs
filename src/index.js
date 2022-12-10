require("dotenv").config();
const { createServer } = require("http");
const { ApolloServerPluginDrainHttpServer } = require("@apollo/server/plugin/drainHttpServer");
const { expressMiddleware } = require("@apollo/server/express4");
const { useServer } = require("graphql-ws/lib/use/ws");
const app = require("express")();
const cors = require("cors");
const ws = require("ws");
const { ApolloServer } = require("@apollo/server");

const { readAllText, print, extractUserId, verifyToken } = require("./utils/utils");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const bodyParser = require("body-parser");
const { execute, subscribe } = require("graphql");
const { findUser } = require("./service/user_service");
const { GRAPHQL_WS, SubscriptionServer } = require("subscriptions-transport-ws");
const { GRAPHQL_TRANSPORT_WS_PROTOCOL } = require("graphql-ws");
const PORT = process.env.PORT || 5000;
const resolvers = require("./resolvers/index");

const typeString = readAllText("/graphql/typeDef.graphql");
const typeDefs = typeString;

const schema = makeExecutableSchema({ typeDefs, resolvers });
const graphqlWs = new ws.Server({ noServer: true });
const cleanup = useServer({ schema }, graphqlWs);

const subTransWs = new ws.Server({ noServer: true });
const subServer = SubscriptionServer.create(
  {
    schema,
    onConnect: (...x) => {
      print("Connected");
    },
    onDisconnect: (...x) => {
      print("On Disconnected");
    },
    execute: (args) => {
      return execute(args);
    },
    subscribe: (args) => {
      return subscribe(args);
    },
    keepAlive: 100000,
  },
  subTransWs
);

const httpServer = createServer(app);

httpServer.on("upgrade", (req, socket, head) => {
  // extract websocket subprotocol from header
  const protocol = req.headers["sec-websocket-protocol"];
  const protocols = Array.isArray(protocol) ? protocol : protocol?.split(",").map((p) => p.trim());

  const wss = protocols?.includes(GRAPHQL_WS) && !protocols.includes(GRAPHQL_TRANSPORT_WS_PROTOCOL) ? subTransWs : graphqlWs;
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await cleanup.dispose();
          },
        };
      },
    },
  ],
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
});
