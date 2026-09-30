import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const deny = (res, message) =>
    res.status(401).json({ success: false, message });

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return deny(res, "Authorization token is required");
        }

        // Expected: Bearer TOKEN
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : authHeader;

        // Pin the algorithm so tokens with a different alg are rejected.
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"],
        });

        // Always reload the user: role changes and deleted accounts take
        // effect immediately, and the password hash is never selected.
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return deny(res, "User not found");
        }

        req.user = user;
        next();
    } catch (error) {
        return deny(res, "Invalid or expired token");
    }
};
