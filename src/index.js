require("dotenv").config();
const { createServer } = require("http");
const ws = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const { GRAPHQL_TRANSPORT_WS_PROTOCOL } = require("graphql-ws");
const { GRAPHQL_WS, SubscriptionServer } = require("subscriptions-transport-ws");

const { readAllText, print, extractUserId, verifyToken } = require("./utils/utils");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const bodyParser = require("body-parser");
const { GraphQLError, execute, subscribe } = require("graphql");
const resolvers = require("./resolvers/index");

const { findUser } = require("./service/user_service");
const PORT = process.env.PORT || 5000;
const typeString = readAllText("/graphql/typeDef.graphql");
const typeDefs = typeString;

const schema = makeExecutableSchema({ typeDefs, resolvers });

const legacyWs = new ws.Server({
  noServer: true,
});

useServer({ schema }, legacyWs);

const transportSocket = new ws.Server({ noServer: true });

SubscriptionServer.create(
  {
    schema,
    execute: execute,
    subscribe: subscribe,
  },
  transportSocket
);

const server = createServer(function weServeSocketsOnly(_, res) {
  res.writeHead(404);
  res.end();
});

server.on("upgrade", (req, socket, head) => {
  const protocol = req.headers["sec-websocket-protocol"];
  const protocols = Array.isArray(protocol) ? protocol : protocol?.split(",").map((p) => p.trim());
  const wss = protocols?.includes(GRAPHQL_WS) && !protocols.includes(GRAPHQL_TRANSPORT_WS_PROTOCOL) ? transportSocket : legacyWs;
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

server.listen(PORT, () => {
  print("Server listening on port " + PORT);
});
