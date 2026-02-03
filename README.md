<table align="center">
  <tr>
    <td align="center" style="padding-right: 20px;">
      <img src="frontend/public/UI/logo.svg" alt="LiftShift Logo" width="200" height="200" />
    </td>
    <td align="center">
      <a href="https://www.star-history.com/#aree6/LiftShift&type=date&legend=top-left&theme=dark">
        <img src="https://api.star-history.com/svg?repos=aree6/LiftShift&type=date&legend=top-left&theme=dark" alt="Star History Chart" width="500" />
      </a>
    </td>
  </tr>
</table>



## Official Website

https://liftshift.app


## UI Screenshots
<div align="center">
  <img src="./frontend/public/1.avif" alt="UI Screenshot 1" />
</div>

<div align="center">
  <img src="./frontend/public/2.avif" alt="UI Screenshot 2" />
</div>

<div align="center">
  <img src="./frontend/public/3.avif" alt="UI Screenshot 3" />
</div>

<div align="center">
  <img src="./frontend/public/4.avif" alt="UI Screenshot 4" />
</div>

<div align="center">
  <img src="./frontend/public/5.avif" alt="UI Screenshot 5" />
</div>

<div align="center">
  <img src="./frontend/public/6.avif" alt="UI Screenshot 6" />
</div>

<div align="center">
  <img src="./frontend/public/7.avif" alt="UI Screenshot 7" />
</div>

<div align="center">
  <img src="./frontend/public/8.avif" alt="UI Screenshot 8" />
</div>

<div align="center">
  <img src="./frontend/public/9.avif" alt="UI Screenshot 9" />
</div>

<div align="center">
  <img src="./frontend/public/10.avif" alt="UI Screenshot 10" />
</div>


## Official Deployment

LiftShift has one canonical hosted instance:

- **Canonical domain:** https://liftshift.app

Deployments on any other domain are **unofficial**. Unofficial deployments may be modified and may not follow the same security practices. Do not assume an unofficial deployment is trustworthy with any credentials.


## Attribution Requirement

Public deployments must include visible attribution to the upstream project.

Minimum acceptable attribution:

- **Link to official site:** https://liftshift.app
- **Source link:** a publicly accessible link to the Corresponding Source for the exact version running

Attribution must be reasonably discoverable during normal use (for example: footer, About modal, or Settings). Removing, hiding, or obscuring attribution is treated as non-compliance.


---

## Quick Start

<div align="center">
  <img src="./frontend/public/Step1.avif" alt="Export data from Hevy app" width="200" />
  <img src="./frontend/public/Step2.avif" alt="Upload CSV to LiftShift" width="200" />
  <img src="./frontend/public/Step3.avif" alt="Explore analytics dashboard" width="200" />
  <img src="./frontend/public/Step4.avif" alt="Get real-time feedback and filter data" width="200" />
</div>


1. **Select your platform** (Hevy / Strong)  
2. **Hevy**: Choose your **body type** + **weight unit**, then **Continue** to login/sync (email+password or Pro API key), or import CSV. / **Strong**: Choose body type + unit, then import CSV  
3. **Explore** your analytics across Dashboard, Exercises, and History tabs  
4. **Get insights** with real-time feedback and flexible filtering  

 Strong CSV imports support common export variants, including:
 - Semicolon-delimited (`;`) files with quoted fields
 - Unit-suffixed headers like `Weight (kg)` and `Distance (meters)`

---

## Troubleshooting

If you see this error:

> "We detected a Hevy workout CSV, but couldn't parse the workout dates. This usually happens when the Hevy export language isn't English. Please switch Hevy app language to English, export again, and re-upload."

Do the following:

1. Switch your Hevy app language to **English**
2. Export your workout CSV again
3. Re-upload it to LiftShift

<div align="center">
  <img src="./frontend/public/step5.avif" alt="Set Hevy export language to English" width="260" />
</div>

---

## Features

- **Dashboard Analytics** - Volume trends, workout distribution, key metrics
- **Exercise Tracking** - Personal records, 1RM estimates, performance trends
- **Trend Confidence** - Trend insights include confidence and short evidence notes to reduce noisy recommendations
- **History Visualization** - Detailed workout logs with date filtering
- **Set-by-Set Feedback** - Real-time feedback on your performance (including rolling, fatigue-aware expected rep ranges)
- **Session Goal Detection** - Detects whether a session was Strength/Hypertrophy/Endurance/Mixed based on rep-zone distribution
- **Local Storage** - Data saved in your browser
- **Theme Modes** - Day (light), Medium dark, Midnight dark, Pure black, and Texture

## PR Definitions

- **PR**: Best-ever **weight** for an exercise (shown with **absolute** change).
- **Volume PR**: Best-ever **single-set volume** for an exercise (`weight × reps`, across all history; shown with **percent** change).

---

## Local Development

This is intended for local development and contributor workflows. It is not a production deployment guide.

```bash
git clone https://github.com/aree6/LiftShift.git
cd LiftShift
npm install
npm run dev

```

---

## Maintainer

- **GitHub repo**: https://github.com/aree6/LiftShift
- **GitHub profile**: https://github.com/aree6
- **Email**: mohammadar336@gmail.com

---

## Support

If you find this project helpful, you can support it here:

- **Buy Me a Coffee**: https://www.buymeacoffee.com/aree6
- **Ko-fi**: https://ko-fi.com/aree6

---

## Security Notice

- The only official deployment is https://liftshift.app.
- Any other domain is unofficial. Do not enter credentials into an unofficial deployment.
- LiftShift stores sync credentials locally in your browser (auth tokens, API keys, and login inputs). Passwords are encrypted at rest when the browser supports WebCrypto + IndexedDB.
