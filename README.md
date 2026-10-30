# poc-cleanyourtv

A small, **read-only plan simulator** for [CleanYourTV](https://github.com/Gathin23/cleanyourtv) (MIT).

It reads CleanYourTV's own debloat-list format (one package id per line) and shows what
would happen to each line **before anything touches a TV**. Nothing is uninstalled, no
device is contacted, and no ADB command is sent.

## Why

CleanYourTV debloats an Android or Google TV over ADB on Wi-Fi, without root. Its value is
the judgement behind each line — what is safe to disable, what must be kept, and what has
to wait. This POC makes that judgement visible.

Two protections are modelled:

- **the stock launcher** is only disabled after another launcher can answer HOME;
- **the setup wizard** is protected while it can answer HOME.

## Run locally

```
node server.js
```

Then open <http://localhost:4317>.

## API

| Route | What it returns |
| --- | --- |
| `GET /api/lists` | the sample list names |
| `GET /api/plan?list=<name>` | the per-line plan for that list |
| `POST /api/custom` | the per-line plan for a list you post as the body |
| `GET /api/packages` | the package table used by the simulator |

Sample: `GET /api/plan?list=sample-mi-tv-4a` returns **5 disabled of 5**, including the
stock launcher, whose reason reads *"stock home, only after the new launcher is Home"*.

## Status and limits

- **This is a simulator.** It does not connect to a TV, does not run ADB, and does not
  disable anything. It is a demonstration of the decision logic, not the tool.
- The package table is a small illustrative sample, not CleanYourTV's full catalogue.
- CleanYourTV itself is at <https://github.com/Gathin23/cleanyourtv> and is MIT licensed.
  This repository contains no CleanYourTV code.

## Licence

MIT.
