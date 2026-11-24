/**
 * AI diet planner (rule-based expert system).
 *
 * 1. Works out BMI and daily calorie needs (Mifflin-St Jeor formula).
 * 2. Adjusts calories and macros for the goal and health conditions.
 * 3. Builds a 7-day Indian meal plan, picking foods that suit the person's
 *    diet type and conditions, and avoiding foods that don't.
 *
 * This is general guidance only, not medical advice.
 */

// type: vegan | veg (has dairy) | egg | nonveg
// good / avoid: health conditions this food helps or should be avoided for
const FOODS = {
  breakfast: [
    { name: 'Vegetable oats upma', kcal: 300, type: 'vegan', good: ['diabetes', 'heart', 'hypertension'] },
    { name: 'Moong dal chilla with mint chutney', kcal: 280, type: 'vegan', good: ['diabetes', 'anemia'] },
    { name: 'Ragi dosa with sambar', kcal: 320, type: 'vegan', good: ['diabetes', 'anemia', 'pregnancy'] },
    { name: 'Poha with peanuts and vegetables', kcal: 320, type: 'vegan', good: ['anemia'] },
    { name: 'Idli (3) with sambar', kcal: 300, type: 'vegan', good: ['heart', 'elderly', 'kidney'] },
    { name: 'Vegetable daliya (broken wheat)', kcal: 290, type: 'vegan', good: ['diabetes', 'heart', 'elderly'] },
    { name: 'Besan chilla with curd', kcal: 300, type: 'veg', good: ['diabetes'] },
    { name: 'Paneer-stuffed multigrain paratha with curd', kcal: 420, type: 'veg', good: ['pregnancy'], avoid: ['heart', 'kidney'] },
    { name: 'Boiled eggs (2), whole-wheat toast and fruit', kcal: 350, type: 'egg', good: ['pregnancy', 'anemia'] },
    { name: 'Vegetable masala omelette with multigrain roti', kcal: 360, type: 'egg', good: ['diabetes'] }
  ],
  midMorning: [
    { name: 'Guava or apple', kcal: 90, type: 'vegan', good: ['diabetes', 'heart'] },
    { name: 'Roasted makhana (unsalted)', kcal: 110, type: 'vegan', good: ['hypertension', 'heart', 'diabetes'] },
    { name: 'Sprouts salad with lemon', kcal: 150, type: 'vegan', good: ['anemia', 'diabetes', 'pregnancy'], avoid: ['kidney'] },
    { name: 'Coconut water', kcal: 45, type: 'vegan', good: ['hypertension'], avoid: ['kidney'] },
    { name: 'Banana', kcal: 105, type: 'vegan', good: ['elderly'], avoid: ['diabetes', 'kidney'] },
    { name: 'Dates (3) with a few peanuts', kcal: 200, type: 'vegan', good: ['anemia', 'pregnancy'], avoid: ['diabetes'] },
    { name: 'Boiled egg', kcal: 78, type: 'egg', good: ['pregnancy'] }
  ],
  lunch: [
    { name: 'Brown rice, dal, mixed vegetable sabzi, salad', kcal: 520, type: 'vegan', good: ['heart', 'diabetes'] },
    { name: '2 multigrain roti, rajma, cucumber raita, salad', kcal: 550, type: 'veg', good: ['anemia', 'pregnancy'], avoid: ['kidney'] },
    { name: '2 roti, palak dal, bhindi sabzi, curd', kcal: 520, type: 'veg', good: ['anemia', 'pregnancy'], avoid: ['kidney'] },
    { name: 'Millet (jowar/bajra) roti, lauki chana dal, salad', kcal: 480, type: 'vegan', good: ['diabetes', 'heart', 'hypertension'] },
    { name: 'Rice, lauki/tinda sabzi, thin dal, salad', kcal: 470, type: 'vegan', good: ['kidney', 'elderly', 'hypertension'] },
    { name: '2 roti, paneer bhurji, mixed vegetables, salad', kcal: 560, type: 'veg', good: ['pregnancy'], avoid: ['kidney'] },
    { name: 'Egg curry with 2 roti and salad', kcal: 530, type: 'egg', good: ['anemia'] },
    { name: '2 roti, chicken curry (less oil), salad', kcal: 560, type: 'nonveg', good: ['anemia', 'pregnancy'] },
    { name: 'Rice, fish curry (less oil), vegetable sabzi', kcal: 560, type: 'nonveg', good: ['heart', 'pregnancy'] }
  ],
  evening: [
    { name: 'Roasted chana', kcal: 120, type: 'vegan', good: ['anemia', 'diabetes'], avoid: ['kidney'] },
    { name: 'Unsalted buttermilk (chaas)', kcal: 60, type: 'veg', good: ['hypertension', 'heart', 'diabetes'] },
    { name: 'Handful of almonds and walnuts', kcal: 170, type: 'vegan', good: ['heart', 'diabetes'], avoid: ['kidney'] },
    { name: 'Vegetable soup', kcal: 80, type: 'vegan', good: ['hypertension', 'elderly', 'kidney'] },
    { name: 'Puffed rice (murmura) bhel with vegetables', kcal: 140, type: 'vegan', good: ['kidney'] },
    { name: 'Green tea with 2 multigrain biscuits', kcal: 100, type: 'vegan', good: ['heart'] }
  ],
  dinner: [
    { name: 'Vegetable khichdi with curd', kcal: 420, type: 'veg', good: ['elderly', 'kidney'] },
    { name: '2 roti, mixed vegetable sabzi, dal', kcal: 450, type: 'vegan', good: ['heart'] },
    { name: 'Vegetable soup and grilled paneer tikka', kcal: 400, type: 'veg', good: ['diabetes'] },
    { name: 'Moong dal soup, 2 jowar roti, sabzi', kcal: 400, type: 'vegan', good: ['diabetes', 'hypertension', 'heart'] },
    { name: 'Dalia khichdi with vegetables', kcal: 380, type: 'vegan', good: ['diabetes', 'heart', 'elderly'] },
    { name: 'Tofu and vegetable stir-fry with 1 roti', kcal: 400, type: 'vegan', good: ['diabetes', 'heart'] },
    { name: 'Egg bhurji with 2 roti and salad', kcal: 430, type: 'egg', good: ['anemia'] },
    { name: 'Grilled fish or chicken with sautéed vegetables', kcal: 420, type: 'nonveg', good: ['diabetes', 'heart'] }
  ]
};

const ALLOWED_TYPES = {
  vegan: ['vegan'],
  veg: ['vegan', 'veg'],
  eggetarian: ['vegan', 'veg', 'egg'],
  nonveg: ['vegan', 'veg', 'egg', 'nonveg']
};

const ACTIVITY = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };

const CONDITION_TIPS = {
  diabetes: {
    tips: ['Eat small meals every 3-4 hours to keep sugar steady.', 'Choose whole grains and millets over white rice and maida.', 'Fill half your plate with vegetables.'],
    avoid: ['Sugar, sweets and sweetened drinks', 'White bread and maida', 'Fruit juices (eat whole fruit instead)']
  },
  hypertension: {
    tips: ['Keep salt under 1 teaspoon (5 g) a day, in total.', 'Eat potassium-rich foods like vegetables and fruit (unless you have kidney disease).', 'Walk 30 minutes a day if your doctor allows.'],
    avoid: ['Pickles, papad and packaged namkeen', 'Instant noodles and processed foods', 'Extra salt at the table']
  },
  anemia: {
    tips: ['Eat iron-rich foods: green leafy vegetables, dals, jaggery, dates.', 'Add vitamin C (lemon, amla, guava) with meals to absorb more iron.', 'Avoid tea or coffee within 1 hour of meals.'],
    avoid: ['Tea or coffee right after meals']
  },
  heart: {
    tips: ['Use less oil; prefer mustard, groundnut or rice-bran oil.', 'Eat more fibre: oats, dals, fruit and vegetables.', 'Add a handful of nuts most days.'],
    avoid: ['Deep-fried foods', 'Ghee and butter in large amounts', 'Red and processed meat']
  },
  kidney: {
    tips: ['Ask your doctor how much protein, fluid, potassium and phosphorus you may have.', 'Leach high-potassium vegetables (soak in warm water) if advised.', 'Keep salt low.'],
    avoid: ['Extra salt and salt substitutes', 'Bananas, coconut water and dried fruit (high potassium)', 'Packaged and processed foods']
  },
  pregnancy: {
    tips: ['Take the iron, folic acid and calcium tablets your doctor gives.', 'Add about 300 kcal a day in the 2nd and 3rd trimester.', 'Eat protein at every meal.'],
    avoid: ['Raw or undercooked eggs, meat and fish', 'Unpasteurised milk', 'Too much caffeine']
  },
  elderly: {
    tips: ['Choose soft, easy-to-chew foods.', 'Drink water regularly even when not thirsty.', 'Include calcium and vitamin D (milk, curd, sunlight).'],
    avoid: ['Very spicy or oily food at night']
  }
};

function bmiCategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Healthy weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

function validate(input) {
  const errors = [];
  const age = Number(input.age), weight = Number(input.weight), height = Number(input.height);
  if (!(age >= 2 && age <= 110)) errors.push('Age must be between 2 and 110');
  if (!(weight >= 10 && weight <= 300)) errors.push('Weight must be between 10 and 300 kg');
  if (!(height >= 60 && height <= 250)) errors.push('Height must be between 60 and 250 cm');
  if (!['male', 'female'].includes(input.gender)) errors.push('Choose a gender');
  return errors;
}

function createPlan(input) {
  const errors = validate(input);
  if (errors.length) return { errors };

  const age = Number(input.age);
  const weight = Number(input.weight);
  const height = Number(input.height);
  const gender = input.gender;
  const activity = ACTIVITY[input.activity] ? input.activity : 'light';
  const goal = ['lose', 'maintain', 'gain'].includes(input.goal) ? input.goal : 'maintain';
  const diet = ALLOWED_TYPES[input.diet] ? input.diet : 'veg';
  const conditions = (Array.isArray(input.conditions) ? input.conditions : [])
    .filter(c => CONDITION_TIPS[c]);
  if (age >= 60 && !conditions.includes('elderly')) conditions.push('elderly');
  if (gender !== 'female') {
    const i = conditions.indexOf('pregnancy');
    if (i >= 0) conditions.splice(i, 1);
  }

  // --- Numbers ---
  const bmi = +(weight / ((height / 100) ** 2)).toFixed(1);
  const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
  let calories = bmr * ACTIVITY[activity];
  if (goal === 'lose') calories -= 400;
  if (goal === 'gain') calories += 350;
  if (conditions.includes('pregnancy')) calories += 300;
  calories = Math.round(Math.max(gender === 'male' ? 1500 : 1200, calories) / 10) * 10;

  let split = { protein: 0.2, carbs: 0.5, fat: 0.3 };
  if (conditions.includes('diabetes')) split = { protein: 0.22, carbs: 0.45, fat: 0.33 };
  if (conditions.includes('kidney')) split = { protein: 0.12, carbs: 0.58, fat: 0.3 };
  const macros = {
    proteinG: Math.round((calories * split.protein) / 4),
    carbsG: Math.round((calories * split.carbs) / 4),
    fatG: Math.round((calories * split.fat) / 9)
  };
  const waterL = conditions.includes('kidney') ? null : +(weight * 0.033).toFixed(1);

  // --- Meals ---
  const allowed = ALLOWED_TYPES[diet];
  const pick = (slot) => {
    const options = FOODS[slot]
      .filter(f => allowed.includes(f.type))
      .filter(f => !(f.avoid || []).some(c => conditions.includes(c)))
      .map(f => ({ ...f, fit: (f.good || []).filter(c => conditions.includes(c)).length }))
      .sort((a, b) => b.fit - a.fit);
    return options.slice(0, Math.min(options.length, 6));
  };
  const slots = ['breakfast', 'midMorning', 'lunch', 'evening', 'dinner'];
  const pools = Object.fromEntries(slots.map(s => [s, pick(s)]));
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const week = days.map((day, d) => {
    const meals = {};
    let total = 0;
    slots.forEach((slot, s) => {
      const pool = pools[slot];
      const food = pool[(d + s * 2) % pool.length];
      meals[slot] = { name: food.name, kcal: food.kcal };
      total += food.kcal;
    });
    return { day, meals, baseKcal: total };
  });

  const avgBase = week.reduce((s, d) => s + d.baseKcal, 0) / week.length;
  const portion = +(calories / avgBase).toFixed(2);
  let portionNote = 'Normal portions as listed.';
  if (portion > 1.1) portionNote = `Eat about ${Math.round((portion - 1) * 100)}% bigger portions (e.g. an extra roti or more rice/dal) to reach your target.`;
  else if (portion < 0.9) portionNote = `Eat about ${Math.round((1 - portion) * 100)}% smaller portions (e.g. one less roti or less rice) to reach your target.`;

  // --- Advice ---
  const tips = ['Eat dinner at least 2 hours before sleeping.', 'Include a seasonal fruit and vegetables every day.'];
  const avoid = [];
  conditions.forEach(c => { tips.push(...CONDITION_TIPS[c].tips); avoid.push(...CONDITION_TIPS[c].avoid); });
  if (goal === 'lose') tips.push('Aim to lose about 0.5 kg a week; avoid crash diets.');
  if (goal === 'gain') tips.push('Add healthy calories: nuts, milk, banana shakes, extra dal and paneer.');

  return {
    summary: {
      bmi, bmiCategory: bmiCategory(bmi), calories, macros, waterL,
      goal, diet, activity, conditions
    },
    portion, portionNote,
    week,
    tips: [...new Set(tips)],
    avoid: [...new Set(avoid)],
    disclaimer: 'This plan is general guidance, not medical advice. Please check with a doctor or dietitian, especially if you have a health condition or are pregnant.'
  };
}

module.exports = { createPlan };
