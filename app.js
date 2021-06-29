require("dotenv").config();
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const Redis = require("ioredis");

const typeDefs = require("./graphql/schema/typeDefs");
const resolvers = require("./graphql/resolvers/index");

const redis = new Redis();

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cookieParser());
app.use((req, _, next) => {
  const accessToken = req.cookies["access-token"];
  if (accessToken) {
    const data = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.userId = data.id;
  }
  next();
});

const server = new ApolloServer({
  typeDefs: typeDefs,
  resolvers: resolvers,
  context: ({ req, res }) => {
    const auth = req.headers.authorization || "";
    return {
      auth,
      res,
      req,
      redis,
    };
  },
});

server.applyMiddleware({ app });

mongoose
  .connect(process.env.DB, { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => {
    console.log("MongoDB is connected");
    app.listen(process.env.PORT, () => {
      console.log("Server started on localhost:", process.env.PORT);
    });
  });
