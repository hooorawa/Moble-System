import express from "express";
import { addCategory, getCategories, updateCategory, deleteCategory, getCategoryUsage } from "../controllers/categoryController.js";

const categoryRouter = express.Router();

// Category routes
categoryRouter.post("/add", addCategory);
categoryRouter.get("/", getCategories);
categoryRouter.put("/update/:categoryId", updateCategory);
categoryRouter.get("/usage", getCategoryUsage);
categoryRouter.delete("/delete/:categoryId", deleteCategory);

export default categoryRouter;
