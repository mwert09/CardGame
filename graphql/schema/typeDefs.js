const { gql } = require("apollo-server-express");

module.exports = gql`
  type Card {
    id: ID!
    english: String!
    description: String!
    example: String!
    turkish: String!
    owner: User!
  }

  type User {
    id: ID!
    username: String!
    email: String!
    accessToken: String
    refreshToken: String
    cards: [Card!]
  }

  type Query {
    currentUser: User

    cards(userId: String!): [Card!]!
    card(cardId: String!): Card!
  }

  type Mutation {
    register(userInput: RegisterUserInput!): User!
    login(userInput: LoginUserInput): User!
    logout: Boolean!
    newToken(refreshToken: String!): String!

    createCard(cardInput: CardInput!): Card!
    updateCard(cardId: String!, cardInput: CardInput!): Card!
    deleteCard(cardId: String!): Boolean!
  }

  input RegisterUserInput {
    username: String!
    email: String!
    password: String!
    confirmPassword: String!
  }

  input LoginUserInput {
    usernameOrEmail: String!
    password: String!
  }

  input CardInput {
    english: String!
    description: String!
    example: String!
    turkish: String!
  }
`;
