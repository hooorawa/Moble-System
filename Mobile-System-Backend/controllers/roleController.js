import roleModel from "../models/roleModel.js";

// Get all roles
export const getAllRoles = async (req, res) => {
  try {
    const roles = await roleModel.find({ isActive: true }).sort({ isDefault: -1, name: 1 });
    
    res.json({
      success: true,
      roles: roles
    });
  } catch (error) {
    console.error("Get all roles error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Add new role
export const addRole = async (req, res) => {
  try {
    const { name, displayName } = req.body;

    if (!name || !displayName) {
      return res.json({ 
        success: false, 
        message: "Role name and display name are required" 
      });
    }

    // Check if role already exists
    const existingRole = await roleModel.findOne({ name: name.toLowerCase() });
    if (existingRole) {
      return res.json({ 
        success: false, 
        message: "Role already exists" 
      });
    }

    const newRole = new roleModel({
      name: name.toLowerCase().trim(),
      displayName: displayName.trim(),
      isDefault: false
    });

    const savedRole = await newRole.save();

    res.json({
      success: true,
      message: "Role added successfully",
      role: savedRole
    });
  } catch (error) {
    console.error("Add role error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

// Delete role
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if role exists
    const role = await roleModel.findById(id);
    if (!role) {
      return res.json({ success: false, message: "Role not found" });
    }

    // Check if it's a default role
    if (role.isDefault) {
      return res.json({ 
        success: false, 
        message: "Cannot delete default roles" 
      });
    }

    // Soft delete by setting isActive to false
    await roleModel.findByIdAndUpdate(id, { isActive: false });

    res.json({
      success: true,
      message: "Role deleted successfully"
    });
  } catch (error) {
    console.error("Delete role error:", error);
    res.json({ success: false, message: "Server error" });
  }
};
