# Dream Car Tracker

Personalized next-car deal tracker prototype for Kaluzy.

## What it does now

- Dynamic HTML dashboard powered by `data.json` and `app.js`.
- Tracks preferred vehicles against Kaluzy's requirements:
  - Kia Sportage Hybrid first
  - Tesla Model Y second
  - Kia Sorento Hybrid stretch third
  - Toyota RAV4 Hybrid as APR waitlist
- Computes estimated monthly payment using:
  - estimated out-the-door price
  - trade-in assumption
  - down payment assumption
  - APR
  - loan term
- Scores each car and labels it:
  - Buy Signal
  - Watch Closely
  - Wait
- Includes SaaS product lessons from CarEdge, CarsDirect, Edmunds, CARFAX/manufacturer incentive pages.
- Includes a trade-in value tracker with trusted source links for KBB, J.D. Power/NADA, Black Book, CarMax, and Carvana.
- Keeps valuation API credentials out of the public site; licensed valuation APIs must run in private cron/backend code.

## How to run locally

```bash
cd /Users/kaluzy/.openclaw/workspace/dream-car-tracker
python3 -m http.server 4180
```

Open:

```text
http://127.0.0.1:4180/
```

## Product direction

This can evolve into a SaaS where users enter:

- dream cars / watchlist
- credit score now + target score
- max monthly payment
- APR tolerance
- trade-in vehicle
- insurance baseline
- family needs: kids, legroom, cargo, 2-row/3-row, hybrid/EV
- ZIP / region

Then the system monitors:

- manufacturer APR pages
- CarsDirect-style incentive feeds
- dealer inventory/listing pages
- lease cash and rebates
- trade-in offers
- insurance quote deltas where available

And alerts only when:

- a car matches the user's actual personal buy box
- APR/payment improves meaningfully
- a red-flag dealer fee appears
- an incentive is expiring soon

## Next build ideas

1. Add local history: `snapshots/YYYY-MM-DD.json`.
2. Add diff view: what changed since last check.
3. Add ZIP-specific source URLs.
4. Add quote-request template generator.
5. Add dealership email/SMS outreach workflow, with user approval before sending.
6. Add multi-user profiles if turning into SaaS.
