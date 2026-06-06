import mongoose from "mongoose";

/**
 * Validates whether a string is a valid MongoDB ObjectId (24 hex chars).
 */
export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}
