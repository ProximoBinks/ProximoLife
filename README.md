# ProximoLife

A personal blog site built with Astro, Supabase, and Tailwind CSS. Deployed on Netlify.

## Features

- **Blog** — Dynamic blog powered by Supabase with post views, likes, tags, and tag filtering
- **Password-protected posts** — Blog content is gated behind a client-side password prompt
- **Contact form** — Sends emails via Postmark (Nodemailer)
- **Admin panel** — Create new blog posts from `/admin/new-post`
- **macOS-inspired UI** — Homepage styled as a Finder window with draggable icons

## Tech Stack

- [Astro](https://astro.build/) — SSR framework
- [Supabase](https://supabase.com/) — Postgres database (posts, views, likes)
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Nodemailer](https://nodemailer.com/) — Email delivery for the contact form
- [Netlify](https://netlify.com/) — Hosting & serverless functions

## Project Structure

```
src/
├── components/
│   ├── Layout.astro
│   ├── LayoutWithoutTransitions.astro
│   ├── Header.astro
│   ├── Footer.astro
│   ├── Post.astro
│   ├── PasswordInput.astro
│   └── Alert.astro
├── pages/
│   ├── index.astro          # Homepage
│   ├── blog.astro            # Blog listing
│   ├── contact.astro         # Contact form
│   ├── secret.astro          # Secret/archive page
│   ├── admin/
│   │   └── new-post.astro    # Admin: create a post
│   ├── blog/
│   │   └── [slug].astro      # Individual blog post
│   └── api/
│       ├── new-post.ts       # POST — create a post
│       ├── view-post.ts      # POST — increment views
│       ├── like-post.ts      # POST — like a post
│       └── contact.ts        # POST — send contact email
├── utils/
│   └── database.ts           # Supabase client & types
└── styles/
    └── globals.css
```

## Getting Started

### Prerequisites

- Node.js v18+
- A [Supabase](https://supabase.com/) project
- A [Netlify](https://netlify.com/) account (for deployment)

### Install

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```
SUPABASE_DATABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
npm run dev
```

Opens at [localhost:4321](http://localhost:4321).

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Deployment

The site deploys to Netlify via the Supabase extension. Push to your connected branch and Netlify handles the rest.

## License

MIT
