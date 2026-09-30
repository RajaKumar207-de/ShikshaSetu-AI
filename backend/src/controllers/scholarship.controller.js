import Scholarship from "../models/scholarship.model.js";

// ==========================================
// 1. GET ALL SCHOLARSHIPS
// ==========================================

export const getScholarships = async (req, res) => {
  try {
    const scholarships = await Scholarship.find({
      isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: scholarships.length,
      scholarships,
    });
  } catch (error) {
    console.error("Get Scholarships Error:", error);

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
    const { id } = req.params;

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
    console.error("Get Scholarship Error:", error);

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
    const {
      state,
      category,
      educationLevel,
    } = req.query;

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

    const scholarships = await Scholarship.find(
      filter
    ).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: scholarships.length,
      scholarships,
    });
  } catch (error) {
    console.error(
      "Search Scholarships Error:",
      error
    );

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
      return res.status(200).json({
        success: true,
        message: "Scholarship demo data already exists",
      });
    }

    const createdScholarships =
      await Scholarship.insertMany(scholarships);

    res.status(201).json({
      success: true,
      message: `${createdScholarships.length} demo scholarships created successfully`,
      scholarships: createdScholarships,
    });
  } catch (error) {
    console.error(
      "Seed Scholarships Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create demo scholarships",
    });
  }
};
export const findScholarshipsForStudent = async (req, res) => {
  try {
    const {
      state,
      category,
      educationLevel,
    } = req.body;

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

    const scholarships =
      await Scholarship.find(filter)
        .sort({ createdAt: -1 });

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
    console.error(
      "Find Student Scholarships Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to find scholarships",
    });
  }
};