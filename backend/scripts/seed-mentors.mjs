// Seeds test mentor accounts into the database from MONGO_URI.
// Idempotent: mentors whose email already exists are skipped.
//
//   npm run seed:mentors
//
// All seeded mentors share the password below (development use only).

import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../src/models/user.model.js";

const PASSWORD = "Mentor@123";

// Subjects must match the Mentors page filter options.
const mentors = [
  { name: "Aarav Mehta", subject: "Mathematics", experience: "8+ Years", language: "Hindi, English", availability: "Available" },
  { name: "Sneha Iyer", subject: "Mathematics", experience: "5+ Years", language: "English, Tamil", availability: "Available" },
  { name: "Dr. Meera Nair", subject: "Science", experience: "12+ Years", language: "English, Malayalam", availability: "Available" },
  { name: "Arjun Reddy", subject: "Science", experience: "6+ Years", language: "Hindi, Telugu", availability: "Offline" },
  { name: "Ishaan Malhotra", subject: "Computer", experience: "7+ Years", language: "Hindi, English", availability: "Available" },
  { name: "Tanvi Deshpande", subject: "Computer", experience: "4+ Years", language: "Marathi, English", availability: "Available" },
  { name: "Riya Kapoor", subject: "English", experience: "6+ Years", language: "English, Hindi", availability: "Available" },
  { name: "Sanjay Mishra", subject: "English", experience: "10+ Years", language: "Hindi, English", availability: "Offline" },
  { name: "Kabir Choudhary", subject: "Career Guidance", experience: "9+ Years", language: "Hindi, English", availability: "Available" },
  { name: "Nandini Bose", subject: "Career Guidance", experience: "5+ Years", language: "Bengali, English", availability: "Available" },
  { name: "Harpreet Kaur", subject: "Science", experience: "7+ Years", language: "Punjabi, Hindi", availability: "Available" },
  { name: "Aditya Joshi", subject: "Mathematics", experience: "3+ Years", language: "Hindi, Gujarati", availability: "Available" },
];

const emailFor = (name) =>
  `${name.replace(/^Dr\.\s*/, "").toLowerCase().replace(/\s+/g, ".")}@mentor.shikshasetu.in`;

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set (backend/.env).");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10_000 });

  const hashed = await bcrypt.hash(PASSWORD, 10);
  let created = 0;

  for (const mentor of mentors) {
    const email = emailFor(mentor.name);

    if (await User.exists({ email })) {
      console.log(`skip    ${email} (already exists)`);
      continue;
    }

    await User.create({ ...mentor, email, password: hashed, role: "mentor" });
    console.log(`created ${email}  [${mentor.subject}]`);
    created++;
  }

  const total = await User.countDocuments({ role: "mentor" });
  console.log(`\n${created} mentor(s) created, ${total} mentor(s) in DB. Password: ${PASSWORD}`);

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Seeding failed:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
