// controllers/coursesListController.js
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";

const fmtDateOnly = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "TBA";

export const coursesListPage = async (req, res, next) => {
  try {
    const { level, type, dropin, q, page = "1", pageSize = "9" } = req.query;

    const filter = {};
    if (level) filter.level = level;
    if (type) filter.type = type;
    if (dropin === "yes") filter.allowDropIn = true;
    if (dropin === "no") filter.allowDropIn = false;

    let courses = await CourseModel.list(filter);

    const needle = (q || "").trim().toLowerCase();
    if (needle) {
      courses = courses.filter(
        (c) =>
          c.title?.toLowerCase().includes(needle) ||
          c.description?.toLowerCase().includes(needle)
      );
    }

    courses.sort((a, b) => {
      const ad = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bd = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER;
      if (ad !== bd) return ad - bd;
      return (a.title || "").localeCompare(b.title || "");
    });

    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.max(1, parseInt(pageSize, 10) || 9);
    const total = courses.length;
    const totalPages = Math.max(1, Math.ceil(total / ps));
    const pageItems = courses.slice((p - 1) * ps, p * ps);

    const cards = await Promise.all(
      pageItems.map(async (c) => {
        const sessions = await SessionModel.listByCourse(c._id);
        const first = sessions[0];
        return {
          id: c._id,
          title: c.title,
          level: c.level,
          type: c.type,
          allowDropIn: c.allowDropIn,
          startDate: fmtDateOnly(c.startDate),
          endDate: fmtDateOnly(c.endDate),
          nextSession: first ? fmtDateTime(first.startDateTime) : "TBA",
          sessionsCount: sessions.length,
          description: c.description,
          location: c.location || "Yoga Studio, Glasgow",
          price: c.price ? `£${c.price}` : "Contact for pricing",
        };
      })
    );

    const buildLink = (newPage) => {
      const params = new URLSearchParams({ ...req.query, page: String(newPage), pageSize: String(ps) });
      return `/courses?${params.toString()}`;
    };

    res.render("courses", {
      title: "All Courses",
      filters: { level, type, dropin, q },
      courses: cards,
      pagination: {
        page: p,
        totalPages,
        total,
        hasPrev: p > 1,
        hasNext: p < totalPages,
        prevLink: p > 1 ? buildLink(p - 1) : null,
        nextLink: p < totalPages ? buildLink(p + 1) : null,
      },
    });
  } catch (err) {
    next(err);
  }
};
