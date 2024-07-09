const Product = require("../models/product");
const Order = require("../models/orders");

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
      });
    })
    .catch((err) => {
      console.log("GET_PRODS_ERR");
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      console.log("GET_PROD_ERR");
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then((prods) => {
      res.render("shop/index", {
        prods: prods,
        pageTitle: "Shop",
        path: "/",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) =>
      res.render("shop/cart", {
        products: user.cart.items,
        path: "/cart",
        pageTitle: "Your Cart",
      })
    )
    .catch((err) => {
      console.log("Cart", err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  return Product.findById(prodId)
    .then((product) => req.user.addToCart(product))
    .then((cart) => res.redirect("/cart"))
    .catch((err) => {
      console.log("POST_CART_ERR");
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const id = req.body.productId;
  req.user
    .removeFromCart(id)
    .then(() => res.redirect("/cart"))
    .catch((err) => {
      console.log("DELETE_CART_ERR");
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) =>
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders,
      })
    )
    .catch((err) => {
      console.log("GET_ORDERS_ERR");
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => ({
        quantity: i.quantity,
        product: { ...i.productId._doc },
      }));
      const order = new Order({
        products,
        user: {
          name: req.user.name,
          userId: req.user._id,
          email: req.user.email,
        },
      });

      return order.save();
    })
    .then(() => req.user.clearCart())
    .then(() => res.redirect("/orders"))
    .catch((err) => {
      console.log("POST_ORDER_ERR");
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
