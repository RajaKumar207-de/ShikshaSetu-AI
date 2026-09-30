import Scholarship from "../models/scholarship.model.js";
import {
  getPagination,
  paginationMeta,
  v,
} from "../middleware/validate.js";
import logger, { errorMeta } from "../utils/logger.js";

// Filters must be plain short strings (never objects), so a query like
// ?state[$ne]=x can't reach MongoDB as an operator.
const text = (value) => (typeof value === "string" ? value.slice(0, 60) : undefined);

// Scholarship lists are capped: default 50, at most 100 per request.
const LIST_OPTIONS = { defaultLimit: 50, maxLimit: 100 };

// ==========================================
// 1. GET ALL SCHOLARSHIPS
// ==========================================

export const getScholarships = async (req, res) => {
  try {
    const pagination = getPagination(req.query, LIST_OPTIONS);
    const filter = { isActive: true };

    const [scholarships, total] = await Promise.all([
      Scholarship.find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Scholarship.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: scholarships.length,
      scholarships,
      pagination: paginationMeta(pagination, total),
    });
  } catch (error) {
    // validation errors (400) go to the central error handler
    if (error.expose) throw error;

    logger.error("Get Scholarships Error", errorMeta(error));

    res.status(500).json({
      success: false,
      message: "Failed to fetch scholarships",
    });
  }
};


// ==========================================
// 2. GET SINGLE SCHOLARSHIP
// ==========================================

export const getScholarshipById = async (req, res) => {
  try {
    const id = v.objectId(req.params.id, "scholarship id");

    const scholarship = await Scholarship.findOne({
      _id: id,
      isActive: true,
    });

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: "Scholarship not found",
      });
    }

    res.status(200).json({
      success: true,
      scholarship,
    });
  } catch (error) {
    // validation errors (400) go to the central error handler
    if (error.expose) throw error;

    logger.error("Get Scholarship Error", errorMeta(error));

    res.status(500).json({
      success: false,
      message: "Failed to fetch scholarship",
    });
  }
};


// ==========================================
// 3. SEARCH / FILTER SCHOLARSHIPS
// ==========================================

export const searchScholarships = async (req, res) => {
  try {
    const state = text(req.query.state);
    const category = text(req.query.category);
    const educationLevel = text(req.query.educationLevel);
    const pagination = getPagination(req.query, LIST_OPTIONS);

    const filter = {
      isActive: true,
    };

    // State filter
    if (state && state !== "All India") {
      filter.$or = [
        { state: state },
        { state: "All India" },
      ];
    }

    // Category filter
    if (category && category !== "All") {
      filter.category = category;
    }

    // Education level filter
    if (
      educationLevel &&
      educationLevel !== "All"
    ) {
      filter.educationLevel = educationLevel;
    }

    const [scholarships, total] = await Promise.all([
      Scholarship.find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Scholarship.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: scholarships.length,
      scholarships,
      pagination: paginationMeta(pagination, total),
    });
  } catch (error) {
    // validation errors (400) go to the central error handler
    if (error.expose) throw error;

    logger.error("Search Scholarships Error", errorMeta(error));

    res.status(500).json({
      success: false,
      message: "Failed to search scholarships",
    });
  }
};
// ==========================================
// 4. ADD DEMO SCHOLARSHIPS
// ==========================================

export const seedScholarships = async (req, res) => {
  try {
    const scholarships = [
      {
        name: "ShikshaSetu Demo Scholarship - All India",
        provider: "ShikshaSetu AI",
        description:
          "Demo scholarship for testing the ShikshaSetu scholarship discovery system.",
        amount: "₹25,000",
        state: "All India",
        category: ["General", "OBC", "SC", "ST"],
        educationLevel: ["Class 11", "Class 12", "College"],
        incomeLimit: "Up to ₹5 Lakh",
        deadline: "Demo Deadline",
        documents: [
          "Aadhaar Card",
          "Income Certificate",
          "Marksheet",
        ],
        officialLink: "https://scholarships.gov.in/",
        isActive: true,
      },
      {
        name: "ShikshaSetu Demo Scholarship - Chhattisgarh",
        provider: "ShikshaSetu AI",
        description:
          "Demo scholarship for students from Chhattisgarh.",
        amount: "₹20,000",
        state: "Chhattisgarh",
        category: ["SC", "ST", "OBC"],
        educationLevel: ["Class 11", "Class 12", "College"],
        incomeLimit: "Up to ₹4 Lakh",
        deadline: "Demo Deadline",
        documents: [
          "Aadhaar Card",
          "Income Certificate",
          "Marksheet",
        ],
        officialLink: "https://scholarships.gov.in/",
        isActive: true,
      },
      {
        name: "ShikshaSetu Demo Scholarship - Bihar",
        provider: "ShikshaSetu AI",
        description:
          "Demo scholarship for students from Bihar.",
        amount: "₹20,000",
        state: "Bihar",
        category: ["SC", "ST", "OBC"],
        educationLevel: ["Class 11", "Class 12", "College"],
        incomeLimit: "Up to ₹4 Lakh",
        deadline: "Demo Deadline",
        documents: [
          "Aadhaar Card",
          "Income Certificate",
          "Marksheet",
        ],
        officialLink: "https://scholarships.gov.in/",
        isActive: true,
      },
    ];

    const existingCount = await Scholarship.countDocuments();

    if (existingCount > 0) {
      // Demo entries only: give them a real (demo) date so deadline
      // reminders can be tried out. Real scholarships are never touched.
      const demo = await Scholarship.find({
        deadline: "Demo Deadline",
        deadlineDate: null,
      });
      let offset = 0;
      for (const item of demo) {
        item.deadlineDate = new Date(
          Date.now() + (12 + offset * 20) * 86400000
        );
        item.deadline = item.deadlineDate.toDateString();
        await item.save();
        offset += 1;
      }

      return res.status(200).json({
        success: true,
        message:
          demo.length > 0
            ? `Scholarship demo data already exists. Added demo deadline dates to ${demo.length} entries.`
            : "Scholarship demo data already exists",
      });
    }

    // Demo entries get demo (relative) dates so reminders can be tried.
    const withDates = scholarships.map((item, index) => {
      const deadlineDate = new Date(
        Date.now() + (12 + index * 20) * 86400000
      );
      return {
        ...item,
        deadlineDate,
        deadline: deadlineDate.toDateString(),
      };
    });

    const createdScholarships =
      await Scholarship.insertMany(withDates);

    res.status(201).json({
      success: true,
      message: `${createdScholarships.length} demo scholarships created successfully`,
      scholarships: createdScholarships,
    });
  } catch (error) {
    // validation errors (400) go to the central error handler
    if (error.expose) throw error;

    logger.error("Seed Scholarships Error", errorMeta(error));

    res.status(500).json({
      success: false,
      message: "Failed to create demo scholarships",
    });
  }
};
export const findScholarshipsForStudent = async (req, res) => {
  try {
    const state = text(req.body?.state);
    const category = text(req.body?.category);
    const educationLevel = text(req.body?.educationLevel);

    const filter = {
      isActive: true,
    };

    // State matching
    if (state && state !== "All India") {
      filter.$or = [
        { state: state },
        { state: "All India" },
      ];
    }

    // Category matching
    if (category && category !== "All") {
      filter.category = category;
    }

    // Education level matching
    if (
      educationLevel &&
      educationLevel !== "All"
    ) {
      filter.educationLevel = educationLevel;
    }

    const scholarships = await Scholarship.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.status(200).json({
      success: true,
      count: scholarships.length,
      message:
        scholarships.length > 0
          ? "Matching scholarships found"
          : "No matching scholarships found",
      scholarships,
    });

  } catch (error) {
    // validation errors (400) go to the central error handler
    if (error.expose) throw error;

    logger.error("Find Student Scholarships Error", errorMeta(error));

    res.status(500).json({
      success: false,
      message:
        "Failed to find scholarships",
    });
  }
};