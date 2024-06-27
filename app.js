const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("@dotenvx/dotenvx").config();

const User = require("./models/user");
const shopRoutes = require("./routes/shop");
const adminRoutes = require("./routes/admin");
const errorController = require("./controllers/error");

const app = express();
const connectionUrl = process.env.NODE_MONGO_CONNECTION_URL;

app.use((req, res, next) => {
  User.findById("667aa101faad71e7c5e9f1a4")
    .then((user) => {
      req.user = new User(user);
      next();
    })
    .catch((err) => console.log("NO_USER", err));
});

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose
  .connect(connectionUrl)
  .then((result) => {
    User.findOne().then((user) => {
      if (!user) {
        const user = new User({
          name: "Sviat MKTN",
          email: "some.test@example.com",
          cart: { items: [] },
        });
        user.save();
      }
    });

    app.listen(3000);
  })
  .catch((err) => console.log("CONNECTION_ERR", err));
