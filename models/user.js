const { Schema, Types, model } = require("mongoose");
const Product = require("./product");

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  cart: {
    items: [
      {
        productId: {
          type: Types.ObjectId,
          required: true,
          ref: "Product",
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
  },
});

userSchema.methods.addToCart = function (product) {
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
      productId: product._id,
      quantity: 1,
    });
  }

  this.cart = updatedCart;
  return this.save()
    .then((updated) => {
      return updated;
    })
    .catch((err) => console.log(err));
};

userSchema.methods.removeFromCart = function (id) {
  this.cart.items = this.cart.items.filter(
    ({ productId }) => productId.toString() !== id.toString()
  );

  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart.items = [];

  return this.save();
};

module.exports = model("User", userSchema);
