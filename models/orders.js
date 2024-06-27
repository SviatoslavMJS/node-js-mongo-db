const { Schema, Types, model } = require("mongoose");

const orderSchema = new Schema({
  products: [
    {
      product: { type: Object, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  user: {
    name: { type: String, required: true },
    userId: {
      type: Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
});

module.exports = model("Orders", orderSchema);
