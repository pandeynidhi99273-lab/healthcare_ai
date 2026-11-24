# CommunityCare AI

Connecting healthcare support, charity and communities.

CommunityCare AI is a web platform that connects people who need healthcare help with verified hospitals, NGOs, charitable centres, donors, volunteers and caregivers. It also has medicine reminders and an AI diet planner.

**Tech stack:** HTML, CSS, JavaScript · Node.js · Express.js · MongoDB (Mongoose) · REST API · JWT login

## Features

| Feature | Where |
|---|---|
| Sign up as a person in need, donor, volunteer, caregiver or organization | `register.html` |
| Admin checks and verifies organizations before they can post needs | `admin.html` |
| Verified organizations post needs (equipment, medicine, nutrition, blood, volunteers) | Dashboard |
| Donors and volunteers browse and filter needs, then offer help | `needs.html` |
| **AI matching** ranks needs for each helper by location, type of help, skills, urgency and deadline, and explains why | `services/matcher.js` |
| AI suggests the best donors and volunteers for an organization's need | Dashboard → "AI suggested helpers" |
| People ask for help, or a caregiver asks **on behalf of** someone without a phone | `request-help.html` |
| Organizations and volunteers take on help requests near them | Dashboard |
| Medicine reminders with browser alerts and a sound, including reminders for someone else | `reminders.html` |
| **AI diet planner**: BMI, calories, macros and a 7-day Indian meal plan adjusted for diabetes, BP, anemia, heart, kidney, pregnancy and age 60+ | `services/dietPlanner.js`, `diet.html` |
| Helplines and government health schemes | `resources.html` |

## How to run

You need **Node.js** (v18+) and **MongoDB** running on your computer.

```powershell
npm install
copy .env.example .env
npm run seed
npm start
```

Then open **http://localhost:3000**.

`npm run seed` fills the database with demo data. **It deletes existing data in the `communitycare` database.**

### Demo accounts (password `demo1234`)

| Role | Email |
|---|---|
| Admin | admin@communitycare.test |
| Hospital (verified) | hospital@communitycare.test |
| NGO (verified) | ngo@communitycare.test |
| Organization (waiting for verification) | pending@communitycare.test |
| Donor | donor@communitycare.test |
| Volunteer | volunteer@communitycare.test |
| Caregiver | caregiver@communitycare.test |
| Person in need | user@communitycare.test |

The login page has one-click buttons for these accounts.

## Project structure

```
server.js              Express app + MongoDB connection
seed.js                Demo data
middleware/auth.js     JWT login + role checks
models/                User, Need, Offer, HelpRequest, Reminder
routes/                REST API (one file per resource)
services/matcher.js    AI matching engine
services/dietPlanner.js AI diet planner
public/                Frontend (HTML, CSS, JS)
```

## REST API

| Method | Endpoint | Who |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Anyone |
| GET/PUT | `/api/auth/me` | Logged in |
| GET | `/api/needs?category=&city=&urgency=&q=` | Anyone |
| GET | `/api/needs/mine` | Organization |
| POST/PUT/DELETE | `/api/needs/:id` | Verified organization (owner) |
| POST | `/api/offers` | Donor / volunteer |
| GET | `/api/offers/mine`, `/api/offers/for-need/:needId` | Helper / organization |
| PATCH | `/api/offers/:id` (accepted / declined / completed) | Organization |
| POST, GET | `/api/help-requests`, `/api/help-requests/mine` | Logged in |
| PATCH | `/api/help-requests/:id/assign`, `/:id/resolve` | Organization / volunteer |
| CRUD | `/api/reminders`, POST `/api/reminders/:id/taken` | Logged in |
| POST | `/api/diet/plan` | Anyone |
| GET | `/api/match/needs`, `/api/match/helpers/:needId`, `/api/match/responders/:requestId` | Logged in |
| GET/PATCH | `/api/admin/organizations`, `/api/admin/organizations/:id/verify` | Admin |
| GET | `/api/resources`, `/api/stats` | Anyone |

## How the AI matching works

Each helper–need pair gets a score out of 100:

- **Location (35):** same city
- **Type of help (30):** the need's category matches the helper's interests, or volunteers for volunteer needs
- **Skills (up to 10):** the helper's skills appear in the need's text
- **Urgency (up to 25):** critical > high > medium > low
- **Deadline (up to 10):** due within 3 or 7 days
- **Little help so far (5):** less than 25% fulfilled

Each match comes with reasons the user can see, like "Close to you in Bengaluru" or "Critical urgency".

The diet planner is a rule-based expert system. It uses the Mifflin-St Jeor formula for calories and a food table tagged by diet type and health condition. It gives general guidance, not medical advice.

## Ideas for next steps

- SMS / WhatsApp reminders for people without smartphones (e.g. Twilio)
- Map view of needs using latitude/longitude
- Hindi and regional-language support
- Uploading registration documents for organization verification
