const fs = require("fs");
const { GraphQLError } = require("graphql");
const jwt = require("jsonwebtoken");
const path = require("path");
const generateToken = (id) => {
  var token = jwt.sign({ data: { id }, exp: Math.floor(Date.now() / 1000) + 60 * 6000 }, process.env.JWT_SECRET, {
    algorithm: "HS512",
  });
  return token;
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      data: decoded.data,
    };
  } catch (e) {
    return {
      error: true,
      message: e.toString(),
    };
  }
};

const readAllText = (filePath) => fs.readFileSync(path.join(__dirname, "..", filePath)).toString();

const extractUserId = (headers) => {
  const token = (headers["authorization"] || "").replace("Bearer ", "");
  if (!token) {
    throw new GraphQLError("Invalid token " + token);
  }
  const result = verifyToken(token);
  if (result.error) {
    throw new GraphQLError("Invalid token " + result.message);
  }
  return result.data.id;
};

const print = console.log;
module.exports = { generateToken, verifyToken, print, readAllText, extractUserId };

