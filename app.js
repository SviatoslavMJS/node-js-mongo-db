const path = require("path");
const csrf = require("csurf");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("connect-flash");
const sessionConnect = require("connect-mongodb-session");
require("@dotenvx/dotenvx").config();

const User = require("./models/user");
const shopRoutes = require("./routes/shop");
const adminRoutes = require("./routes/admin");
const errorController = require("./controllers/error");
const authRoutes = require("./routes/auth");

const connectionUrl = process.env.NODE_MONGO_CONNECTION_URL;
const sessionSecret = process.env.SESSION_SECRET_KEY;

const app = express();

const MongoDBSessionStore = sessionConnect(session);
const store = new MongoDBSessionStore({
  uri: connectionUrl,
  collection: "sessions",
});

const csrfProtection = csrf();

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    store,
    resave: false,
    secret: sessionSecret,
    saveUninitialized: false,
  })
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  if (!req.session?.user) {
    return next();
  }

  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
  return res.status(500).render("500", {
    pageTitle: "Server error",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
});

mongoose
  .connect(connectionUrl)
  .then(() => {
    app.listen(3000);
  })
  .catch((err) => console.log("CONNECTION_ERR", err));
