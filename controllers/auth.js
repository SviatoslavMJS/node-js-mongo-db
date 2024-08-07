const crypto = require("crypto");
const { validationResult } = require("express-validator");

const bcrypt = require("bcryptjs");
const nodeMailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
require("@dotenvx/dotenvx").config();

const User = require("../models/user");
const user = require("../models/user");

const senderEmail = process.env.SEND_GRID_SENDER_EMAIL;

const transporter = nodeMailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SEND_GRID_API_KEY,
    },
  })
);

exports.getLogin = (req, res, next) => {
  const [message] = req.flash("error");
  return res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    validationErrors: [],
    errorMessage: message ?? null,
    values: { email: "", password: "" },
  });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      values: req.body,
      validationErrors: errors.array(),
      errorMessage: errors
        .array()
        .map(({ msg }) => msg)
        .join(", "),
    });
  }

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          values: req.body,
          validationErrors: [],
          errorMessage: "Invalid email or password.",
        });
      }
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.log("SESSION_ERR", err);
              return res.redirect("/");
            });
          }

          console.log("WRONG_PASSWORD");
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            values: req.body,
            validationErrors: [],
            errorMessage: "Invalid email or password.",
          });
        })
        .catch((err) => console.log("COMPARYING_ERR", err));
    })
    .catch((err) => {
      console.log("NO_USER");
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => res.redirect("/login"));
};

exports.getSignup = (req, res, next) => {
  const [message] = req.flash("error");

  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    validationErrors: [],
    errorMessage: message ?? null,
    values: { email: "", password: "", confirmPassword: "", name: "" },
  });
};

exports.postSignup = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = validationResult(req);
  console.log(errors.array());
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      values: req.body,
      validationErrors: errors.array(),
      errorMessage: errors
        .array()
        .map(({ msg }) => msg)
        .join(", "),
    });
  }
  return bcrypt
    .hash(password, 13)
    .then((cryptedPas) => {
      const user = new User({
        name,
        email,
        card: { items: [] },
        password: cryptedPas,
      });
      return user.save();
    })
    .then(() => {
      res.redirect("/login");

      return transporter.sendMail({
        to: email,
        from: senderEmail,
        subject: "Signup succeed!",
        html: "<h1>You successfully singed up<h1>",
      });
    })
    .catch((err) => {
      console.log("SIGN_UP_ERR");
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getReset = (req, res, next) => {
  const [message] = req.flash("error");
  return res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset password",
    errorMessage: message ?? null,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log("BUFFER_ERR", err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account with this email found.");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 24 * 60 * 60 * 1000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        return transporter.sendMail({
          to: req.body.email,
          from: senderEmail,
          subject: "Reset password",
          html: `<p>You requested a password reset.</p>
          <p>Click this <a href='http://localhost:3000/reset/${token}'>link</a> to set a new password.</p>
          `,
        });
      })
      .catch((err) => {
        console.log("POST_RESET_ERR");
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const [message] = req.flash("error");
  const token = req.params.token;

  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        req.flash("error", "No user found.");
        return res.redirect("/reset");
      }
      return res.render("auth/new-password", {
        passwordToken: token,
        path: "/new-password",
        userId: user._id.toString(),
        pageTitle: "Change password",
        errorMessage: message ?? null,
      });
    })
    .catch((err) => {
      console.log("GET_PASS_ERR", err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const { password, userId, passwordToken } = req.body;
  let resetUser;

  User.findOne({
    _id: userId,
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        req.flash("error", "Reset token is expired.");
        return res.redirect("/reset");
      }
      resetUser = user;
      return bcrypt.hash(password, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(() => res.redirect("/login"))
    .catch((err) => {
      console.log("NEW_PASS_ERR");
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
