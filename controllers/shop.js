const fs = require("fs");
const path = require("path");
const Stripe = require("stripe");
const PDFDocument = require("pdfkit");
require("@dotenvx/dotenvx").config();

const Product = require("../models/product");
const Order = require("../models/orders");

const ITEMS_PER_PAGE = 1;
const stripePublicKey = process.env.STRIPE_PUBLISHABLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECREt_KEY;

const stripe = Stripe(stripeSecretKey);

exports.getProducts = (req, res, next) => {
  const { page } = req.query;
  let itemsCount = 0;
  return Product.find()
    .countDocuments()
    .then((count) => {
      itemsCount = count;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
        currentPage: page ?? 1,
        pagesCount: Math.ceil(itemsCount / ITEMS_PER_PAGE),
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
  const page = +req.query.page ?? 1;
  let totalCount = 0;
  Product.find()
    .countDocuments()
    .then((count) => {
      totalCount = count;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((prods) => {
      res.render("shop/index", {
        prods: prods,
        pageTitle: "Shop",
        path: "/",
        pagesCount: Math.ceil(totalCount / ITEMS_PER_PAGE),
        currentPage: page,
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
    .then((user) => {
      console.log(user.cart.items);
      return res.render("shop/cart", {
        products: user.cart.items,
        path: "/cart",
        pageTitle: "Your Cart",
      });
    })
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

exports.getCheckout = (req, res, next) => {
  let products = [];
  let total = 0;

  req.user
    .populate("cart.items.productId")
    .then((user) => {
      products = user.cart.items;
      total = user.cart.items.reduce(
        (sum, next) => sum + next.quantity * next.productId.price,
        0
      );

      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map(({ productId, quantity }) => ({
          quantity: quantity,
          price_data: {
            currency: "usd",
            product_data: {
              name: productId.title,
              description: productId.description,
            },
            unit_amount: productId.price * 100,
          },
        })),
        mode: "payment",
        success_url: `${req.protocol}://${req.get("host")}/checkout/success`,
        cancel_url: `${req.protocol}://${req.get("host")}/checkout/cancel`,
      });
    })
    .then((session) =>
      res.render("shop/checkout", {
        products,
        path: "/checkout",
        pageTitle: "Checkout",
        totalSum: total,
        sessionId: session.id,
        stripePublicKey,
      })
    )
    .catch((err) => {
      console.log("CHECKOUT_ERR", err);
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

exports.getCheckoutSuccess = (req, res, next) => {
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

exports.getInvoice = (req, res, next) => {
  const { orderId } = req.params;
  const invoiceName = `Invoice-${orderId}.pdf`;
  const invoicePath = path.join("data", "invoices", invoiceName);

  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order found."));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Access denied."));
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Deposition", `inline`);
      const pdfDoc = new PDFDocument({
        margins: {
          top: 50,
          bottom: 50,
          left: 72,
          right: 72,
        },
      });
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      let totalPrice = 0;
      pdfDoc.fontSize(26).text(`Invoice - ${orderId}`);
      pdfDoc.text(new Array(30).fill("_").join(""), { lineGap: 20 });
      order.products.forEach(({ product, quantity }) => {
        const itemTotal = quantity * product.price;
        totalPrice += itemTotal;
        pdfDoc
          .fontSize(14)
          .text(
            `${product.title} ------------- ${quantity}pcs -------- $${product.price} -------- $${itemTotal}`
          );
      });
      pdfDoc
        .fontSize(22)
        .text(new Array(30).fill("_").join(""), { lineGap: 20 });
      pdfDoc
        .fontSize(22)
        .fill("red")
        .text(`Total ${new Array(30).fill("-").join("")} $${totalPrice}`);

      pdfDoc.end();
    })
    .catch((err) => next(err));
};
