const express = require("express");
const { body, check } = require("express-validator");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.get("/login", authController.getLogin);
router.get("/signup", authController.getSignup);

router.post(
  "/login",
  [
    check("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Email is not valid!"),
    body(
      "password",
      "Password must be only numbers at least 5 characters long."
    )
      .trim()
      .isLength({ min: 5 }),
  ],
  authController.postLogin
);

router.post(
  "/signup",
  [
    body("name", "At least 3 characters required.")
      .isString()
      .trim()
      .isLength({ min: 3 }),
    check("email")
      .isEmail()
      .withMessage("Email is not valid.")
      .normalizeEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject("Email already used, try another one.");
          }
        });
      }),
    body(
      "password",
      "Password must be only numbers at least 5 characters long."
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords have to match.");
        }
        return true;
      }),
  ],
  authController.postSignup
);

router.post("/logout", authController.postLogout);
router.get("/reset", authController.getReset);
router.post("/reset", authController.postReset);
router.get("/reset/:token", authController.getNewPassword);
router.post("/new-password", authController.postNewPassword);

module.exports = router;
