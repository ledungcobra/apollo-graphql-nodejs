require("dotenv").config();

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

const PORT = process.env.PORT || 5000;
const typeDefs = readAllText("/graphql/typeDef.graphql");

const schema = makeExecutableSchema({ typeDefs, resolvers });

const graphqlWs = new ws.Server({ noServer: true });

const cleanup = useServer(
  {
    schema,
    onConnect: (ctx) => {
      if (!ctx.connectionParams || !ctx.connectionParams["Authorization"]) {
        return;
      }
      return findUserWithProjectId(
        extractUserId({
          authorization: ctx.connectionParams["Authorization"],
        })
      );
    },
  },
  graphqlWs
);

const subTransWs = new ws.Server({ noServer: true });
SubscriptionServer.create(
  {
    schema,
    onConnect: (_, socket, incommingReq) => {
      const rawHeaders = incommingReq.request.rawHeaders;
      const authIndex = rawHeaders.indexOf("authorization");
      const token = rawHeaders[authIndex + 1].toString();
      return findUserWithProjectId(
        extractUserId({
          authorization: token,
        })
      );
    },
    onDisconnect: () => {
      print("On Disconnected");
    },
    execute,
    subscribe,
    keepAlive: 100000,
  },
  subTransWs
);

const httpServer = createServer(app);

httpServer.on("upgrade", (req, socket, head) => {
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
