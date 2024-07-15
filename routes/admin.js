const express = require("express");
const { body } = require("express-validator");

const isAuth = require("../middleware/is-auth");
const adminController = require("../controllers/admin");

const router = express.Router();

router.get("/add-product", isAuth, adminController.getAddProduct);

router.get("/products", isAuth, adminController.getProducts);

router.post(
  "/add-product",
  [
    body("title", "At least 3 characters required")
      .isString()
      .trim()
      .isLength({ min: 3 }),
    body("description", "At least 10 characters required")
      .isString()
      .trim()
      .isLength({ min: 10, max: 400 }),
    body("price", "Required field").isFloat(),
    // body("imageUrl").isURL(),
  ],
  isAuth,
  adminController.postAddProduct
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/edit-product/",
  [
    body("title", "At least 3 characters required")
      .isString()
      .trim()
      .isLength({ min: 3 }),
    body("description", "At least 10 characters required")
      .isString()
      .trim()
      .isLength({ min: 10, max: 400 }),
    body("price", "Required field").isFloat(),
    // body("imageUrl").isURL(),
  ],
  isAuth,
  adminController.postEditProduct
);

router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;
