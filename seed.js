/**
 * Fills the database with demo data.  Run:  npm run seed
 * WARNING: this deletes existing data in the communitycare database.
 *
 * All demo accounts use the password:  demo1234
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Need = require('./models/Need');
const Offer = require('./models/Offer');
const HelpRequest = require('./models/HelpRequest');
const Reminder = require('./models/Reminder');

const PASSWORD = 'demo1234';
const days = n => new Date(Date.now() + n * 86400000);

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/communitycare');
  await Promise.all([User.deleteMany(), Need.deleteMany(), Offer.deleteMany(), HelpRequest.deleteMany(), Reminder.deleteMany()]);

  const make = data => User.create({ password: PASSWORD, ...data });

  await make({ name: 'Platform Admin', email: 'admin@communitycare.test', role: 'admin', city: 'Bengaluru' });

  const hospital = await make({
    name: 'City Care General Hospital', email: 'hospital@communitycare.test', role: 'organization',
    orgType: 'hospital', registrationNumber: 'KA-HOS-2291', city: 'Bengaluru', phone: '080-4000-1234',
    interests: ['medical-equipment', 'blood', 'medicine'], verified: true
  });
  const ngo = await make({
    name: 'Helping Hands Foundation', email: 'ngo@communitycare.test', role: 'organization',
    orgType: 'ngo', registrationNumber: 'MH-NGO-7781', city: 'Mumbai', phone: '022-2600-5566',
    interests: ['nutrition', 'medicine', 'volunteers'], verified: true
  });
  const centre = await make({
    name: 'Annapurna Charitable Centre', email: 'centre@communitycare.test', role: 'organization',
    orgType: 'charitable-centre', registrationNumber: 'KA-CC-1045', city: 'Bengaluru', phone: '080-2300-7788',
    interests: ['nutrition', 'volunteers', 'funds'], verified: true
  });
  await make({
    name: 'Sunrise Elder Care Trust', email: 'pending@communitycare.test', role: 'organization',
    orgType: 'ngo', registrationNumber: 'DL-NGO-3320', city: 'Delhi', phone: '011-4100-2233', verified: false
  });

  const donor = await make({
    name: 'Priya Sharma', email: 'donor@communitycare.test', role: 'donor', city: 'Bengaluru',
    interests: ['medical-equipment', 'nutrition']
  });
  await make({
    name: 'Arjun Mehta', email: 'volunteer@communitycare.test', role: 'volunteer', city: 'Bengaluru',
    interests: ['volunteers', 'blood'], skills: ['driving', 'first aid', 'teaching']
  });
  await make({
    name: 'Sneha Iyer', email: 'volunteer2@communitycare.test', role: 'volunteer', city: 'Mumbai',
    interests: ['volunteers', 'nutrition'], skills: ['cooking', 'counselling']
  });
  const caregiver = await make({ name: 'Meera Nair', email: 'caregiver@communitycare.test', role: 'caregiver', city: 'Bengaluru' });
  await make({ name: 'Ramesh Kumar', email: 'user@communitycare.test', role: 'beneficiary', city: 'Mumbai' });

  const needs = await Need.insertMany([
    { organization: hospital._id, title: '10 wheelchairs for the general ward', description: 'Our general ward is short of wheelchairs for elderly and post-surgery patients. New or gently used wheelchairs are welcome.', category: 'medical-equipment', quantityNeeded: 10, quantityFulfilled: 2, unit: 'wheelchairs', city: 'Bengaluru', urgency: 'high', deadline: days(6), status: 'in-progress' },
    { organization: hospital._id, title: 'O+ and B+ blood donors needed', description: 'Urgent requirement for blood donors for scheduled surgeries this week. Donors must be 18-65 and healthy.', category: 'blood', quantityNeeded: 15, unit: 'donors', city: 'Bengaluru', urgency: 'critical', deadline: days(2) },
    { organization: hospital._id, title: 'Volunteer drivers for patient transport', description: 'Looking for volunteers with a driving licence to bring elderly patients from nearby villages for dialysis appointments.', category: 'volunteers', quantityNeeded: 5, unit: 'volunteers', city: 'Bengaluru', urgency: 'medium', deadline: days(14) },
    { organization: ngo._id, title: 'Monthly nutrition kits for 50 families', description: 'Each kit has rice, dal, oil, and fortified flour for families affected by TB, to support their recovery during treatment.', category: 'nutrition', quantityNeeded: 50, quantityFulfilled: 12, unit: 'kits', city: 'Mumbai', urgency: 'high', deadline: days(10), status: 'in-progress' },
    { organization: ngo._id, title: 'Diabetes medicines for senior citizens', description: 'Support needed to buy Metformin and glucose test strips for 30 low-income senior citizens for 3 months.', category: 'medicine', quantityNeeded: 30, unit: 'patients', city: 'Mumbai', urgency: 'medium' },
    { organization: ngo._id, title: 'Volunteers for a free health camp', description: 'We need volunteers to help with registration, crowd management and counselling at our free health check-up camp.', category: 'volunteers', quantityNeeded: 12, unit: 'volunteers', city: 'Mumbai', urgency: 'low', deadline: days(20) },
    { organization: centre._id, title: 'Cooked meals for patients\' families', description: 'Families waiting outside the government hospital need daily lunch. We need volunteers who can help cook and serve meals.', category: 'volunteers', quantityNeeded: 8, unit: 'volunteers', city: 'Bengaluru', urgency: 'high', deadline: days(3) },
    { organization: centre._id, title: 'Protein supplements for malnourished children', description: 'Doctor-approved protein supplements for 40 underweight children in our nutrition programme.', category: 'nutrition', quantityNeeded: 40, unit: 'packs', city: 'Bengaluru', urgency: 'medium' }
  ]);

  await Offer.create({ need: needs[0]._id, helper: donor._id, type: 'donation', quantity: 2, message: 'I can donate two new wheelchairs next week.', status: 'pending' });

  await HelpRequest.create({
    requestedBy: caregiver._id,
    onBehalfOf: { name: 'Lakshmi Amma', age: 74, phone: '', relation: 'Neighbour' },
    category: 'medicine', city: 'Bengaluru', urgency: 'high',
    description: 'Lakshmi Amma lives alone, has high blood pressure and cannot afford her monthly medicines. She does not have a phone.'
  });

  await Reminder.create({ user: caregiver._id, forPerson: 'Lakshmi Amma', medicine: 'Amlodipine', dosage: '5 mg, 1 tablet', times: ['08:00', '20:00'], withFood: 'after' });

  console.log('Demo data added. Log in with any demo email and password:', PASSWORD);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
