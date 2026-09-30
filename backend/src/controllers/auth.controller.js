import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { LANGUAGES, v } from "../middleware/validate.js";

export const registerUser = async (req, res) => {
    // Only these fields are read: anything else in the body is ignored.
    const name = v.string(req.body?.name, "Name", { max: 80 });
    const email = v.email(req.body?.email);
    const password = v.password(req.body?.password, { strict: true });
    const language =
        v.oneOf(req.body?.language, "language", LANGUAGES, { optional: true }) ||
        "Hindi";

    // Public sign-up can create students or mentors, never admins.
    const role = req.body?.role === "mentor" ? "mentor" : "student";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: "User already exists"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // A parallel duplicate sign-up hits the unique email index (409 via the
    // central error handler).
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        language
    });

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            language: user.language
        }
    });
};
