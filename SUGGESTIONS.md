# SoftMatch — Product & Build Notes

This doc captures the direction we landed on, plus ideas worth stealing. It's a
living file — treat it as the running brain of the project.

> **One-line promise:** _Not random strangers. Relevant strangers._

---

## 1. What changed in this pass

- **Rebranded** Aura → **SoftMatch** (repo name, titles, wordmarks, favicon ♥).
- **Re-themed** the whole app from violet to a **warm rose / coral** palette.
  All colors live as `--p50 … --p900` tokens in
  `frontend/src/styles/globals.css` — change those and the entire app
  re-themes. No need to touch individual components.
- **Added "Soft", an AI companion** (`/companion`):
  - A chill, low-pressure chat ("like a friend at 2am, not a form").
  - It **quietly extracts signals** — interests, vibe, mood — from what you
    type and shows them filling up live.
  - One tap on _"use what Soft learned"_ pre-fills your matching profile so
    you skip the boring questionnaire. **This is the "chill onboarding" idea.**
  - Runs **fully offline** (rule-based brain in
    `frontend/src/utils/aiCompanion.js`) so there's zero cost / no API key
    needed to demo. A real LLM is a drop-in upgrade (see §3).

---

## 2. Database — what to use & when

Right now there is **no database**. The backend keeps everything in memory
(`Map`s in `server.js`) and the frontend persists your profile in the browser
(`localStorage` via Zustand). That's perfect for a demo, but everything is lost
on refresh/server-restart and there's no real multi-device or moderation.

### Recommended stack: **PostgreSQL + Prisma** (or Supabase to skip hosting)

Why Postgres over Mongo for *this* app:
- Matching is relational ("users with overlapping interests, compatible hard
  filters, online now"). SQL joins + indexes do this well.
- Trust scores, reports, and bans need transactional integrity.
- `pgvector` extension lets us store **AI embeddings** later for semantic
  matching (§3) — without adding a second database.

**Supabase** is the fastest path: managed Postgres + auth + realtime +
row-level security, generous free tier. Use it and you get login, the DB, and
basic realtime in one move.

### Minimal schema to start

```
users          id, anon_username, email?, password_hash?, trust_score,
               created_at, last_seen
profiles       user_id, intent, vibes[], interests[], sliders(jsonb),
               hard_filters(jsonb), ai_signals(jsonb)
conversations  id, user_a, user_b, started_at, ended_at, quality_rating
messages       id, conversation_id, sender_id, body, created_at      (consider TTL)
reports        id, reporter_id, reported_id, reason, conversation_id, created_at
ai_sessions    id, user_id, transcript(jsonb), extracted_signals(jsonb)
```

**Privacy note (important for an anonymous app):** don't store message history
forever. Either keep messages only for the session, or auto-delete after N days.
Hash anything identifying. This is a feature you can *market*, not just a
compliance chore.

---

## 3. The AI bot — full vision

What ships now is the lightweight version. Here's the roadmap.

**Now (shipped, offline):**
- `extractSignals()` keyword-maps messages → interests / vibes / moods.
- `companionReply()` gives warm, varied, reflective replies + a follow-up Q.

**Next (real LLM):** set `ANTHROPIC_API_KEY` in `backend/.env`. The
`/api/companion` route already proxies to Claude; swap the frontend's
`companionReply()` for `fetchCompanionReply()` and Soft becomes genuinely
conversational. Keep the **system prompt** doing double duty: be warm *and*
emit a small JSON block of detected signals we can parse.

**Later (the real moat — AI matching):**
1. Turn each user's profile + AI transcript into an **embedding vector**.
2. Store it in `pgvector`.
3. Match = nearest-neighbour search in vector space, re-ranked by hard filters
   (smoking, age, relationship goal) and trust score.
4. Feed back **conversation quality ratings** (§4.2) so the model learns which
   matches actually worked. This is how you beat swipe apps over time.

---

## 4. Feature ideas beyond the doc

### 4.1 Already in the doc, worth prioritising
Mood-based matching · Trust score · Temporary identities · Intent-first ·
Conversation quality rating · Anonymous reputation badges · Energy match.

### 4.2 New ideas

1. **Icebreaker handoff.** When two people match, Soft drops *one* opening line
   tailored to what they share ("you both go quiet at 2am and overthink — talk
   about it"). Kills the dreaded empty-chat freeze.

2. **Vibe Check before reveal.** No profiles up front. You chat for ~5 minutes
   *then* the app reveals a tiny bit (shared interests, compatibility %). Earns
   the connection instead of pre-judging. **Big differentiator.**

3. **Conversation streaks / "kept talking" signal.** Don't reward swipes —
   reward conversations that *lasted*. The strongest compatibility signal is
   simply: did they keep talking? Use it to boost future matches.

4. **Mood weather.** A soft ambient indicator of the room's collective mood
   tonight ("lots of late-night thinkers online right now"). Makes the app feel
   alive without exposing anyone.

5. **"Second chance" re-match.** If a great convo ends abruptly (someone closed
   the tab), let either person opt to reconnect later. Anonymous apps lose
   good matches to accidental disconnects constantly.

6. **Consent-gated depth.** Both tap "go deeper" to unlock more personal prompts.
   Pacing intimacy = safety + makes it feel earned.

7. **Time-of-day modes** (from the doc, but make it the *home screen*):
   late-night deep talks, daytime productive/co-founder, weekend chaos.

8. **One-question-a-day.** A daily shared prompt everyone answers anonymously;
   matches you with people whose answer resonated. Low-effort, addictive,
   gives lapsed users a reason to return.

### 4.3 Safety (the doc is right — this is the real challenge)
- AI toxicity/creep detection on messages (the LLM can score in-line).
- Shadow-ban on report threshold; trust score decays with reports.
- Rate-limit new accounts; "warm-up with Soft" doubles as a soft bot filter.
- Never expose online/offline precisely (anti-stalking).

---

## 5. Why "chill, not professional" is the right call

The doc nails it: people are tired of filling out forms. Our edge is that
**onboarding is a conversation, not a questionnaire.** The AI companion *is* the
onboarding. A user can literally just vent for two minutes and we've learned
enough to match them — no sliders required (sliders stay optional for power
users). Keep every screen to *one* decision. That restraint is the brand.

---

## 6. Open questions for you

- **Scope of v1:** ship as friendship/conversation-first (broadest, safest), or
  lean explicitly into dating? The matching engine handles both.
- **Auth:** anonymous-only, or optional accounts (Supabase) to persist identity?
- **AI cost:** keep Soft offline (free) for launch, or budget for real LLM
  replies from day one?
- **Reveal model:** do we want the "chat-first, reveal-later" flow (§4.2 #2) as
  the core loop? I think it's the single most differentiating choice.
