require("dotenv").config();

const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  ValidationError,
  AuthenticationError,
} = require("apollo-server-express");

const {
  usernameValidation,
  emailValidation,
  passwordValidation,
} = require("../../utils/validators");
const { createToken } = require("../../utils/token");

const UserResolver = {
  Query: {
    async currentUser(_, __, { req }) {
      return await User.findOne({ _id: req.userId });
    },
  },

  Mutation: {
    async register(_, { userInput }, { res, redis }) {
      const validUsername = usernameValidation(userInput.username);
      const validateEmail = emailValidation(userInput.email);
      const passwordMatch = passwordValidation(
        userInput.password,
        userInput.confirmPassword
      );

      if (!validUsername) {
        throw new UserInputError("Invalid username");
      }

      if (!validateEmail) {
        throw new UserInputError("Invalid email");
      }

      if (!passwordMatch) {
        throw new UserInputError("Passwords don't match");
      }

      const user = await User.findOne({ username: userInput.username });
      if (user) {
        throw new ValidationError("This username already taken");
      }

      const emailToValidate = await User.findOne({ email: userInput.email });
      if (emailToValidate) {
        throw new ValidationError("This email already taken");
      }

      const password = await bcrypt.hash(userInput.password, 10);
      const newUser = new User({
        username: userInput.username,
        email: userInput.email,
        password: password,
        cards: [],
      });
      const response = await newUser.save();

      const accessToken = createToken(response, true);
      const refreshToken = createToken(response, false);

      try {
        await res.cookie("access-token", accessToken, {
          sameSite: "strict",
          expires: new Date(new Date().getTime() + 1000 * 60 * 15),
          httpOnly: true,
        });

        await res.cookie("refresh-token", refreshToken, {
          sameSite: "strict",
          expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7),
          httpOnly: true,
        });
      } catch (error) {
        console.log(error);
      }

      await redis.set(refreshToken, refreshToken, "ex", 60 * 60 * 24 * 7);

      return {
        id: response._id,
        ...response._doc,
        accessToken,
        refreshToken,
      };
    },

    async login(_, { userInput }, { res, redis }) {
      const user = await User.findOne(
        userInput.usernameOrEmail.includes("@")
          ? { email: useerInput.usernameOrEmail }
          : { username: userInput.usernameOrEmail }
      );
      if (!user) {
        throw new ValidationError("This username or email does not exist");
      }
      const match = await bcrypt.compare(userInput.password, user.password);
      if (!match) {
        throw new ValidationError("Wrong password!");
      }

      const accessToken = createToken(user, true);
      const refreshToken = createToken(user, false);

      try {
        await res.cookie("access-token", accessToken, {
          sameSite: "strict",
          expires: new Date(new Date().getTime() + 1000 * 60 * 15),
          httpOnly: true,
        });

        await res.cookie("refresh-token", refreshToken, {
          sameSite: "strict",
          expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7),
          httpOnly: true,
        });
      } catch (error) {
        console.log(error);
      }

      await redis.set(refreshToken, refreshToken, "ex", 60 * 60 * 24 * 7);

      return {
        id: user._id,
        ...user._doc,
        accessToken,
        refreshToken,
      };
    },

    // This will delete refresh token
    async logout(_, __, { req, res, redis }) {
      req.userId = null;
      await redis.del(req.cookies["refresh-token"]);
      await res.clearCookie("access-token");
      await res.clearCookie("refresh-token");
      return true;
    },

    async newToken(_, { refreshToken }, { res, redis }) {
      if (refreshToken == null) {
        return new AuthenticationError("Wrong refresh token");
      }
      const refToken = await redis.get(refreshToken, async (err, result) => {
        if (err) {
          return new AuthenticationError("Refresh token expired");
        } else {
          if (result) {
            return result;
          }
        }
      });
      if (!refToken) {
        return new AuthenticationError("Refresh token expired");
      }
      const user = await jwt.verify(
        refToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, user) => {
          if (err) {
            return new AuthenticationError("Refresh token is invalid");
          } else {
            return user;
          }
        }
      );
      if (!user) {
        return new AuthenticationError("User could not be verified");
      }
      const accessToken = createToken(user, true);
      res.cookie("access-token", accessToken, {
        sameSite: "strict",
        expires: new Date(new Date().getTime() + 1000 * 5),
        httpOnly: true,
      });
      return accessToken;
    },
  },
};

module.exports = UserResolver;
