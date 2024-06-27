const User = require("../models/user");

exports.getLogin = (req, res, next) => {
  return res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAuthenticated: req.session.isLoggedIn === "true",
  });
};

exports.postLogin = (req, res, next) => {
  User.findById("667aa101faad71e7c5e9f1a4")
    .then((user) => {
      req.session.isLoggedIn = true;
      req.session.user = user;
      req.session.save((err) => {
        console.log("SESSION_ERR", err);
        res.redirect("/");
      });
    })
    .catch((err) => console.log("NO_USER", err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => res.redirect("/login"));
};
