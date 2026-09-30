import bcrypt from "bcryptjs";
import MentorRequest from "../models/mentorRequest.model.js";
import User from "../models/user.model.js";
import { notify } from "../services/notification.service.js";
import { getPagination, paginationMeta } from "../middleware/validate.js";
import logger, { errorMeta } from "../utils/logger.js";

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

    if (
      !/^[a-f\d]{24}$/i.test(String(mentorId)) ||
      !(await User.exists({ _id: mentorId, role: "mentor" }))
    ) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
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
        String(
          message ||
            "I want to connect with you as my mentor."
        ).slice(0, 500),
    });

    await notify(mentorId, {
      type: "mentor_request",
      title: "New mentor request",
      message: `${req.user.name} wants to connect with you.`,
      relatedEntity: "MentorRequest",
      relatedEntityId: request._id,
      link: "/mentors",
    });

    return res.status(201).json({
      success: true,
      message: "Mentor request sent successfully",
      request,
    });
  } catch (error) {
    // validation errors (400) go to the central error handler
    if (error.expose) throw error;

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Request already sent to this mentor",
      });
    }
    logger.error("Mentor request failed", errorMeta(error));

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ==========================================
// 2. MENTOR → GET INCOMING REQUESTS
// ==========================================

export const getMentorRequests = async (req, res) => {
  try {
    const pagination = getPagination(req.query, {
      defaultLimit: 50,
      maxLimit: 100,
    });
    const filter = { mentor: req.user._id };

    const [requests, total] = await Promise.all([
      MentorRequest.find(filter)
        .populate("student", "name email language")
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      MentorRequest.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      requests,
      pagination: paginationMeta(pagination, total),
    });
  } catch (error) {
    // validation errors (400) go to the central error handler
    if (error.expose) throw error;

    logger.error("Get Mentor Requests Error", errorMeta(error));

    return res.status(500).json({
      success: false,
      message: "Server error",
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

    if (request.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: `This request was already ${request.status}`,
      });
    }

    request.status = status;

    await request.save();

    await notify(request.student, {
      type:
        status === "accepted"
          ? "mentor_request_accepted"
          : "mentor_request_rejected",
      title:
        status === "accepted"
          ? "Mentor request accepted"
          : "Mentor request declined",
      message:
        status === "accepted"
          ? `${req.user.name} accepted your request.`
          : `${req.user.name} could not accept your request. You can try another mentor.`,
      relatedEntity: "MentorRequest",
      relatedEntityId: request._id,
      link: "/mentors",
    });

    return res.status(200).json({
      success: true,
      message: `Mentor request ${status} successfully`,
      request,
    });
  } catch (error) {
    // validation errors (400) go to the central error handler
    if (error.expose) throw error;

    logger.error("Update Mentor Request Error", errorMeta(error));

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ==========================================
// 4. GET MENTORS
// ==========================================

export const getMentors = async (req, res) => {
  try {
    const pagination = getPagination(req.query, {
      defaultLimit: 20,
      maxLimit: 50,
    });

    // Contact emails are only shown to signed-in users.
    const projection = {
      name: 1,
      language: 1,
      role: 1,
      subject: 1,
      experience: 1,
      availability: 1,
      ...(req.user ? { email: 1 } : {}),
    };

    const [mentors, total] = await Promise.all([
      User.find({ role: "mentor" }, projection)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      User.countDocuments({ role: "mentor" }),
    ]);

    return res.status(200).json({
      success: true,
      mentors,
      pagination: paginationMeta(pagination, total),
    });
  } catch (error) {
    // validation errors (400) go to the central error handler
    if (error.expose) throw error;

    logger.error("Get mentors failed", errorMeta(error));

    return res.status(500).json({
      success: false,
      message: "Failed to load mentors",
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

    // A mentor may only edit their own profile (admins can edit any).
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== mentorId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile",
      });
    }

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
    // validation errors (400) go to the central error handler
    if (error.expose) throw error;

    logger.error("Update Mentor Profile Error", errorMeta(error));

    return res.status(500).json({
      success: false,
      message: "Server error",
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
    // validation errors (400) go to the central error handler
    if (error.expose) throw error;

    logger.error("Seed Mentors Error", errorMeta(error));

    return res.status(500).json({
      success: false,
      message: "Failed to create demo mentors",
    });
  }
};

export const getStudentMentorRequests = async (req, res) => {
  try {
    const pagination = getPagination(req.query, {
      defaultLimit: 50,
      maxLimit: 100,
    });
    const filter = { student: req.user._id };

    const [requests, total] = await Promise.all([
      MentorRequest.find(filter)
        .populate(
          "mentor",
          "name email language subject experience availability"
        )
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      MentorRequest.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      requests,
      pagination: paginationMeta(pagination, total),
    });
  } catch (error) {
    // validation errors (400) go to the central error handler
    if (error.expose) throw error;

    logger.error("Get student mentor requests error", errorMeta(error));

    return res.status(500).json({
      success: false,
      message: "Unable to fetch mentor requests",
    });
  }
};