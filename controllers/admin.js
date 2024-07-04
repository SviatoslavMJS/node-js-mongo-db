const { validationResult } = require("express-validator");

const Product = require("../models/product");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage: null,
    isAuthenticated: req.session.isLoggedIn,
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const { title, imageUrl, price, description } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      isAuthenticated: req.session.isLoggedIn,
      product: req.body,
      hasError: true,
      validationErrors: errors.array(),
      errorMessage: errors
        .array()
        .map(({ msg, path }) => `${path} - ${msg}`)
        .join(", "),
    });
  }

  const product = new Product({
    title,
    price,
    imageUrl,
    description,
    userId: req.user,
  });
  product
    .save(product)
    .then((result) => {
      console.log("Created product");
      res.redirect("/products");
    })
    .catch((err) => console.log("postAddProduct", err));
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId).then((product) => {
    if (!product) {
      return res.redirect("/");
    }
    res.render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: editMode,
      product: product,
      hasError: false,
      errorMessage: null,
      validationErrors: [],
    });
  });
};

exports.postEditProduct = (req, res, next) => {
  const { description, imageUrl, price, title, productId: id } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(422)
      .render(`admin/edit-product`, {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: true,
        isAuthenticated: req.session.isLoggedIn,
        product: {...req.body, _id: id},
        hasError: true,
        validationErrors: errors.array(),
        errorMessage: errors
          .array()
          .map(({ msg, path }) => `${path} - ${msg}`)
          .join(", "),
      });
  }

  Product.findById(id)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }

      product.title = title;
      product.imageUrl = imageUrl;
      product.description = description;
      product.price = price;
      return product.save().then(() => res.redirect("/admin/products"));
    })
    .catch((err) => console.log("UPDATE_ERR", err));
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then((products) =>
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      })
    )
    .catch((err) => console.log("Get Products err", err));
};

exports.postDeleteProduct = (req, res, next) => {
  const id = req.body.productId;
  Product.deleteOne({ _id: id, userId: req.user._id })
    .then(() => res.redirect("/admin/products"))
    .catch((err) => console.log("Delete", err));
};
