# Using Proximo

- `/` — the desktop: an About window, recent entries, and a sticky note.
- `/blog` — diary list; search titles, filter the current page by tag, and browse older entries. A lock badge marks private entries.
- `/blog/<slug>` — an entry, with likes and views. Public entries are open to everyone; private ones ask for the diary password.
- `/rss.xml` — feed of public entries for readers who want to follow along.
- `/contact` — accessible contact form with validation and delivery feedback.
- `/admin/new-post` — administrator sign-in and publishing form.
- `/secret` — keyboard-accessible archive.

Local reader and administrator passwords are in the ignored `.env.local` file. The previous browser-embedded password is no longer used. Sign-in lasts 24 hours, or until you sign out. Changing `SESSION_SECRET` invalidates existing sessions.

New entries are public unless you tick **Private**. To change an existing entry, open it while signed in as the administrator and use **Make Public** / **Make Private** in its toolbar.

Publishing accepts plain text or safe HTML. Supply a unique URL slug; duplicate slugs are rejected. Failed submissions retain your text. Tags are optional, comma-separated, with up to 20 tags of 40 characters each.

Contact email requires a new Postmark server token and a verified `CONTACT_EMAIL`. The previously committed token must be revoked in Postmark; removing it from current files does not remove it from Git history.

See [README](README.md) for environment setup, data import, tests, and deployment order.
