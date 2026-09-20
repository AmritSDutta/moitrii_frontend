# Software Requirements Specification (SRS) - Moitrii
## Affordable Personal AI Agent Platform : Moitrii

**Status:** Draft — Hackathon MVP

---

## 1. PMoitrii roduct Vision

Build an affordable AI platform where every woman gets her own persistent personal AI agent.

The agent:

- Understands the user's selected interests and preferences.
- Accepts requests at any time.
- Maintains persistent state.
- Periodically wakes up according to the user's subscription.
- Researches and fulfils pending requests.
- Reuses existing knowledge/content whenever possible.
- Creates new content when required.
- Delivers the result to the user.
- Goes back to sleep.

### Moitrii Core Principle

> **All users get the same agent capabilities. Subscription price only determines agent execution periodicity.**

The product is intended to make personalized AI affordable. Lower-cost plans do **not** provide a less capable agent; they provide less frequent agent execution.

---

# 2. Target Users

## 2.1 Primary Users — Women Consumers

Users can subscribe to topics relevant to their interests:

1. Health
2. Cooking
3. Beauty / Makeup
4. Yoga / Fitness
5. Wellness
6. Kids & Education
7. Home
8. Travel
9. Other lifestyle interests

## 2.2 Parent / Child-Culture Topics

Additional topics help parents understand the interests and culture of growing children:

10. Gen-Z trends
11. Anime
12. Comics

These are initial categories and should not be treated as hard-coded product boundaries.

---

# 3. User Types

## 3.1 Consumer

A consumer can:

- Create a personal profile.
- Select topic subscriptions.
- Submit requests to their personal agent.
- View agent status.
- View generated and recommended content.
- Receive email notifications.
- Access publicly published content.

## 3.2 Publisher

A publisher can additionally:

- Create content.
- Publish content.
- Make published content available to the shared knowledge ecosystem.

---

# 4. Personal Agent

Every registered consumer receives exactly one logical personal agent.

## 4.1 Agent States

```text
ACTIVE
SLEEPING
WORKING
WAITING
ERROR
```

## 4.2 Persistent Agent State

The agent maintains:

- User profile
- Topic preferences
- Pending requests
- Completed requests
- Agent execution history
- Generated content references
- Previously used content
- Last wake time
- Next wake time

---

# 5. Request Lifecycle

Users can submit requests at any time, regardless of whether their agent is awake.

```text
User
 │
 ├── Request
 │
 ▼
PENDING
 │
 │ Agent sleeping
 │
 ▼
Agent wakes
 │
 ▼
Evaluate requests
 │
 ├── Existing suitable content
 │          ↓
 │       REUSE
 │
 └── No suitable content
            ↓
         RESEARCH
            ↓
         GENERATE
            ↓
         PUBLISH
 │
 ▼
DELIVER
 │
 ▼
Persist state
 │
 ▼
SLEEP
```

Requests remain persisted while the agent is sleeping.

---

# 6. Content Reuse

Before generating new content, the agent must determine whether an existing published resource sufficiently satisfies the request.

```text
Request
   ↓
Content discovery
   ↓
Relevant existing content?
   ├── YES → Reference existing page
   │
   └── NO  → Create new content
```

This prevents every user's agent from independently generating the same information.

The resulting public content library becomes a **shared knowledge ecosystem**.

---

# 7. Content Generation Pipeline

When new content is required:

```text
Request
 ↓
Research
 ↓
Source extraction
 ↓
Content synthesis
 ↓
YouTube discovery
 ↓
Image generation
 ↓
Page generation
 ↓
Validation
 ↓
Publish
 ↓
Email user
```

## 7.1 External Services

| Requirement | Technology |
|---|---|
| Agent reasoning / generation | OpenAI |
| Web research | Firecrawl |
| Video discovery | YouTube |
| Image generation | OpenAI image generation |
| Email delivery | AgentMail |
| Application state | Convex |
| Agent implementation | Python |

---

# 8. Agent Economics

The platform does not reduce AI capabilities for cheaper users.

Instead, subscription plans differ only in agent execution periodicity.

```text
                 SAME CAPABILITIES
                       │
           ┌───────────┼───────────┐
           ↓           ↓           ↓
        Low cost    Mid tier    Higher tier
           │           │           │
       Infrequent   More often     Daily
        wakeups       wakeups      wakeups
```

The subscription controls:

- Wake frequency
- Freshness
- Agent execution opportunity

It does **not** control:

- Intelligence
- Research capability
- Content-generation capability
- Available tools

This is the fundamental pricing philosophy.

---

# 9. Sleeping Agent Model

Example:

```text
Monday
  User submits 3 requests
       ↓
  Agent sleeping
       ↓
Thursday
  Agent wakes
       ↓
  Processes all eligible requests
       ↓
  Persists results
       ↓
  Sends notifications
       ↓
  Sleeps
```

The user does not need to know whether the agent is currently running.

Their requests remain in the durable queue until an eligible execution window.

---

# 10. Overall System Architecture

```text
React / Next.js
      │
      ▼
   Convex Cloud
   ├── Database
   ├── Realtime
   ├── Mutations / Queries
   ├── Scheduler
   └── Scheduled Functions
          │
          │ HTTP
          ▼
   Python Agent
   Cloud Run
          │
          ├── OpenAI
          ├── Firecrawl
          ├── YouTube
          └── AgentMail
```

### Architecture Principle

The frontend and backend are designed as two separate application surfaces around a common domain model.

- **Frontend:** user interaction, subscriptions, requests, agent status, content discovery and delivery experience.
- **Backend:** durable state, scheduling, agent execution, research, generation, publishing and notification.
- **Common design:** shared concepts, identifiers, request states, agent states, content states, and API contracts.

---

# 11. UI Specification

## 11.1 Technology

**React / Next.js**

The UI should provide a simple consumer-oriented experience rather than expose AI infrastructure concepts.

## 11.2 Primary Screens

### A. Login / Registration

- Sign up
- Login
- Basic account setup

### B. Interest Selection

First-time users select their topics.

Example:

```text
What would you like your agent to follow?

☐ Health
☐ Cooking
☐ Beauty / Makeup
☐ Yoga / Fitness
☐ Kids & Education
☐ Home
☐ Travel
☐ Gen-Z
☐ Anime
☐ Comics
```

Selections are persisted in the user's profile.

### C. Agent Home

The main dashboard should show:

- Agent status
- Next wake-up
- Pending requests
- Recently completed requests
- Recently generated content
- Relevant published content

Example:

```text
Your Agent

Status: Sleeping
Next wake-up: Tomorrow 08:00

Pending requests: 3

Recently completed
------------------
Healthy breakfast ideas
Travel plan for Darjeeling
Understanding Anime
```

### D. Request Creation

Users can submit natural-language requests.

Example:

> "Find some healthy homemade drinks my children will like."

The request is stored immediately even when the agent is sleeping.

### E. Request History

Show:

- Request
- Status
- Submitted time
- Processing time
- Result
- Delivery status

### F. Content Page

Generated or reused content should provide:

- Main content
- Sources
- Relevant YouTube video
- Generated image
- Related content
- Public URL

### G. Publisher UI

Publisher users can:

- Create content
- Preview content
- Publish content
- View published content

---

# 12. Backend Specification

## 12.1 Convex Responsibilities

Convex is responsible for:

- Database
- User/application state
- Request queue
- Agent state
- Scheduling metadata
- Realtime frontend state
- Mutations
- Queries
- Scheduled functions

Convex scheduled functions provide the wake-up boundary for the Python agent.

## 12.2 Python Agent Responsibilities

Python owns the agent intelligence and execution workflow:

- Load agent/user state.
- Retrieve eligible pending requests.
- Determine whether existing content satisfies the request.
- Perform research.
- Interact with OpenAI.
- Discover relevant YouTube videos.
- Generate visual assets.
- Generate content.
- Publish content.
- Send email notifications.
- Persist execution results and state.

## 12.3 Python Runtime

The Python agent runs as a service on **Google Cloud Run**.

The Convex scheduled execution invokes the Python agent through HTTP.

---

# 13. Common Domain Design

Both UI and backend must use the same core domain concepts.

```text
User
 ├── Profile
 ├── Subscription
 ├── Agent
 │    ├── State
 │    ├── Schedule
 │    └── ExecutionHistory
 │
 └── Requests
      ├── PENDING
      ├── PROCESSING
      ├── COMPLETED
      └── FAILED

Content
 ├── Author
 ├── Sources
 ├── Topic
 ├── ContentType
 ├── PublicURL
 └── Semantic metadata
```

### Common identifiers

Every major entity should have a stable identifier:

- `userId`
- `agentId`
- `requestId`
- `contentId`
- `executionId`

The UI must never infer backend state; it should render the persisted state returned by the backend.

---

# 14. Agent Execution Contract

The interaction between Convex and Python should be treated as an explicit contract.

```text
Convex
  │
  │ HTTP request
  │ agentId / execution context
  ▼
Python Agent
  │
  ├── Load state
  ├── Process eligible requests
  ├── Research / generate / reuse
  ├── Publish / notify
  └── Persist results
  │
  ▼
Convex
```

The execution should be idempotent so that retries do not unnecessarily create duplicate content or duplicate notifications.

---

# 15. Core Data Model

Conceptually:

```text
User
 ├── Profile
 ├── Subscription
 ├── Agent
 │    ├── State
 │    ├── Schedule
 │    └── ExecutionHistory
 │
 └── Requests
      ├── PENDING
      ├── PROCESSING
      ├── COMPLETED
      └── FAILED

Content
 ├── Author
 ├── Sources
 ├── Topic
 ├── ContentType
 ├── PublicURL
 └── Semantic metadata
```

---

# 16. MVP Requirements

The hackathon MVP should demonstrate one complete end-to-end loop:

```text
Login
 ↓
Select interests
 ↓
Create request
 ↓
Request persisted
 ↓
Agent wakes
 ↓
Search existing content
 ↓
If unavailable → research
 ↓
Generate webpage
 ↓
Find relevant YouTube video
 ↓
Generate image
 ↓
Publish
 ↓
Email link
 ↓
Persist execution state
```

Then demonstrate the shared knowledge model:

```text
User A
  ↓
Request
  ↓
No matching content
  ↓
Agent creates and publishes content
              │
              ▼
       Public Content Library
              │
              ▼
User B
  ↓
Similar request
  ↓
Existing content found
  ↓
Reference existing page
```

This demonstrates that the system does not repeatedly spend AI resources generating the same information.

---

# 17. Non-Functional Requirements

## Reliability

- Requests must survive agent sleep.
- Agent execution must tolerate retries.
- Agent state must be persisted.
- Processing should be idempotent.

## Scalability

The system should support many sleeping agents without maintaining an always-running process per user.

## Cost Efficiency

The architecture should minimize unnecessary model calls and duplicated research.

Content reuse is therefore both a product capability and a cost-control mechanism.

## Observability

Track:

- Agent executions
- Execution duration
- Request status
- External API failures
- Content generation failures
- Email delivery status
- Agent wake/sleep events

---

# 18. Product Thesis

> **Personal AI shouldn't be a luxury. Everyone should be able to have an agent; the user's budget determines how often the agent works for them.**

The product is not primarily an AI content generator.

It is an **affordable persistent personal-agent platform**, where periodic execution makes personalized AI economically accessible while keeping the agent's capabilities consistent across plans.



UI pages:
1. Public landing page
---------------------------------------------
MOITRII
────────────────────────────────────────────
Health  Food  Beauty  Wellness  Kids  Home  Travel

        [ Large editorial hero image ]

        Healthy living, beautiful homes,
        family, wellness & everyday life

        Explore what's relevant to you →

────────────────────────────────────────────

What's Hot
[ Large card ] [ Card ] [ Card ]

Popular Categories
[ Health ] [ Cooking ] [ Beauty ] [ Yoga ]
[ Kids ]   [ Home ]    [ Travel ]

Latest Stories
[ Article ] [ Article ] [ Article ]

Trending Videos
[ Video ] [ Video ] [ Video ]

────────────────────────────────────────────
              About Moitrii


2.After login — Agent-centric

Once the user signs in, the experience changes:

Moitrii
────────────────────────────────────
My Agent     Explore     My Content

Good morning, Priya

Your agent is sleeping.
Next wake-up: Tomorrow 08:00

┌──────────────────────────────────┐
│ What would you like your agent   │
│ to work on?                  →   │
└──────────────────────────────────┘

Your Interests
Health · Cooking · Kids · Travel

Your Agent's Work
────────────────────────────────────
✦ Healthy homemade drinks
  Ready to read →

✦ Weekend trip ideas
  Researching next wake-up


UI theme:
1. **Overall theme:** Modern, warm, editorial lifestyle — not a typical AI/SaaS interface.

2. **Primary background:** Warm off-white/cream rather than pure white.

3. **Primary text:** Deep charcoal/near-black for strong readability.

4. **Accent colors:** Muted, natural tones such as **sage green, beige, terracotta and dusty rose**.

5. **Avoid dominant pink:** Feminine but not stereotypically pink or overly decorative.

6. **Photography:** Warm, natural lifestyle photography should be a major visual element.

7. **Mood:** Calm, welcoming, trustworthy, elegant and approachable.

8. **Contrast:** Use strong dark text against light backgrounds; accents should remain muted rather than bright.

9. **Visual consistency:** Keep the same restrained palette across categories rather than giving every section a completely different color scheme.

10. **Moitrii design principle:** **“Modern Indian women's lifestyle + calm technology”** — editorial and human on the public site, with AI kept visually subtle.
