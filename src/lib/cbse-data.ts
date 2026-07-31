// src/lib/cbse-data.ts

export type SubjectName = "Mathematics" | "Science" | "Social Science" | "English";

export interface Chapter {
  id: string;
  title: string;
  status: "pending" | "in-progress" | "completed";
  progress: number;
}

export interface SubjectSyllabus {
  subject: SubjectName;
  color: string;
  bg: string;
  border: string;
  chapters: Chapter[];
}

export const CBSE_CLASS_10_SYLLABUS: SubjectSyllabus[] = [
  {
    subject: "Mathematics",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    chapters: [
      { id: "math_1", title: "Real Numbers", status: "completed", progress: 100 },
      { id: "math_2", title: "Polynomials", status: "in-progress", progress: 45 },
      { id: "math_3", title: "Pair of Linear Equations in Two Variables", status: "pending", progress: 0 },
      { id: "math_4", title: "Quadratic Equations", status: "pending", progress: 0 },
      { id: "math_5", title: "Arithmetic Progressions", status: "pending", progress: 0 },
      { id: "math_6", title: "Triangles", status: "pending", progress: 0 },
      { id: "math_7", title: "Coordinate Geometry", status: "pending", progress: 0 },
      { id: "math_8", title: "Introduction to Trigonometry", status: "pending", progress: 0 },
      { id: "math_9", title: "Some Applications of Trigonometry", status: "pending", progress: 0 },
      { id: "math_10", title: "Circles", status: "pending", progress: 0 },
      { id: "math_11", title: "Areas Related to Circles", status: "pending", progress: 0 },
      { id: "math_12", title: "Surface Areas and Volumes", status: "pending", progress: 0 },
      { id: "math_13", title: "Statistics", status: "pending", progress: 0 },
      { id: "math_14", title: "Probability", status: "pending", progress: 0 },
    ],
  },
  {
    subject: "Science",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    chapters: [
      { id: "sci_1", title: "Chemical Reactions and Equations", status: "completed", progress: 100 },
      { id: "sci_2", title: "Acids, Bases and Salts", status: "in-progress", progress: 60 },
      { id: "sci_3", title: "Metals and Non-metals", status: "pending", progress: 0 },
      { id: "sci_4", title: "Carbon and its Compounds", status: "pending", progress: 0 },
      { id: "sci_5", title: "Life Processes", status: "pending", progress: 0 },
      { id: "sci_6", title: "Control and Coordination", status: "pending", progress: 0 },
      { id: "sci_7", title: "How do Organisms Reproduce?", status: "pending", progress: 0 },
      { id: "sci_8", title: "Heredity", status: "pending", progress: 0 },
      { id: "sci_9", title: "Light - Reflection and Refraction", status: "pending", progress: 0 },
      { id: "sci_10", title: "The Human Eye and the Colourful World", status: "pending", progress: 0 },
      { id: "sci_11", title: "Electricity", status: "pending", progress: 0 },
      { id: "sci_12", title: "Magnetic Effects of Electric Current", status: "pending", progress: 0 },
      { id: "sci_13", title: "Our Environment", status: "pending", progress: 0 },
    ],
  },
  {
    subject: "Social Science",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    chapters: [
      { id: "sst_1", title: "The Rise of Nationalism in Europe", status: "in-progress", progress: 30 },
      { id: "sst_2", title: "Nationalism in India", status: "pending", progress: 0 },
      { id: "sst_3", title: "The Making of a Global World", status: "pending", progress: 0 },
      { id: "sst_4", title: "Print Culture and the Modern World", status: "pending", progress: 0 },
      { id: "sst_5", title: "Resources and Development", status: "pending", progress: 0 },
      { id: "sst_6", title: "Forest and Wildlife Resources", status: "pending", progress: 0 },
      { id: "sst_7", title: "Water Resources", status: "pending", progress: 0 },
      { id: "sst_8", title: "Agriculture", status: "pending", progress: 0 },
      { id: "sst_9", title: "Power Sharing", status: "pending", progress: 0 },
      { id: "sst_10", title: "Federalism", status: "pending", progress: 0 },
      { id: "sst_11", title: "Development", status: "pending", progress: 0 },
      { id: "sst_12", title: "Sectors of the Indian Economy", status: "pending", progress: 0 },
    ],
  },
  {
    subject: "English",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    chapters: [
      { id: "eng_1", title: "A Letter to God", status: "completed", progress: 100 },
      { id: "eng_2", title: "Nelson Mandela: Long Walk to Freedom", status: "completed", progress: 100 },
      { id: "eng_3", title: "Two Stories about Flying", status: "in-progress", progress: 50 },
      { id: "eng_4", title: "From the Diary of Anne Frank", status: "pending", progress: 0 },
      { id: "eng_5", title: "Glimpses of India", status: "pending", progress: 0 },
      { id: "eng_6", title: "Mijbil the Otter", status: "pending", progress: 0 },
      { id: "eng_7", title: "Madam Rides the Bus", status: "pending", progress: 0 },
      { id: "eng_8", title: "The Sermon at Benares", status: "pending", progress: 0 },
      { id: "eng_9", title: "The Proposal", status: "pending", progress: 0 },
    ],
  },
];
      
