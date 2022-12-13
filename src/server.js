const { makeExecutableSchema } = require("@graphql-tools/schema");
const dotenv = require("dotenv");
const resolvers = require("./resolvers/index.js");
const { findUserWithProjectId } = require("./service/user_service");
const { extractUserId, print, readAllText } = require("./utils/utils");
dotenv.config();

const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { ApolloServerPluginDrainHttpServer } = require("@apollo/server/plugin/drainHttpServer");
const cors = require("cors");
const express = require("express");
const { useServer } = require("graphql-ws/lib/use/ws");
const { createServer } = require("http");
const ws = require("ws");

const bodyParser = require("body-parser");
const { execute, subscribe } = require("graphql");
const { GRAPHQL_TRANSPORT_WS_PROTOCOL } = require("graphql-ws");
const { GRAPHQL_WS, SubscriptionServer } = require("subscriptions-transport-ws");

class ApolloGraphQLServer {
  constructor({ authContextFunc, schema, port }) {
    this._port = port;
    this._app = express();
    this._graphqlWs = new ws.Server({ noServer: true });
    const cleanup = useServer(
      {
        schema,
        onConnect: (ctx) => {
          if (!ctx.connectionParams || !ctx.connectionParams["Authorization"]) {
            return;
          }
          return authContextFunc(ctx.connectionParams["Authorization"]);
        },
      },
      this._graphqlWs
    );

    this._subTransWs = new ws.Server({ noServer: true });
    SubscriptionServer.create(
      {
        schema,
        onConnect: (_, socket, incommingReq) => {
          const rawHeaders = incommingReq.request.rawHeaders;
          const token = this._extractAuthTokenFromRawHeaders(rawHeaders);
          return authContextFunc(token);
        },
        execute,
        subscribe,
      },
      this._subTransWs
    );

    this._httpServer = createServer(this._app);
    this._upgradeWebsocketServer();
    this._server = new ApolloServer({
      schema,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer: this._httpServer }),
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
  }

  _extractAuthTokenFromRawHeaders(rawHeaders) {
    const authIndex = rawHeaders.indexOf("authorization");
    const token = rawHeaders[authIndex + 1].toString();
    return token;
  }

  _upgradeWebsocketServer() {
    this._httpServer.on("upgrade", (req, socket, head) => {
      const protocol = req.headers["sec-websocket-protocol"];
      const protocols = Array.isArray(protocol) ? protocol : protocol?.split(",").map((p) => p.trim());
      const wss =
        protocols?.includes(GRAPHQL_WS) && !protocols.includes(GRAPHQL_TRANSPORT_WS_PROTOCOL) ? this._subTransWs : this._graphqlWs;
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    });
  }

  async listen() {
    await this._server.start();
    const graphqlUploadExpress = await import("graphql-upload/graphqlUploadExpress.mjs");
    this._app.use(
      graphqlUploadExpress.default({
        // maxFieldSize: 10000000000000,
        // maxFiles: 1,
      })
    );
    this._app.use((req,res, next)=>{
      return next();
    })
    this._app.use(
      "/graphql",
      cors(),
      bodyParser.json(),
      expressMiddleware(this._server, {
        context: (ctx) => ({ headers: ctx.req.headers }),
      })
    );
    this._httpServer.listen(this._port, () => {
      print("Listening at port " + this._port);
    });
  }
}

module.exports = ApolloGraphQLServer;
