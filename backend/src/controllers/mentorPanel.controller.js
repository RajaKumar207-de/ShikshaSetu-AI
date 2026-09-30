import MentorRequest from "../models/mentorRequest.model.js";
import User from "../models/user.model.js";
import { notify } from "../services/notification.service.js";
import {
  INACTIVE_AFTER_DAYS,
  bulkMentorStats,
  bulkStudentStats,
  emptyMentorStats,
  emptyStats,
  studentProgress,
} from "../services/progress.service.js";
import { v } from "../middleware/validate.js";
import { forbidden, notFound } from "../utils/httpError.js";

// Mentor panel API. A mentor only ever sees students who sent them a
// request that they accepted: the student chose to share with them.

const acceptedStudentIds = async (mentorId) =>
  MentorRequest.distinct("student", { mentor: mentorId, status: "accepted" });

const assertMyStudent = async (mentorId, studentId) => {
  const ok = await MentorRequest.exists({
    mentor: mentorId,
    student: studentId,
    status: "accepted",
  });
  if (!ok) throw forbidden("This student is not connected with you");
};

export const getMentorOverview = async (req, res) => {
  const mentorId = req.user._id;

  const [statsMap, studentIds] = await Promise.all([
    bulkMentorStats([mentorId]),
    acceptedStudentIds(mentorId),
  ]);
  const studentStats = await bulkStudentStats(studentIds);

  const inactive = studentIds.filter((id) => {
    const days = studentStats.get(String(id))?.inactiveDays;
    return days === null || days === undefined || days >= INACTIVE_AFTER_DAYS;
  }).length;

  return res.json({
    success: true,
    profile: {
      id: req.user._id,
      name: req.user.name,
      subject: req.user.subject,
      experience: req.user.experience,
      language: req.user.language,
      availability: req.user.availability,
    },
    stats: statsMap.get(String(mentorId)) || emptyMentorStats,
    inactiveStudents: inactive,
    inactiveAfterDays: INACTIVE_AFTER_DAYS,
  });
};

export const getMyStudents = async (req, res) => {
  const requests = await MentorRequest.find({
    mentor: req.user._id,
    status: "accepted",
  })
    .populate("student", "name email language")
    .sort({ updatedAt: -1 })
    .limit(200)
    .lean();

  const students = requests.filter((r) => r.student);
  const stats = await bulkStudentStats(students.map((r) => r.student._id));

  return res.json({
    success: true,
    students: students.map((r) => ({
      id: r.student._id,
      name: r.student.name,
      email: r.student.email,
      language: r.student.language,
      connectedAt: r.updatedAt,
      stats: stats.get(String(r.student._id)) || emptyStats,
    })),
  });
};

export const getMyStudent = async (req, res) => {
  const id = v.objectId(req.params.id, "student ID");
  await assertMyStudent(req.user._id, id);

  const student = await User.findById(id).select("name email language").lean();
  if (!student) throw notFound("Student not found");

  return res.json({
    success: true,
    student: {
      id: student._id,
      name: student.name,
      email: student.email,
      language: student.language,
    },
    progress: await studentProgress(id),
  });
};

export const remindStudent = async (req, res) => {
  const id = v.objectId(req.params.id, "student ID");
  const message = v.string(req.body?.message, "Message", { max: 300 });
  await assertMyStudent(req.user._id, id);

  await notify(id, {
    type: "learning_reminder",
    title: `Message from your mentor ${req.user.name}`,
    message,
    relatedEntity: "User",
    relatedEntityId: req.user._id,
    link: "/learning-path",
    metadata: { fromMentor: String(req.user._id) },
  });

  return res.json({ success: true, message: "Reminder sent" });
};
