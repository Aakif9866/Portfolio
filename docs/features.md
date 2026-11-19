# Features

Everything the site does today, in plain language. The [README](../README.md) has the technical
detail (tables, routes, how each part works).

## Public site (what visitors see)

**Home (`/`)**
- An introduction with an animated diagram of how a request travels through the site
- Featured projects (up to four, chosen in the admin)
- Technologies grouped by category
- **On GitHub**: your public repo count, followers and most recently pushed repositories, read live
  from GitHub's public API (refreshed hourly, hidden if GitHub can't be reached)
- Recent experiments and a contact section

**Projects (`/projects`, `/projects/<name>`)**
- All projects, filterable by technology
- Each project has a full case-study page: the one-line summary, repository and live-demo
  buttons, facts (role, team, dates, type), the tech stack (each linked to the Tech Stack page),
  up to 17 kinds of write-up section, architecture diagrams (an image, an interactive diagram,
  or both), milestones, and an "On this page" list
- **Shareable project card**: each published project gets an image card (`/projects/<name>/card`)
  with its name, summary, status, role and years, tech stack and links (case study, code, live
  demo). It shows at the end of the case study with **Download card**, links to the stack, and
  share buttons (X, LinkedIn, Reddit, WhatsApp, copy link). It is also the preview picture when
  the project's link is posted on social media or in chat apps.

**Tech Stack (`/system`)**: every technology, grouped, each linked to the projects that use it.

**Experiments (`/lab`)**: what you tried, the hypothesis and the outcome; failed and abandoned
ones stay visible.

**Writing (`/articles`)**: the blog, built as the written companion to your YouTube channel
- A video per post, played in YouTube's privacy-enhanced player; a YouTube link on its own line
  inside a post becomes another player
- Tags, with a page per tag and a tag filter; related posts by shared tags
- Cover images, reading time, a reading-progress bar, an "On this page" list, linkable headings
- Code blocks with a copy button, callout boxes (`> [!NOTE]`), image captions
- Share buttons and previous/next links
- A social preview picture per post (the cover, else the video thumbnail, else a generated card)
- RSS feed (`/feed.xml`), plus a sitemap and robots file so search engines find every post

**Experience (`/experience`)**: work and education, newest first.

**About (`/about`)**: about text, contact details and your GitHub repositories.

**Recruiter view (`/recruiter`)**: your profile on one screen for a 30-second read: intro, current role,
experience, core skills, three featured projects, education and contact links. **Download PDF** prints it
as a one-page resume. Not in the menu; linked from About.

**Everywhere**
- Search palette (⌘K / Ctrl K, or the search button) to jump to any page, project, experiment,
  article or technology
- Light and dark themes, a phone menu, layouts that work down to 320px wide
- Fast: pages are pre-built and refreshed every 5 minutes, so a click loads in well under a second
- A visit counter (shown only in the admin)

## Admin (`/admin`, only you, after signing in)

**Private workspace** (never shown publicly)
- **Inbox** with quick capture on every admin page (⌘J): paste a link (its title and image are
  fetched) or type a note; `log:` `idea:` `goal:` `job:` set the kind, `#tags` are picked up.
  Search, filters, pinning, export as JSON or Markdown
- **Resources**: saved links grouped by source, a learning queue, one-click status
- **Logs**: a weekly timeline, filterable by tag
- **Ideas**: a Someday → Next → Active → Dropped board; *Start project* creates a draft project
- **Jobs**: a Saved → Applied → Interviewing → Offer board, job details, follow-up dates (shown
  when due), notes and status history
- **Career**: a private profile (salary, target roles, plans), goals with deadlines and tickable
  milestones
- **Skills**: private skill levels and "want to learn" flags next to your public tech list
- **Resume**: a master resume drafted from your projects and experience, versions per role or
  job, a live preview, PDF (through Print) and `.tex` for Overleaf
- **AI help** (optional, needs an API key): summarise a link, structure a rough log, improve
  writing, draft follow-up emails, tailor a resume to a job. You preview every suggestion first;
  usage has a monthly cap
- **Weekly recap** of what you logged, saved and finished

**Site content**
- **Dashboard** (`/admin/site`): counts of published, draft and archived content, a "needs
  attention" list, recent changes, total page views
- **Projects**: a workspace per project with tabs for Overview, Case study, Technologies,
  Architecture, Milestones and Publishing (status controls, a checklist, **Preview**, **View
  live** and **Share card**)
- **Articles**: title, summary, body, video link, tags, cover image; every save keeps the previous
  version, and any version can be restored
- **Experiments**, **Experience**, **Technologies**, case-study **sections**, **diagrams** and
  **milestones**
- **Media**: upload images and files, copy their links, delete them
- **Settings**: the About text, contact email, GitHub and LinkedIn links the public pages use

**How editing works**
- Draft → Published → Archived; only published content is public, and drafts can be previewed
- One Markdown editor everywhere: write, preview or both side by side, a toolbar, shortcuts, and
  images pasted or dropped straight in
- Forms check links, dates and required fields, and warn about unsaved changes
