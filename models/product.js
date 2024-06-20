const { ObjectId } = require("mongodb");

const { getDb } = require("../util/database");

class Product {
  constructor(title, imageUrl, description, price, id, userId) {
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
    this._id = id;
    this.userId = userId;
  }

  save() {
    const collection = getDb().collection("products");
    let result;
    const payload = { ...this };
    delete payload._id;
    if (this._id) {
      result = collection.updateOne(
        { _id: new ObjectId(this._id) },
        { $set: payload }
      );
    } else {
      result = collection.insertOne(this);
    }
    return result
      .then((result) => console.log(result))
      .catch((err) => console.log(err));
  }

  static deleteById(id) {
    return getDb()
      .collection("products")
      .deleteOne({ _id: new BSON.ObjectId(id) })
      .then((res) => console.log(res))
      .catch((err) => console.log("DELETE_ERR", err));
  }

  static fetchAll() {
    const db = getDb();
    return db
      .collection("products")
      .find()
      .toArray()
      .then((products) => products)
      .catch((err) => console.log("GET_PROD_ERR", err));
  }

  static findById(id) {
    const db = getDb();
    return db
      .collection("products")
      .find({ _id: new ObjectId(id) })
      .next()
      .then((product) => product)
      .catch((err) => console.log("GET_PROD_BY_ID_ERR", err));
  }
}

module.exports = Product;
