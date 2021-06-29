const UserResolver = require("./user");
const CardResolver = require("./card");

module.exports = {
  Query: {
    ...UserResolver.Query,
    ...CardResolver.Query,
  },
  Mutation: {
    ...UserResolver.Mutation,
    ...CardResolver.Mutation,
  },
};
