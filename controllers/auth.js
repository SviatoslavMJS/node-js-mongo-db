const bcrypt = require("bcryptjs");

const User = require("../models/user");

exports.getLogin = (req, res, next) => {
  return res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAuthenticated: req.session.isLoggedIn === "true",
  });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.redirect("/login");
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
          return res.redirect("/login");
        })
        .catch((err) => console.log("COMPARYING_ERR", err));
    })
    .catch((err) => console.log("NO_USER", err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => res.redirect("/login"));
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    isAuthenticated: false,
  });
};

exports.postSignup = (req, res, next) => {
  const { name, email, password } = req.body;
  User.findOne({ email })
    .then((userData) => {
      if (userData) {
        console.log("USER_ALREADY_EXIST");
        return res.redirect("/signup");
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
        .then(() => res.redirect("/login"));
    })

    .catch((err) => console.log(err));
};
