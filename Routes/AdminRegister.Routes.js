const express = require("express");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const saltRounds = +process.env.saltRounds;
const { authenticate } = require("../middleware/authentication.middleware");
const { AdminRegisterModel } = require("../Model/AdminRegister");

const AdminRegisterRoutes = express.Router();

AdminRegisterRoutes.post("/register", async (req, res) => {
  const payload = req.body;
  console.log(payload)

  try {
    const email = await AdminRegisterModel.findOne({ email: payload.email });
    if (email) {
      res
        .status(200)
        .send({
          msg: "Email is already Exists",
          error: true,
        });
    } else {
      bcrypt.hash(payload.password, saltRounds, async (err, hash) => {
        if (err) {
          throw err;
        } else {
          payload.password = hash;
          const user = new AdminRegisterModel(payload);
          await user.save();
          res.send({
            msg: "Admin Register",
            username: user.name,
            Email:user.email,
            error: false,
          });;
        }
      });
    }
  } catch (error) {
    res
      .status(400)
      .send({ msg: "something went wrong while register user", error });
    console.log(error);
  }
});
AdminRegisterRoutes.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await AdminRegisterModel.findOne({ email });
    if (user) {
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          throw err;
        } else {
          if (result) {
            jwt.sign(
              {
                userId: user._id,
                userName: user.name,
                Email: user.email,
                userType: user.userType,
              },
              process.env.key,
              (err, token) => {
                if (err) {
                  throw err;
                } else {
                  res.status(200).send({
                    msg: "logged in success",
                    token,
                    username: user.name,
                    error: false,
                  });
                }
              }
            );
          } else {
            res.send({ msg: "wrong credential", error: true });
          }
        }
      });
    } else {
      res.send({ msg: "User Not found", error: true });
    }
  } catch (error) {
    res
      .status(400)
      .send({ msg: "something went wrong while login user", error });
    console.log(error);
  }
});

AdminRegisterRoutes.get("/", authenticate, async (req, res) => {
  const payload = req.body;

  try {
    const product = await AdminRegisterModel.find({ _id: payload.userId });
    res.send({ data: product });
  } catch (error) {
    console.log("error", error);
    res.status(500).send({
      error: true,
      msg: "something went wrong",
    });
  }
});

module.exports = { AdminRegisterRoutes };