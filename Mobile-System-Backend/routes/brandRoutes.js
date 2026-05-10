import express from "express";
import { addBrand, getBrands, updateBrand, deleteBrand, addCategoryToBrand, removeCategoryFromBrand, getBrandCategories, getBrandsByCategory } from "../controllers/brandController.js";
import { uploadAdminS3 } from "../config/s3MulterConfig.js";

const brandRouter = express.Router();

// Brand routes
brandRouter.post("/add", uploadAdminS3.single('logo'), addBrand);
brandRouter.get("/", getBrands);
brandRouter.put("/update/:brandId", uploadAdminS3.single('logo'), updateBrand);
brandRouter.get("/category/:categoryId", getBrandsByCategory);
brandRouter.get("/:brandId/categories", getBrandCategories);
brandRouter.delete("/delete/:brandId", deleteBrand);
brandRouter.post("/add-category", addCategoryToBrand);
brandRouter.post("/remove-category", removeCategoryFromBrand);

export default brandRouter;
