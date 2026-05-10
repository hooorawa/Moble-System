import express from "express";
import { addAddress, getAddresses, getAddress, updateAddress, deleteAddress } from "../controllers/addressController.js";
import auth from "../middleware/auth.js";

const addressRouter = express.Router();

// All address routes require authentication
addressRouter.post("/add", auth, addAddress);
addressRouter.get("/", auth, getAddresses);
addressRouter.get("/:addressId", auth, getAddress);
addressRouter.put("/update/:addressId", auth, updateAddress);
addressRouter.delete("/delete/:addressId", auth, deleteAddress);

export default addressRouter;
