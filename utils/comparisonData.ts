// Comparison data mapping SVG filenames to weight, label, and playful descriptions
// Used in FlexView to compare user's total volume lifted to real-world objects

export interface ComparisonItem {
  weight: number; // in kg
  label: string;
  description: string;
}

export interface ComparisonData {
  instruction: {
    selectionRule: string;
  };
  allFiles: string[];
  items: Record<string, ComparisonItem>;
}

export const COMPARISON_DATA: ComparisonData = {
  instruction: {
    selectionRule: "On every page reload, randomly pick one file; if the user's lifted weight is 0, show a special zero-lift message and don't compare; otherwise select the closest mapped item by weight (or use the random pick if you prefer), then display its label and description."
  },
  allFiles: [
    "Automatic__aussault_gun.svg",
    "Chicken_whole_skinned.svg",
    "Decorated-Elephant.svg",
    "Donald-Trump.svg",
    "Egyptian-pyramids.svg",
    "Egyptian-sphinx.svg",
    "F15jet.svg",
    "Female-Bodybuilder-flexing-sillhuite.svg",
    "Ford-Falcon.svg",
    "Gorilla.svg",
    "Muscular-Putin.svg",
    "Statue-Of-Liberty.svg",
    "Taj-Mahal-Illustration.svg",
    "Titanic.svg",
    "U.S.-American-Bomb.svg",
    "electric_train.svg",
    "fighter-Jet.svg",
    "hercules-statue.svg",
    "horse.svg",
    "loaded-artillery-truck.svg",
    "male -Posing-Bodybuilder.svg",
    "male-Bodybuilder-flexing-sillhuite.svg",
    "mustang.svg",
    "napolean-on-horse-with-his-army-on-feet-climbing-mountain..svg",
    "oil-tanker.svg",
    "passenger_Plane.svg",
    "refrigerator.svg",
    "sad-alexander-the-great.svg",
    "three-nerd-personas-scalar.svg",
    "war-Tank.svg",
    "whole_chicken_Egg.svg",
    "yellow-banana.svg",
    "yeti.svg"
  ],
  items: {
    "Automatic__aussault_gun.svg": {
      weight: 3.6,
      label: "Assault Rifle",
      description: "Tactical grip, tactical vibes.\nNow try not to \"Assault\" your rotator cuff."
    },
    "Chicken_whole_skinned.svg": {
      weight: 1.8,
      label: "Chicken",
      description: "The OG \"chicken and rice\"… now in free-weight form.\nSmells like gains and questionable meal prep.\nDo not superset with seasoning."
    },
    "Decorated-Elephant.svg": {
      weight: 5400.0,
      label: "Elephant",
      description: "You didn't lift this,you negotiated with gravity.\nThe bar bends, reality bends, your friends clap nervously.\nCertified \"main character\" set."
    },
    "Donald-Trump.svg": {
      weight: 102.0,
      label: "A Loud Guy in a Suit",
      description: "Tremendous lift. Really tremendous. Believe me.\nGreat guy, great compression tee , very strong, the best fit."
    },
    "Egyptian-pyramids.svg": {
      weight: 6000000.0,
      label: "Pyramids",
      description: "Progressive overload? This is *civilization overload*.\nAncient engineers watching you like: \"nice warm-up.\"\nYour gym bag is now a historical artifact."
    },
    "Egyptian-sphinx.svg": {
      weight: 2000000.0,
      label: "The Sphinx",
      description: "Riddle me this: why did you even try?\nOne rep and you unlock \"Pharaoh Mode.\"\nChalk is now considered an offering."
    },
    "F15jet.svg": {
      weight: 12700.0,
      label: "F-15 Fighter Jet",
      description: "You're not doing a deadlift, you're launching a mission.\nStrap in, breathe, and pretend the afterburner is just pre-workout.\nAir superiority, achieved."
    },
    "Female-Bodybuilder-flexing-sillhuite.svg": {
      weight: 72.0,
      label: "Pro Bodybuilder",
      description: "You tried to lift the *aura* and it still smoked you.\nDelts judging you from the shadows.\nForm check: immaculate intimidation."
    },
    "Ford-Falcon.svg": {
      weight: 1450.0,
      label: "Ford Falcon",
      description: "A classic car, now a classic back-day mistake.\nReverse hypers? Nah, reverse *parking*.\nDon't forget to \"re-rack\" it in the driveway."
    },
    "Gorilla.svg": {
      weight: 160.0,
      label: "Gorilla",
      description: "Silverback strength: borrowed.\nIf it starts chest-beating, that counts as a drop set.\nEye contact is now a PR attempt."
    },
    "Muscular-Putin.svg": {
      weight: 98.0,
      label: "BodyBuilder Putin",
      description: "The weight is heavy, the stare is heavier.\nEvery rep comes with a dramatic soundtrack.\nYou finish the set; the set finishes you."
    },
    "Statue-Of-Liberty.svg": {
      weight: 204000.0,
      label: "Statue of Liberty",
      description: "Holding the torch? More like holding your life choices.\nStabilizers crying in multiple languages.\nLiberty and glute drive for all."
    },
    "Taj-Mahal-Illustration.svg": {
      weight: 200000.0,
      label: "Taj Mahal",
      description: "Romantic monument, unromantic spinal compression.\nYou lift it and suddenly everyone calls you \"architect.\"\nLove is heavy. Literally."
    },
    "Titanic.svg": {
      weight: 52300000.0,
      label: "The Titanic",
      description: "Unsinkable? Sure. Unliftable? Also sure.\nYour straps snap and history repeats itself.\nIceberg not included."
    },
    "U.S.-American-Bomb.svg": {
      weight: 4500.0,
      label: "Big Bomb",
      description: "Handle with care and *please* don't drop it.\nThe spotter signs a waiver and a peace treaty.\nYour PR has geopolitical consequences."
    },
    "electric_train.svg": {
      weight: 150000.0,
      label: "Electric Train Car",
      description: "All aboard the gainz express.\nYou pull it once and immediately miss your stop.\nMind the gap between you and consciousness."
    },
    "fighter-Jet.svg": {
      weight: 9500.0,
      label: "Fighter Jet",
      description: "You locked out and heard a sonic boom.\nThat's not ammonia, it's jet fuel vibes.\nAir show, but make it leg day."
    },
    "hercules-statue.svg": {
      weight: 1200.0,
      label: "Hercules Statue",
      description: "Mythic strength… in statue form… still heavy.\nYou lift it and instantly develop a tragic backstory.\nGods applaud, physio cries."
    },
    "horse.svg": {
      weight: 500.0,
      label: "Horse",
      description: "Neigh-sayers will say it's fake.\nYou stabilize and it \"helpfully\" decides to move.\nThis is why we use barbells."
    },
    "loaded-artillery-truck.svg": {
      weight: 18000.0,
      label: "Loaded Artillery Truck",
      description: "You didn't load plates, you loaded *logistics*.\nThe gym floor files a complaint.\nOne rep and you get promoted to commander."
    },
    "male -Posing-Bodybuilder.svg": {
      weight: 88.0,
      label: "Posing Bodybuilders",
      description: "You tried to lift the pose and still got mogged.\nQuads are screaming in HD.\nEvery rep ends with a mandatory flex."
    },
    "male-Bodybuilder-flexing-sillhuite.svg": {
      weight: 85.0,
      label: "Bodybuilder (Silhouette)",
      description: "It's just a silhouette… and it's still outlifting you.\nShadow delts stealing your confidence.\nPR: Psychological damage."
    },
    "mustang.svg": {
      weight: 1650.0,
      label: "Mustang",
      description: "V8 energy, V0 spinal safety.\nYou pull it and immediately hear revving in your soul.\nParking lot deadlift champion."
    },
    "napolean-on-horse-with-his-army-on-feet-climbing-mountain..svg": {
      weight: 105000.0,
      label: "Napoleon's Army (Uphill)",
      description: "You're not lifting weight,you're lifting *history* up a mountain.\nShort king energy, massive carry.\nEvery rep is a campaign."
    },
    "oil-tanker.svg": {
      weight: 300000000.0,
      label: "Oil Tanker Ship",
      description: "The barbell is now maritime infrastructure.\nYour grip develops calluses with shipping labels.\nCongratulations, you're a port."
    },
    "passenger_Plane.svg": {
      weight: 80000.0,
      label: "Passenger Plane",
      description: "You picked it up and heard the seatbelt sign click.\nCarry-on? You are the carry-on.\nPlease keep arms and legs inside the PR."
    },
    "refrigerator.svg": {
      weight: 85.0,
      label: "Refrigerator",
      description: "Finally: a cut that's literally heavy.\nYou hug it, it hugs back with regret.\nMeal prep storage: weaponized."
    },
    "sad-alexander-the-great.svg": {
      weight: 90.0,
      label: "Sad Alexander the Great",
      description: "He conquered the world, you conquered one rep.\nThe sadness adds extra emotional load.\nHistory lesson: brace harder."
    },
    "three-nerd-personas-scalar.svg": {
      weight: 210.0,
      label: "Science Based Lifters (Stacked)",
      description: "They rebrand stuff and debate your RPE mid-rep.\nWhen they ask for a 'study' or 'source,' show them your HevyAnalytics dashboard."
    },
    "war-Tank.svg": {
      weight: 62000.0,
      label: "Battle Tank",
      description: "Your warm-up is now a military parade.\nYou lock out and the ground negotiates.\nHeavy metal, literally."
    },
    "whole_chicken_Egg.svg": {
      weight: 0.1,
      label: "Egg",
      description: "An egg. The purest micro-plate.\nLift it carefully, PRs can be fragile.\nScramble later,  not mid-rep."
    },
    "yellow-banana.svg": {
      weight: 0.2,
      label: "Banana",
      description: "Potassium-powered progressive overload.\nPeel it between sets for +5% morale.\nTiny weight, big ego."
    },
    "yeti.svg": {
      weight: 180.0,
      label: "Yeti",
      description: "Spotted: you, trying to lift a cryptid.\nIt grunts; you reconsider your life choices.\nLegend says the DOMS lasts forever."
    }
  }
};

// Helper function to find the closest comparison item by weight
export function findClosestComparison(volumeKg: number): { filename: string; item: ComparisonItem; count: number } | null {
  if (volumeKg <= 0) return null;
  
  const entries = Object.entries(COMPARISON_DATA.items);
  if (entries.length === 0) return null;
  
  let closestFilename = entries[0][0];
  let closestItem = entries[0][1];
  let closestDiff = Math.abs(volumeKg - closestItem.weight);
  
  for (const [filename, item] of entries) {
    const diff = Math.abs(volumeKg - item.weight);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestFilename = filename;
      closestItem = item;
    }
  }
  
  // Calculate how many of this item the volume equals
  const count = Math.round((volumeKg / closestItem.weight) * 10) / 10;
  
  return { filename: closestFilename, item: closestItem, count };
}

// Helper to find the best comparison (where volume is close to a nice multiple)
export function findBestComparison(volumeKg: number): { filename: string; item: ComparisonItem; count: number } | null {
  if (volumeKg <= 0) return null;
  
  const entries = Object.entries(COMPARISON_DATA.items);
  if (entries.length === 0) return null;
  
  let bestFilename = '';
  let bestItem: ComparisonItem | null = null;
  let bestCount = 0;
  let bestScore = Infinity;
  
  for (const [filename, item] of entries) {
    const count = volumeKg / item.weight;
    // We want count to be a nice number (close to an integer or .5)
    const roundedCount = Math.round(count * 2) / 2; // Round to nearest 0.5
    if (roundedCount < 0.5) continue; // Skip if less than half
    
    const diff = Math.abs(count - roundedCount);
    // Prefer counts that are whole numbers or nice fractions
    const score = diff + (roundedCount > 1000 ? 0.5 : 0); // Slight penalty for huge counts
    
    if (score < bestScore) {
      bestScore = score;
      bestFilename = filename;
      bestItem = item;
      bestCount = roundedCount;
    }
  }
  
  if (!bestItem) {
    // Fallback to closest
    return findClosestComparison(volumeKg);
  }
  
  return { filename: bestFilename, item: bestItem, count: bestCount };
}

// Get a random comparison item
export function getRandomComparison(): { filename: string; item: ComparisonItem } {
  const files = COMPARISON_DATA.allFiles;
  const randomFile = files[Math.floor(Math.random() * files.length)];
  return { filename: randomFile, item: COMPARISON_DATA.items[randomFile] };
}

// Format large numbers with appropriate suffixes
export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toFixed(1).replace(/\.0$/, '');
}
