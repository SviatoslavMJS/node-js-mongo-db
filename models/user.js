const { ObjectId } = require("mongodb");

const { getDb } = require("../util/database");

class User {
  constructor({ fullName, email, cart, _id }) {
    this.fullName = fullName;
    this.email = email;
    this.cart = cart ? cart : { items: [] };
    this._id = _id;
  }

  save() {
    return getDb()
      .collection("user")
      .insertOne(this)
      .then(() => console.log("USER_CREATED"))
      .catch((err) => console.log(err));
  }

  getCart() {
    return getDb()
      .collection("products")
      .find({
        _id: {
          $in: this.cart.items.map(({ productId }) => productId),
        },
      })
      .toArray()
      .then((products) =>
        products.map((prod) => ({
          ...prod,
          quantity: this.cart.items.find(
            ({ productId }) => prod._id.toString() === productId.toString()
          )?.quantity,
        }))
      )
      .catch((err) => console.log(err));
  }

  removeFromCart(id) {
    return getDb()
      .collection("users")
      .updateOne(
        { _id: new ObjectId(this._id) },
        {
          $set: {
            cart: {
              items: this.cart.items.filter(
                ({ productId }) => productId.toString() !== id.toString()
              ),
            },
          },
        }
      )
      .then((updated) => {
        return updated;
      })
      .catch((err) => console.log(err));
  }

  addToCart(product) {
    const itemIndex = this.cart.items.findIndex(
      ({ productId }) => productId.toString() === product._id.toString()
    );
    const updatedCart = {
      items: [...this.cart.items],
    };

    if (itemIndex >= 0) {
      updatedCart.items[itemIndex].quantity =
        updatedCart.items[itemIndex].quantity + 1;
    } else {
      updatedCart.items.push({
        productId: new ObjectId(product._id),
        quantity: 1,
      });
    }

    return getDb()
      .collection("users")
      .updateOne(
        { _id: new ObjectId(this._id) },
        { $set: { cart: updatedCart } }
      )
      .then((updated) => {
        return updated;
      })
      .catch((err) => console.log(err));
  }

  addOrder() {
    const db = getDb();
    return this.getCart()
      .then((products) => {
        const order = {
          items: products,
          user: {
            email: this.email,
            name: this.fullName,
            _id: new ObjectId(this._id),
          },
        };
        return db.collection("orders").insertOne(order);
      })
      .then((res) => {
        return getDb()
          .collection("users")
          .updateOne(
            { _id: new ObjectId(this._id) },
            { $set: { cart: { items: [] } } }
          )
          .then(() => (this.cart = { items: [] }));
      })
      .catch((err) => console.lof(err));
  }

  getOrders() {
    return getDb()
      .collection("orders")
      .find({ "user._id": new ObjectId(this._id) })
      .toArray()
      .then((orders) => {
        return orders;
      })
      .catch((err) => console.log(err));
  }

  static findById(userId) {
    return getDb()
      .collection("users")
      .findOne({ _id: new ObjectId(userId) })
      .then((user) => user)
      .catch((err) => console.log(err));
  }
}

module.exports = User;
