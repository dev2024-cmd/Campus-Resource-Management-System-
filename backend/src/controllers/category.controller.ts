import { Response, NextFunction } from "express";
import Category from "../models/Category";
import Resource from "../models/Resource";
import { AuthRequest } from "../middleware/auth";
import { logAudit } from "../services/audit.service";

export const getCategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    // Enrich with resource counts
    const enriched = await Promise.all(
      categories.map(async (cat) => {
        const count = await Resource.countDocuments({
          $or: [{ category: cat.name }, { categoryId: cat._id }],
          isArchived: false,
        });
        return {
          ...cat.toObject(),
          resourceCount: count,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enriched,
      count: enriched.length,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, code } = req.body;

    const existingName = await Category.findOne({ name: name.trim() });
    if (existingName) {
      res.status(409).json({
        success: false,
        message: `Category name '${name}' already exists.`,
      });
      return;
    }

    const existingCode = await Category.findOne({ code: code.toUpperCase().trim() });
    if (existingCode) {
      res.status(409).json({
        success: false,
        message: `Category code '${code}' already exists.`,
      });
      return;
    }

    const category = await Category.create({
      ...req.body,
      name: name.trim(),
      code: code.toUpperCase().trim(),
    });

    await logAudit({
      action: "CREATE_CATEGORY",
      entity: "Category",
      entityId: category._id.toString(),
      req,
      details: `Created category ${category.name} (${category.code})`,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }

    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase().trim();
    }

    const updated = await Category.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    await logAudit({
      action: "UPDATE_CATEGORY",
      entity: "Category",
      entityId: String(id),
      req,
      details: `Updated category ${updated?.name}`,
    });

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }

    // Referential integrity check: cannot delete if linked resources exist
    const linkedResources = await Resource.countDocuments({
      $or: [{ category: category.name }, { categoryId: category._id }],
      isArchived: false,
    });

    if (linkedResources > 0) {
      res.status(409).json({
        success: false,
        message: `Cannot delete category '${category.name}': ${linkedResources} campus resource(s) are assigned to it. Reassign or delete those resources first.`,
      });
      return;
    }

    await Category.findByIdAndDelete(id);

    await logAudit({
      action: "DELETE_CATEGORY",
      entity: "Category",
      entityId: String(id),
      req,
      details: `Deleted category ${category.name}`,
    });

    res.status(200).json({
      success: true,
      message: `Category '${category.name}' deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};
