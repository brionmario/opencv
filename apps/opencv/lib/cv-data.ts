// Fictional sample résumé used by the standalone <CV /> component.
// Keep this anonymized — it ships in the bundle and is what the demo renders.
export const cvData = {
  personal: {
    name: "Jordan Avery",
    phone: "+94771234567",
    email: "jordan.avery@example.com",
    website: "www.jordanavery.dev",
    location: "Colombo, Sri Lanka",
    profileImage: "/placeholder-user.jpg",
  },
  summary:
    "With 5+ years of experience in frontend development, I specialize in building performant, scalable web applications using React and TypeScript. I have strong expertise in React principles (components, state, hooks) and TypeScript, and I'm experienced with data-fetching libraries like TanStack Query and SWR. Currently, as a senior engineer, I work on building and maintaining secure frontend features for Identity and Access Management products. I'm passionate about writing maintainable, high-quality code, improving frontend architecture, and collaborating in agile teams to deliver user-focused solutions.",
  experience: [
    {
      title: "Associate Technical Lead (Frontend)",
      company: "Northwind Labs",
      link: "Northwind Labs",
      startDate: "05/2023",
      endDate: "Present",
      location: "Colombo, Sri Lanka",
      description: "Associate Technical Lead @ Northwind Labs, Open-source technology provider.",
      highlights: [
        "Designed and implemented the system architecture of the company design system.",
        "Maintaining the JavaScript based authentication SDKs.",
      ],
    },
    {
      title: "Senior Frontend Engineer",
      company: "Northwind Labs",
      link: "Northwind Labs",
      startDate: "06/2021",
      endDate: "05/2025",
      location: "Colombo, Sri Lanka",
      description: "Senior Frontend Engineer @ Northwind Labs, Open-source technology provider.",
      highlights: [
        "Implemented the key Branding feature of the customer-facing console.",
        "Improved DX by about 80% by creating CLI for component scaffolding.",
        "Introduced NX as a replacement for Lerna to cut down build times by 40%.",
        "Designed a new architecture for the product with micro-frontends to improve the performance of the applications.",
        "Mentored and guided junior developers to ensure growth.",
        "Actively involved in the company hiring process and helped hire more than 20 candidates.",
        "Among the top 5% of high performers for the year 2022.",
      ],
    },
    {
      title: "Frontend Engineer",
      company: "Northwind Labs",
      link: "Northwind Labs",
      startDate: "07/2019",
      endDate: "06/2021",
      location: "Colombo, Sri Lanka",
      description: "Frontend Engineer @ Northwind Labs, Open-source technology provider.",
      highlights: [
        "Implemented Application Management, Consent Management and many more features in the admin portals.",
        "Initiated the frontend integration test suite covering more than 80% of scenarios.",
        "Migrated 2 legacy JSP apps to React.",
        "Developed more than 60% of the features for the self-service user portal.",
        "Involved in flagship analyst demos, by developing frontend apps.",
      ],
    },
    {
      title: "Trainee Associate Software Engineer",
      company: "Vertex Systems",
      link: "Vertex Systems",
      startDate: "07/2017",
      endDate: "07/2018",
      location: "Colombo, Sri Lanka",
      description: "Intern @ Vertex Systems, Digital transformation partner specializing in IoT.",
      highlights: [
        "Built a compile-time plugin system for the Angular portals using Angular DevKit.",
        "Migrated Angular apps to AOT compiler, improving performance by over 75%.",
        "Worked on Java & .NET services of the field-agent platform.",
      ],
    },
  ],
  skills: [
    ["React", "TypeScript", "JavaScript", "CSS"],
    ["SCSS", "Node.js", "Redux", "Next.js"],
    ["Storybook", "Jest", "React Testing Library"],
    ["Cypress", "Git", "CI/CD", "Webpack"],
    ["Tailwind", "Agile", "Accessibility", "UX"],
    ["Responsive Design", "REST APIs", "GraphQL"],
  ],
  education: [
    {
      degree: "B.ENG(Hons) Software Engineering",
      institution: "Riverside Institute of Technology",
      startDate: "09/2015",
      endDate: "07/2019",
    },
  ],
  achievements: [
    {
      title: "Riverside Institute Award",
      description: "Batch all-rounder for the academic year 2018/2019.",
    },
    {
      title: "National Software Quality Awards 2017",
      description: "Awarded a merit prize for the SafeGrid project.",
    },
    {
      title: "International Innovation Awards 2017",
      description: "Won the silver award in the international category for the project SafeGrid.",
    },
  ],
  socialLinks: [
    { platform: "GitHub", url: "https://www.github.com/jordanavery" },
    { platform: "Portfolio", url: "https://www.jordanavery.dev" },
    { platform: "LinkedIn", url: "https://www.linkedin.com/in/jordanavery" },
    { platform: "Medium", url: "https://www.medium.com/@jordanavery" },
  ],
  languages: [
    { name: "English", proficiency: 4 },
  ],
};
