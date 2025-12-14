# HandFull

**Track your nutrition the way humans have measured food for thousands of years—with your hands.**

No barcode scanning. No complicated calorie counting. Just simple, sustainable tracking.

[![GitHub Stars](https://img.shields.io/github/stars/simage-ai/handfull?style=social)](https://github.com/simage-ai/handfull)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Why We Made HandFull

At [Simage](https://simage.ai), we're on a mission to build products we actually want to use ourselves. Staying healthy is important to us, but we're tired of expensive meal tracking apps that charge $100+/month to scan barcodes and obsess over exact calorie counts. That level of precision isn't sustainable—and for most people, it's not necessary.

**Our Hypothesis:** If we can track 80% of our food correctly and consistently, we'll get 80% of the results.

We built HandFull on a simple philosophy: measure with your hands, not a food scale. Your palm, your fist, your thumb—these are the only measuring tools you need. This approach is based on the [D1 Training](https://d1training.com) nutrition program, which prioritizes consistency over perfection.

We're so sick of fitness and healthcare tools being behind expensive paywalls, only to find they're overly complicated and require you to change your whole life to use them. So we made this free for everyone. Pay what you want, if you want.

---

## How It Works

| Step | Action | Description |
|------|--------|-------------|
| 1 | **Snap a Photo** | Take a quick picture of your meal for memory and accountability |
| 2 | **Estimate Handfuls** | How many palms of protein? Fists of carbs? Thumbs of fat? |
| 3 | **Log It** | Tap in your portions and track against your daily plan |
| 4 | **Share (Optional)** | Share with your trainer, nutritionist, or accountability partner |

### The Portion Guide

Your hands are the only measuring tools you need:

- **1 Palm** = 1 portion of protein (meat, fish, eggs)
- **1 Fist** = 1 portion of carbs (rice, pasta, potatoes)
- **1 Thumb** = 1 portion of fats (oils, nuts, cheese)
- **1 Fist** = 1 portion of veggies (any vegetables)
- **1 Cupped Hand** = 1 portion of junk/treats (be honest!)

---

## Features

- **Meal Tracking** - Log meals with photo uploads and portion estimates
- **Workout Tracking** - Track exercises across Lower Body, Upper Body, and Cardio
- **Custom Plans** - Create personalized meal and workout plans
- **Progress Dashboard** - Visual radial charts showing daily/weekly progress
- **Share Pages** - Public gallery to share with trainers or friends
- **Dark Mode** - Easy on the eyes
- **Pay What You Want** - Free to use, contribute if you find value

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Database | PostgreSQL with Prisma ORM |
| Auth | Auth.js (NextAuth) with Google OAuth |
| Storage | Google Cloud Storage |
| Payments | Stripe (pay what you want) |
| Deployment | Google Cloud Run |
| CI/CD | GitHub Actions with Workload Identity Federation |

---

## Open Source & Self-Hosting

We believe in full transparency. This entire project is open source, and we encourage you to:

1. **Learn from it** - See how we built a production Next.js app with GCP
2. **Deploy your own** - Full deployment docs included
3. **Contribute** - Found a bug? Have an idea? PRs welcome!
4. **Fork it** - Make it your own

### Deploy It Yourself

We've documented our entire deployment process so you can run your own instance:

```
docs/
├── web-deployment/
│   ├── README.md           # Overview and quick start
│   ├── WIF_SETUP.md        # Workload Identity Federation (keyless auth)
│   └── DOCKERFILE.md       # Container configuration
└── backend/
    └── GCP_POSTGRES_DEPLOYMENT.md  # Cloud SQL setup
```

**Estimated Monthly Cost:** ~$30-55/month on GCP (can scale to zero during low traffic)

### Quick Start for Development

```bash
# Clone the repo
git clone https://github.com/simage-ai/handfull.git
cd handfull/frontend/web

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
pnpm prisma migrate dev

# Start development server
pnpm dev
```

---

## Project Structure

```
handfull/
├── frontend/
│   └── web/                    # Next.js application
│       ├── app/                # App Router (routes, layouts, API)
│       ├── components/         # React components
│       │   ├── ui/            # shadcn/ui primitives
│       │   ├── common/        # Shared components
│       │   └── domain/        # Feature-specific components
│       ├── lib/               # Utilities (auth, db, storage)
│       └── prisma/            # Database schema
├── backend/                    # Docker Compose for local PostgreSQL
├── docs/                       # Deployment documentation
└── PRPs/                       # Product Requirement Plans
```

---

## Contributing

We'd love your help making HandFull better!

- **Found a bug?** [Open an issue](https://github.com/simage-ai/handfull/issues/new)
- **Have an idea?** Start a discussion or submit a PR
- **Like what we're doing?** Give us a star!

If you see something that could be improved—whether it's code, docs, or UX—please tell us. We're building this in the open because we believe transparency makes better software.

---

## Philosophy

We're not trying to build the next unicorn startup. We're just developers who wanted a simple meal tracker and couldn't find one that wasn't trying to extract maximum value from us.

**Our principles:**
- Simple over feature-rich
- Sustainable over perfect
- Free over freemium
- Transparent over closed

If you found any part of this useful—the app, the code, the deployment docs—we'd love to hear about it. And if you have suggestions for how we could do things better, please share!

---

## Credits

**Main Developer:** Chase Yakaboski ([@cyakaboski](https://github.com/cyakaboski))

Built with love at [Simage](https://simage.ai)

---

## License

MIT License - do whatever you want with it.

---

**Cheers!**

*Stop overthinking. Start tracking. Get results.*
