const Product = require("../models/product");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    isAuthenticated: req.session.isLoggedIn
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
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
      isAuthenticated: req.session.isLoggedIn
    });
  });
};

exports.postEditProduct = (req, res, next) => {
  const id = req.body.productId;
  const title = req.body.title;
  const price = req.body.price;
  const imageUrl = req.body.imageUrl;
  const description = req.body.description;

  Product.findByIdAndUpdate(id, { title, imageUrl, description, price, userId: req.user })
    .then(() => res.redirect("/admin/products"))
    .catch((err) => console.log("UPDATE_ERR", err));
};

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) =>
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
        isAuthenticated: req.session.isLoggedIn
      })
    )
    .catch((err) => console.log("Get Products err", err));
};

exports.postDeleteProduct = (req, res, next) => {
  const id = req.body.productId;
  Product.findByIdAndDelete(id)
    .then(() => res.redirect("/admin/products"))
    .catch((err) => console.log("Delete", err));
};
