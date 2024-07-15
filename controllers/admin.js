const { validationResult } = require("express-validator");

const Product = require("../models/product");
const fileHelpers = require("../util/file");

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
  console.log("IMAGE", req.file);
  const { title, price, description } = req.body;
  const image = req.file;
  const errors = validationResult(req);

  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      isAuthenticated: req.session.isLoggedIn,
      product: { ...req.body, image },
      hasError: true,
      validationErrors: [],
      errorMessage: "Invalid file format.",
    });
  }

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      isAuthenticated: req.session.isLoggedIn,
      product: { ...req.body, imageUrl: req.file.path },
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
    description,
    userId: req.user,
    imageUrl: req.file?.path,
  });

  return product
    .save(product)
    .then((result) => {
      console.log("Created product");
      res.redirect("/products");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
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
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const { description, price, title, productId: id } = req.body;
  const image = req.file;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render(`admin/edit-product`, {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      isAuthenticated: req.session.isLoggedIn,
      product: { ...req.body, _id: id },
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
      if (image) {
        fileHelpers.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }

      product.title = title;
      product.description = description;
      product.price = price;
      return product.save().then(() => res.redirect("/admin/products"));
    })
    .catch((err) => {
      console.log("UPDATE_ERR", err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
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
    .catch((err) => {
      console.log("Get Products err");
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const id = req.params.productId;
  Product.findById(id)
    .then((product) => {
      if (!product) {
        throw new Error("Product not found.");
      }
      fileHelpers.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: id, userId: req.user._id });
    })
    .then(() => {
      res.status(200).json({message: 'Success!'});
    })
    .catch((err) => {
      console.log("Delete", err);
      res.status(500).json({message: 'Failed to delete!'});
    });
};
