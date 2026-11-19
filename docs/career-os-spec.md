# Portfolio v2 — Professional Portfolio & Career OS Enhancement (scope, as given 2026-11-19)

This is the user's requirements document, kept verbatim as the source of scope. The audit,
decisions and phased plan are in [career-os-roadmap.md](career-os-roadmap.md).

---

I want to evolve my existing Portfolio v2 into a more complete professional portfolio and personal Career Operating System.

**Live website:** https://portfolio-v2-iota-ochre.vercel.app

Before making any changes, thoroughly explore the existing application, understand its architecture, database, authentication, public pages, admin workspace, reusable components, design system and existing functionality.

This is an enhancement to an existing product, NOT a request to rebuild it from scratch.

## 1. Most Important: Confidentiality and Information Security

My portfolio contains both public professional information and private career records.

Some of my professional work involves confidential projects belonging to my employer or clients.

Strict rules:

- Never expose confidential employer or client project names.
- Never mention internal project identifiers, code names, client names or proprietary product names.
- Never publish internal architecture, source code, infrastructure details, tickets, customer information, screenshots, test data or internal documentation.
- Never automatically turn private work logs into public portfolio content.
- Never use confidential project information in AI-generated articles, case studies, resumes, achievements or social media content.
- Never assume that information saved in my private workspace is suitable for public sharing.
- Keep employer-specific information and client-related information private by default.
- Allow me to explicitly mark records as confidential, private or publishable.
- Add an additional confirmation before publishing content derived from professional work.

If I want to showcase transferable experience, help me describe generic engineering skills and responsibilities without identifying the underlying project, employer or client.

This confidentiality requirement takes priority over all other features.

## 2. Public Portfolio Enhancements

### Professional Identity

Introduce an optional professional overview containing:

- Currently working on.
- Current professional focus.
- Technologies and areas of interest.
- What I bring to a team.
- Career interests.
- Professional availability.
- Areas I'm currently exploring.

Everything should be editable from the admin panel.

### Career Timeline

Create a visually appealing professional timeline containing:

- Education.
- Internships.
- Professional experience.
- Major achievements.
- Certifications.
- Important career milestones.

Allow entries to be linked to relevant projects, skills and achievements.

### Project Case Study Improvements

Enhance the existing project case-study system.

Add optional sections for:

- Problem statement.
- Approach and methodology.
- Architecture and engineering decisions.
- Technical challenges.
- Solutions and trade-offs.
- Testing and quality assurance.
- Performance and measurable impact.
- Deployment and infrastructure.
- Limitations.
- Future improvements.
- Lessons learned.

Introduce project impact indicators for measurable results.

Support screenshots, architecture diagrams, performance charts and other visual evidence.

Do not force every section to be completed. Different projects should support different documentation styles.

### Professional Credibility

Add dedicated sections for:

- Certifications with verification links.
- Awards and achievements.
- Testimonials and recommendations.
- Open-source contributions.
- Technical presentations.
- Speaking engagements.
- Publications and technical writing.

All sections should support draft, published and archived states.

### Recruiter Mode

Introduce a dedicated recruiter-friendly view.

It should provide:

- Short professional introduction.
- Current professional experience.
- Core technical skills.
- Featured projects.
- Major achievements.
- Education and certifications.
- Resume download.
- Contact information.
- GitHub and LinkedIn links.

The goal is to help a recruiter understand my professional profile within approximately 30 seconds.

Keep the interface clean and focused.

### Resume Improvements

Enhance the existing resume builder with:

- Role-specific resume versions.
- Backend Developer, Software Engineer, AI Engineer and other customizable profiles.
- Achievement-based bullet suggestions.
- Project and experience linking.
- Job-description-based resume tailoring.
- PDF export through Print.
- LaTeX export for Overleaf.
- Resume version history.

Never automatically include confidential professional information.

## 3. Private Career Workspace

### Career Activity Timeline

Create a unified timeline combining:

- Work logs.
- Learning activities.
- Project milestones.
- Technical problems solved.
- Skills practised.
- Articles published.
- Achievements.
- Certifications.

Allow activities to be associated with projects, skills, career goals and experience records.

Avoid requiring duplicate data entry.

### Achievement Builder

Introduce a feature that converts rough notes and work logs into structured professional achievements.

Example workflow:

Raw note → Structured accomplishment → Resume-ready bullet.

Allow me to:

- Review and edit generated content.
- Add measurable impact.
- Associate relevant skills.
- Link achievements to projects.
- Save multiple versions.
- Mark achievements as resume-worthy.

AI-generated content must always be reviewed before being saved or published.

Confidentiality checks must apply before generating achievements from professional records.

### Skills Intelligence

Expand the existing skills management system.

For every skill, optionally track:

- Self-assessed proficiency.
- Last used date.
- Projects where it was used.
- Practical experience.
- Confidence level.
- Evidence of proficiency.
- Learning resources.
- Related skills.
- Want-to-learn status.

Provide a historical view of skill development.

Do not treat self-assessed proficiency as objectively verified expertise.

### Learning Management

Extend Resources into a flexible learning management system.

Features:

- Custom learning paths.
- Topics and subtopics.
- Learning progress.
- Notes associated with topics.
- Practical exercises.
- Implementation links.
- Saved questions.
- Resources to revisit.
- Learning history.

Allow learning paths such as Backend Engineering, System Design, AI/ML and Agentic AI.

Avoid rigid course-completion requirements.

### Career Planning

Enhance the existing Career section with:

- Short-term and long-term goals.
- Target positions.
- Target companies.
- Required skills for target positions.
- Career milestones.
- Interview preparation.
- Personal development plans.
- Salary progression (private).
- Monthly career reflections.

Introduce an optional career readiness analysis that compares my current skills and experience against a job description and identifies potential gaps.

## 4. AI-Powered Career Assistant

Expand the existing optional AI functionality into specialised assistants.

### Career Assistant
Answer questions using my private career records.

### Project Documentation Assistant
Help structure project documentation, technical explanations and engineering decisions.

### Achievement Extractor
Identify potential professional achievements from saved logs.

### Skill Gap Analyser
Compare my existing skills against job descriptions.

### Interview Coach
Generate technical and behavioural interview questions based on my documented experience.

### Learning Assistant
Organise technical notes, explain concepts and recommend related resources.

### Weekly Career Analyst
Summarise progress, identify unfinished activities and highlight potential achievements.

### Professional Writing Assistant
Help improve technical articles, documentation and professional communication.

### Ask My Professional History

Provide a conversational interface where I can ask questions such as:

- What technical skills have I practised recently?
- Which projects demonstrate my backend development experience?
- What have I learned about system design?
- What achievements could be added to my resume?
- Which skills have I not used recently?
- What career goals have I been neglecting?

Use actual saved records as evidence. Provide references to the relevant records whenever possible.

Clearly distinguish documented information from AI-generated suggestions.

Never use confidential project information in public-facing outputs.

AI must remain optional, with API key configuration, usage limits and cost awareness.

## 5. Analytics and Insights

### Private Analytics

Introduce optional analytics for:

- Weekly activity.
- Learning progress.
- Projects progressed.
- Projects completed or abandoned.
- Skills practised.
- Achievements documented.
- Goals completed.
- Job application progress.
- Career activity distribution.

### Public Portfolio Analytics

Expand the existing visit counter with:

- Most visited projects.
- Most popular articles.
- Resume download counts.
- Contact button interactions.
- Referral sources.
- Device categories.
- Project card sharing activity.

Respect visitor privacy. Avoid invasive tracking and unnecessary personal data collection.

## 6. Knowledge Management

Improve the connection between all the information stored in the application.

Add:

- Global backlinks between records.
- Related notes and resources.
- Related projects and technologies.
- Global search across private content.
- Reusable tags.
- Bookmarks and favourites.
- Universal attachments.
- Content version history.
- Archive and recovery.
- Full workspace export in JSON and Markdown.

### Knowledge Graph

Introduce an optional interactive knowledge graph showing connections between:

- Projects.
- Technologies.
- Skills.
- Learning resources.
- Articles.
- Logs.
- Achievements.
- Career goals.

Allow nodes to open their respective records.

Keep this feature optional rather than making it a mandatory navigation experience.

## 7. Developer-Focused Features

Introduce optional technical documentation features.

- Technical decision records (ADRs).
- System design case studies.
- Interactive architecture diagrams.
- API documentation for selected public projects.
- Reusable code snippets.
- Engineering changelog.
- Testing reports.
- Deployment architecture documentation.
- Model cards for public AI/ML projects.

For AI/ML projects, support:

- Dataset information.
- Model details.
- Evaluation metrics.
- Limitations.
- Deployment information.

All technical content must be explicitly reviewed before publication.

Never expose proprietary architecture, internal APIs, code or infrastructure.

## 8. Usability Improvements

The system must remain easy and enjoyable to use.

Consider adding:

- Global command palette actions.
- Keyboard shortcut reference.
- Recently viewed records.
- Autosave.
- Duplicate project and article actions.
- Reusable templates.
- Bulk editing.
- Bulk archiving.
- Drag-and-drop ordering.
- Calendar view.
- Markdown import and export.
- Mobile quick capture.
- Optional reminders.
- Customisable dashboard widgets.
- PWA support.
- Offline access to selected private notes.

## 9. Important Product and Design Principles

I do not want this application to become an overly complicated productivity system.

Follow these principles:

1. Everything should be optional.
2. Quick capture should remain extremely easy.
3. Avoid unnecessary mandatory fields.
4. Prefer progressive disclosure over showing everything at once.
5. Keep the existing design language consistent.
6. Preserve dark and light themes.
7. Maintain responsiveness down to 320px.
8. Avoid unnecessary navigation items.
9. Reuse existing components and data structures wherever practical.
10. Avoid duplicating functionality that already exists.
11. Make the admin workspace intuitive.
12. Preserve existing functionality and data.
13. AI should assist rather than control the workflow.
14. Keep public and private information strictly separated.

## 10. Implementation Strategy

Do not attempt to implement every feature simultaneously.

First:

- Audit the current application.
- Identify existing functionality that already satisfies these requirements.
- Identify missing functionality.
- Identify overlapping features.
- Review database changes and migration requirements.
- Identify security and access-control implications.

Then create an implementation roadmap with sensible priorities.

Suggested phases:

**Phase 1 — Professional Portfolio**
- Recruiter mode.
- Enhanced project case studies.
- Achievements and certifications.
- Testimonials.
- Improved resume builder.

**Phase 2 — Career Intelligence**
- Achievement builder.
- Career activity timeline.
- Skills intelligence.
- Learning management.
- Career planning.

**Phase 3 — Knowledge Management**
- Global backlinks.
- Related records.
- Knowledge graph.
- Technical decision records.
- Universal attachments.

**Phase 4 — AI and Analytics**
- Career assistant.
- Interview coach.
- Skill gap analyser.
- Weekly career insights.
- Portfolio analytics.

**Phase 5 — Quality of Life**
- Mobile quick capture.
- PWA support.
- Offline access.
- Bulk actions.
- Customisable dashboard.

For each phase:

- Explain the intended changes.
- Identify affected components and database models.
- Implement incrementally.
- Add appropriate validation and access controls.
- Test existing functionality for regressions.
- Verify mobile responsiveness.
- Verify public/private separation.
- Update documentation where necessary.

Do not unnecessarily change existing technologies, architecture or deployment configuration.

Do not remove existing features simply to accommodate new ones.

## Final Objective

I want Portfolio v2 to evolve into a system that serves two purposes equally well:

**Publicly:** A polished, technically credible professional portfolio that helps recruiters and engineering teams understand my capabilities.

**Privately:** A flexible career workspace where I can capture my work, organise knowledge, develop skills, track achievements, manage opportunities and continuously improve my professional profile.

The most important outcome is that the system should become more useful as I progress in my career, without becoming difficult to maintain.

Prioritise usefulness, flexibility, privacy and long-term maintainability over feature quantity.
