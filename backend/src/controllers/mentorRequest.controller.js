import bcrypt from "bcryptjs";
import MentorRequest from "../models/mentorRequest.model.js";
import User from "../models/user.model.js";

// ==========================================
// 1. STUDENT → SEND MENTOR REQUEST
// ==========================================

export const createMentorRequest = async (req, res) => {
  try {
    const { mentorId, message } = req.body;

    if (!mentorId) {
      return res.status(400).json({
        success: false,
        message: "Mentor ID is required",
      });
    }

    const existingRequest = await MentorRequest.findOne({
      student: req.user._id,
      mentor: mentorId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: "Request already sent to this mentor",
      });
    }

    const request = await MentorRequest.create({
      student: req.user._id,
      mentor: mentorId,
      message:
        message ||
        "I want to connect with you as my mentor.",
    });

    return res.status(201).json({
      success: true,
      message: "Mentor request sent successfully",
      request,
    });
  } catch (error) {
    console.error("Mentor Request Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// ==========================================
// 2. MENTOR → GET INCOMING REQUESTS
// ==========================================

export const getMentorRequests = async (req, res) => {
  try {
    const requests = await MentorRequest.find({
      mentor: req.user._id,
    })
      .populate("student", "name email language")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error(
      "Get Mentor Requests Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// ==========================================
// 3. MENTOR → ACCEPT / REJECT REQUEST
// ==========================================

export const updateMentorRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be accepted or rejected",
      });
    }

    const request =
      await MentorRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Mentor request not found",
      });
    }

    if (
      request.mentor.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to update this request",
      });
    }

    request.status = status;

    await request.save();

    return res.status(200).json({
      success: true,
      message: `Mentor request ${status} successfully`,
      request,
    });
  } catch (error) {
    console.error(
      "Update Mentor Request Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// ==========================================
// 4. GET MENTORS
// ==========================================

export const getMentors = async (req, res) => {
  try {
    console.log("GET /api/mentors called");

    const mentors = await User.find(
      {
        role: "mentor",
      },
      {
        name: 1,
        email: 1,
        language: 1,
        role: 1,
        subject: 1,
        experience: 1,
        availability: 1,
      }
    )
      .limit(10)
      .sort({ createdAt: -1 });

    console.log(
      "Mentors found:",
      mentors.length
    );

    return res.status(200).json({
      success: true,
      mentors,
    });
  } catch (error) {
    console.error(
      "GET MENTORS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load mentors",
      error: error.message,
    });
  }
};


// ==========================================
// 5. UPDATE MENTOR PROFILE
// ==========================================

export const updateMentorProfile = async (
  req,
  res
) => {
  try {
    const { mentorId } = req.params;

    const {
      subject,
      experience,
      language,
      availability,
    } = req.body;

    const mentor = await User.findOne({
      _id: mentorId,
      role: "mentor",
    });

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
      });
    }

    mentor.subject =
      subject || mentor.subject;

    mentor.experience =
      experience || mentor.experience;

    mentor.language =
      language || mentor.language;

    mentor.availability =
      availability || mentor.availability;

    await mentor.save();

    return res.status(200).json({
      success: true,
      message:
        "Mentor profile updated successfully",
      mentor: {
        id: mentor._id,
        name: mentor.name,
        email: mentor.email,
        role: mentor.role,
        language: mentor.language,
        subject: mentor.subject,
        experience: mentor.experience,
        availability: mentor.availability,
      },
    });
  } catch (error) {
    console.error(
      "Update Mentor Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// ==========================================
// 6. SEED DEMO MENTORS
// ==========================================

export const seedMentors = async (req, res) => {
  try {
    const mentors = [
      {
        name: "Rahul Sharma",
        email: "rahul@mentor.com",
        password: "12345678",
        role: "mentor",
        language: "Hindi, English",
        subject: "Mathematics",
        experience: "5+ Years",
        availability: "Available",
      },

      {
        name: "Priya Verma",
        email: "priya@mentor.com",
        password: "12345678",
        role: "mentor",
        language: "Hindi, English",
        subject: "Science",
        experience: "4+ Years",
        availability: "Available",
      },

      {
        name: "Amit Kumar",
        email: "amit@mentor.com",
        password: "12345678",
        role: "mentor",
        language: "Hindi, English",
        subject: "Computer",
        experience: "6+ Years",
        availability: "Available",
      },

      {
        name: "Neha Singh",
        email: "neha@mentor.com",
        password: "12345678",
        role: "mentor",
        language: "Hindi, English",
        subject: "English",
        experience: "3+ Years",
        availability: "Offline",
      },

      {
        name: "Vikash Gupta",
        email: "vikash@mentor.com",
        password: "12345678",
        role: "mentor",
        language: "Hindi, English",
        subject: "Career Guidance",
        experience: "7+ Years",
        availability: "Available",
      },

      {
        name: "Anjali Patel",
        email: "anjali@mentor.com",
        password: "12345678",
        role: "mentor",
        language: "Hindi, English",
        subject: "Mathematics",
        experience: "4+ Years",
        availability: "Available",
      },

      {
        name: "Pooja Sharma",
        email: "pooja@mentor.com",
        password: "12345678",
        role: "mentor",
        language: "Hindi, English",
        subject: "Science",
        experience: "5+ Years",
        availability: "Available",
      },

      {
        name: "Rohit Kumar",
        email: "rohit@mentor.com",
        password: "12345678",
        role: "mentor",
        language: "Hindi, English",
        subject: "Computer",
        experience: "4+ Years",
        availability: "Available",
      },

      {
        name: "Kavita Singh",
        email: "kavita@mentor.com",
        password: "12345678",
        role: "mentor",
        language: "Hindi, English",
        subject: "English",
        experience: "6+ Years",
        availability: "Available",
      },
    ];

    const createdMentors = [];

    for (const mentorData of mentors) {
      const existingMentor =
        await User.findOne({
          email: mentorData.email,
        });

      if (existingMentor) {
        continue;
      }

      const hashedPassword =
        await bcrypt.hash(
          mentorData.password,
          10
        );

      const mentor = await User.create({
        ...mentorData,
        password: hashedPassword,
      });

      createdMentors.push({
        id: mentor._id,
        name: mentor.name,
        email: mentor.email,
        subject: mentor.subject,
      });
    }

    return res.status(201).json({
      success: true,
      message: `${createdMentors.length} demo mentors created successfully`,
      mentors: createdMentors,
    });
  } catch (error) {
    console.error(
      "Seed Mentors Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create demo mentors",
      error: error.message,
    });
  }
};

export const getStudentMentorRequests = async (req, res) => {
  try {
    const requests = await MentorRequest.find({
      student: req.user._id,
    })
      .populate(
        "mentor",
        "name email language subject experience availability"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get student mentor requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch mentor requests",
    });
  }
};