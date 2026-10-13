import { Response, NextFunction } from "express";
import Location from "../models/Location";
import Resource from "../models/Resource";
import { AuthRequest } from "../middleware/auth";
import { logAudit } from "../services/audit.service";

export const getLocations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locations = await Location.find().sort({ building: 1, name: 1 });

    const enriched = await Promise.all(
      locations.map(async (loc) => {
        const count = await Resource.countDocuments({
          $or: [{ location: loc.name }, { locationId: loc._id }, { building: loc.building }],
          isArchived: false,
        });
        return {
          ...loc.toObject(),
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

export const createLocation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const location = await Location.create(req.body);

    await logAudit({
      action: "CREATE_LOCATION",
      entity: "Location",
      entityId: location._id.toString(),
      req,
      details: `Created location ${location.name} in ${location.building}`,
    });

    res.status(201).json({
      success: true,
      message: "Location created successfully",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLocation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await Location.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!updated) {
      res.status(404).json({ success: false, message: "Location not found" });
      return;
    }

    await logAudit({
      action: "UPDATE_LOCATION",
      entity: "Location",
      entityId: String(id),
      req,
      details: `Updated location ${updated.name}`,
    });

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLocation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const location = await Location.findById(id);

    if (!location) {
      res.status(404).json({ success: false, message: "Location not found" });
      return;
    }

    const linkedResources = await Resource.countDocuments({
      $or: [{ location: location.name }, { locationId: location._id }],
      isArchived: false,
    });

    if (linkedResources > 0) {
      res.status(409).json({
        success: false,
        message: `Cannot delete location '${location.name}': ${linkedResources} campus resource(s) are assigned to this location. Please reassign them first.`,
      });
      return;
    }

    await Location.findByIdAndDelete(id);

    await logAudit({
      action: "DELETE_LOCATION",
      entity: "Location",
      entityId: String(id),
      req,
      details: `Deleted location ${location.name}`,
    });

    res.status(200).json({
      success: true,
      message: `Location '${location.name}' deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};
