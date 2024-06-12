const { where } = require("sequelize");
const Product = require("../models/product");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  req.user
    .createProduct({ title, imageUrl, description, price })
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
  req.user.getProducts({ where: { id: prodId } }).then(([product]) => {
    if (!product) {
      return res.redirect("/");
    }
    res.render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: editMode,
      product: product,
    });
  });
};

exports.postEditProduct = (req, res, next) => {
  const id = req.body.productId;
  const title = req.body.title;
  const price = req.body.price;
  const imageUrl = req.body.imageUrl;
  const description = req.body.description;
  Product.update(
    {
      title,
      price,
      imageUrl,
      description,
    },
    { where: { id } }
  )
    .then(() => res.redirect("/admin/products"))
    .catch((err) => console.log("UPDATE_ERR", err));
};

exports.getProducts = (req, res, next) => {
  req.user
    .getProducts()
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
  Product.destroy({ where: { id } })
    .then(() => res.redirect("/admin/products"))
    .catch((err) => console.log("Delete", err));
};
