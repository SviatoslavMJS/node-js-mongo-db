const { MongoClient } = require("mongodb");
require("@dotenvx/dotenvx").config();

const connectionUrl = process.env.NODE_MONGO_CONNECTION_URL;

const client = new MongoClient(connectionUrl);

const mongoConnect = (callback) => {
  client
    .connect()
    .then((clt) => {
      callback(clt);
      console.log("SERVER_CONNECTED");
    })
    .catch((err) => console.log("CONNECTION_ERR", err));
};

const getDb = () => client.db('Cluster0');

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
