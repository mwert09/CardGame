require('dotenv').config();

const jwt = require("jsonwebtoken");

module.exports.createToken = ({id, username, email}, isAccessToken) => {
    if(isAccessToken){
        return jwt.sign({id,username,email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15min"});
    }
    else{
        return jwt.sign({id,username,email}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: "7d"});
    }
}