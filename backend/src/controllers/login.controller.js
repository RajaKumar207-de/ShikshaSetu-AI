import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { v } from "../middleware/validate.js";

// Compared against when the email is unknown, so the response time doesn't
// reveal whether an account exists.
const DUMMY_HASH =
    "$2a$10$CwTycUXWue0Thq9StjUM0uJ8Qe0Yq1X6Yl1Yk8m6uG1n0mF5wZ9Aa";

export const loginUser = async (req, res) => {
    // Types are checked first so { "$ne": "" } style payloads never reach the query.
    const email = v.email(req.body?.email);
    const password = v.password(req.body?.password);

    const user = await User.findOne({ email }).select("+password");

    const isPasswordCorrect = await bcrypt.compare(
        password,
        user?.password || DUMMY_HASH
    );

    if (!user || !isPasswordCorrect) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    const token = jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            algorithm: "HS256",
            expiresIn: process.env.JWT_EXPIRES_IN || "7d"
        }
    );

    res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            language: user.language
        }
    });
};
