const Card = require("../../models/Card");
const User = require("../../models/User");

const {
  ValidationError,
  AuthenticationError,
} = require("apollo-server-express");

const CardResolver = {
  Query: {
    async cards(_, { userId }) {
      const user = await User.findOne({ _id: userId }).populate("cards");
      if (!user) {
        throw new ValidationError("Could not found user!");
      }
      return user.cards;
    },

    async card(_, { cardId }) {
      const card = await Card.findOne({ _id: cardId }).populate("owner");
      if (!card) {
        throw new ValidationError("Could not found card!");
      }
      return card;
    },
  },

  Mutation: {
    async createCard(_, { cardInput }, { req }) {
      if (!req.userId) {
        throw new AuthenticationError("You are not logged in!");
      }
      const user = await User.findOne({ _id: req.userId }).populate("cards");
      if (!user) {
        throw new AuthenticationError("You are not logged in!");
      }
      const newCard = new Card({
        english: cardInput.english,
        description: cardInput.description,
        example: cardInput.example,
        turkish: cardInput.turkish,
        owner: user,
      });
      const response = await newCard.save();
      await User.findOne({ _id: response.owner._id }, (err, user) => {
        if (err) {
          throw new Error(err);
        }
        if (user) {
          user.cards.push(newCard);
          user.save();
        }
      });
      return {
        id: response._id,
        ...response._doc,
      };
    },

    async updateCard(_, { cardId, cardInput }, { req }) {
      const card = await Card.findOne({ _id: cardId }).populate("owner");
      if (card.owner._id != req.userId) {
        throw new AuthenticationError("You are not logged in!");
      }
      card.english = cardInput.english;
      card.description = cardInput.description;
      card.example = cardInput.example;
      card.turkish = cardInput.turkish;

      const response = await card.save();
      return {
        id: response._id,
        ...response._doc,
      };
    },

    async deleteCard(_, { cardId }, { req }) {
      const card = await Card.findOne({ _id: cardId }).populate("owner");
      if (card.owner._id != req.userId) {
        throw new AuthenticationError("You are not logged in!");
      }
      await User.findOne({ _id: card.owner._id }, (err, user) => {
        if (err) {
          throw new Error(err);
        }
        if (user) {
          user.cards.remove({ _id: cardId });
          user.save();
        }
      });
      await Card.deleteOne({ _id: cardId });
      return true;
    },
  },
};

module.exports = CardResolver;
