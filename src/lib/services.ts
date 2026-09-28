export const SERVICES = [
  {
    id: "Record Writing",
    icon: "📚",
    desc: "Neat and well-organized record writing services for students.",
  },
  {
    id: "Assignment Writing",
    icon: "📝",
    desc: "Affordable assignment preparation and formatting support.",
  },
  {
    id: "Project Assistance",
    icon: "💻",
    desc: "College project support, documentation, presentation and development assistance.",
  },
  {
    id: "Website Making",
    icon: "🌐",
    desc: "Professional and responsive websites for students, projects, portfolios and small businesses.",
  },
  {
    id: "PPT & Documentation",
    icon: "📊",
    desc: "Professional PowerPoint presentations, project documentation and reports.",
  },
  {
    id: "Poster & Design",
    icon: "🎨",
    desc: "Academic posters, project posters and basic digital design services.",
  },
  {
    id: "Resume / Portfolio",
    icon: "📄",
    desc: "Student resumes, portfolios and professional profile creation.",
  },
  {
    id: "Custom Student Service",
    icon: "🔧",
    desc: "Need something not listed? Contact us and discuss your requirements.",
  },
] as const;

export const SERVICE_NAMES = SERVICES.map((s) => s.id);

export const OWNER = {
  name: "Mohamed Nawfal Rifaath J",
  email: "therecordhub00716@gmail.com",
  whatsapp: "918870836892",
  whatsappDisplay: "+91 88708 36892",
};

export const WHATSAPP_CHAT_LINK = `https://wa.me/${OWNER.whatsapp}?text=${encodeURIComponent(
  "Hi The Record Hub, I would like to know more about your services.",
)}`;
