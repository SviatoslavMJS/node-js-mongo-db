const Product = require("../models/product");

exports.getProducts = (req, res, next) => {
  Product.fetchAll()
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
      });
    })
    .catch((err) => console.log(err));
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
    .catch((err) => console.log(req.path, err));
};

exports.getIndex = (req, res, next) => {
  Product.fetchAll()
    .then((prods) => {
      res.render("shop/index", {
        prods: prods,
        pageTitle: "Shop",
        path: "/",
      });
    })
    .catch((err) => console.log(err));
};

exports.getCart = (req, res, next) => {
  req.user
    .getCart()
    .then((products) =>
      res.render("shop/cart", {
        products,
        path: "/cart",
        pageTitle: "Your Cart",
      })
    )
    .catch((err) => console.log("Cart", err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  return Product.findById(prodId)
    .then((product) => req.user.addToCart(product))
    .then((cart) => res.redirect("/cart"))
    .catch((err) => console.log(err));
};

exports.postCartDeleteProduct = (req, res, next) => {
  const id = req.body.productId;
  req.user
    .removeFromCart(id)
    .then(() => res.redirect("/cart"))
    .catch((err) => console.log("DELETE_CART", err));
};

exports.getOrders = (req, res, next) => {
  req.user
    .getOrders({ include: ["products"] })
    .then((orders) =>
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders,
      })
    )
    .catch((err) => console.log("GET_ORDERS", err));
};

exports.postOrder = (req, res, next) => {
  req.user
    .addOrder()
    .then(() => res.redirect("/orders"))
    .catch((err) => console.log("POST_ORDER", err));
};

// exports.getCheckout = (req, res, next) => {
//   res.render("shop/checkout", {
//     path: "/checkout",
//     pageTitle: "Checkout",
//   });
// };
