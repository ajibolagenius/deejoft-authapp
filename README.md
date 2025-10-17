# Deejoft Auth Portal

This project is a small web portal that lets new visitors create an account and returning users sign in. After logging in, people land on a simple dashboard that highlights Deejoft courses and shows quick account details.

## What You Can Do
- Create a new account with name, email, and password.
- Sign in with saved details and stay logged in after refreshing the page.
- Swap between the sign-up and sign-in forms at any time.
- Browse a course list presented as tidy accordions on the protected dashboard.
- Sign out when you are finished to clear the active session.

## Requirements
- Node.js 18 or newer.
- npm (comes bundled with Node.js).

## Set Up Once
```bash
npm install
```

## Start the App
```bash
npm run dev
```
The site will open in your browser at the address shown in the terminal.

## Build for Release
```bash
npm run build
```
The final files will appear in the `dist` folder.

## Project Highlights
- Login information is saved in the browser so refreshes keep you on the dashboard.
- Social buttons are ready for future single sign-on work.
- The layout follows Deejoft branding, including the favicon and hero imagery.

Enjoy exploring the Deejoft portal!***
