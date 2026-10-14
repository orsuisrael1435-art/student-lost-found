// ============================================================
// SMART MATCHING SERVICE
// Core algorithm that compares lost vs found items and generates match scores
// ============================================================
const { query } = require('../config/database');
const { notifyPossibleMatch, notifyFinderOfMatch } = require('../utils/notification.helper');

/**
 * MATCHING SCORE WEIGHTS (Total = 100 points)
 * ─────────────────────────────────────────────
 * Item Name      : 25 pts
 * Category       : 15 pts
 * Colour         : 15 pts
 * Brand          : 10 pts
 * Building       : 10 pts
 * Room Number    : 10 pts
 * Date Proximity : 5 pts
 * Description    : 10 pts
 */
const WEIGHTS = {
  item_name: 25,
  category: 15,
  colour: 15,
  brand: 10,
  building: 10,
  room_number: 10,
  date: 5,
  description: 10
};

// Minimum score threshold to create a match record
const MIN_MATCH_THRESHOLD = 50;

/**
 * Calculate string similarity using Dice coefficient
 * Returns value between 0 and 1
 */
const stringSimilarity = (a, b) => {
  if (!a || !b) return 0;
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  // Check if one contains the other
  if (a.includes(b) || b.includes(a)) return 0.85;

  // Word-level overlap
  const aWords = new Set(a.split(/\s+/));
  const bWords = new Set(b.split(/\s+/));
  const intersection = [...aWords].filter(w => bWords.has(w)).length;
  if (intersection > 0) return intersection / Math.max(aWords.size, bWords.size) * 0.9;

  // Bigram similarity (Dice coefficient)
  const aBigrams = new Set();
  const bBigrams = new Set();
  for (let i = 0; i < a.length - 1; i++) aBigrams.add(a.slice(i, i + 2));
  for (let i = 0; i < b.length - 1; i++) bBigrams.add(b.slice(i, i + 2));
  const commonBigrams = [...aBigrams].filter(bg => bBigrams.has(bg)).length;
  return (2 * commonBigrams) / (aBigrams.size + bBigrams.size);
};

/**
 * Calculate date proximity score
 * Full score if within 1 day, decreasing score up to 7 days
 */
const dateSimilarity = (date1, date2) => {
  if (!date1 || !date2) return 0;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffDays = Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return 1;
  if (diffDays <= 3) return 0.7;
  if (diffDays <= 7) return 0.4;
  if (diffDays <= 14) return 0.2;
  return 0;
};

/**
 * Calculate score for a single lost-found pair
 * Returns { score, breakdown, reasons }
 */
const calculateMatchScore = (lostItem, foundItem) => {
  const breakdown = {};
  const reasons = [];
  let totalScore = 0;

  // 1. Item Name (25 pts)
  const nameSim = stringSimilarity(lostItem.item_name, foundItem.item_name);
  breakdown.item_name = Math.round(WEIGHTS.item_name * nameSim);
  totalScore += breakdown.item_name;
  if (nameSim > 0.7) reasons.push(`Item name match: "${lostItem.item_name}" ~ "${foundItem.item_name}"`);

  // 2. Category (15 pts)
  const catSim = stringSimilarity(lostItem.category, foundItem.category);
  breakdown.category = Math.round(WEIGHTS.category * catSim);
  totalScore += breakdown.category;
  if (catSim > 0.8) reasons.push(`Same category: ${lostItem.category}`);

  // 3. Colour (15 pts)
  const colSim = stringSimilarity(lostItem.colour, foundItem.colour);
  breakdown.colour = Math.round(WEIGHTS.colour * colSim);
  totalScore += breakdown.colour;
  if (colSim > 0.7) reasons.push(`Colour match: ${lostItem.colour}`);

  // 4. Brand (10 pts)
  const brandSim = stringSimilarity(lostItem.brand, foundItem.brand);
  breakdown.brand = Math.round(WEIGHTS.brand * brandSim);
  totalScore += breakdown.brand;
  if (brandSim > 0.8) reasons.push(`Brand match: ${lostItem.brand}`);

  // 5. Building (10 pts)
  const bldSim = stringSimilarity(lostItem.building, foundItem.building);
  breakdown.building = Math.round(WEIGHTS.building * bldSim);
  totalScore += breakdown.building;
  if (bldSim > 0.7) reasons.push(`Same building: ${lostItem.building}`);

  // 6. Room Number (10 pts)
  const roomSim = stringSimilarity(lostItem.room_number, foundItem.room_number);
  breakdown.room_number = Math.round(WEIGHTS.room_number * roomSim);
  totalScore += breakdown.room_number;
  if (roomSim > 0.8) reasons.push(`Same room: ${lostItem.room_number}`);

  // 7. Date Proximity (5 pts)
  const dateSim = dateSimilarity(lostItem.lost_date, foundItem.found_date);
  breakdown.date = Math.round(WEIGHTS.date * dateSim);
  totalScore += breakdown.date;
  if (dateSim > 0.5) reasons.push(`Date proximity match`);

  // 8. Description (10 pts)
  const descSim = stringSimilarity(lostItem.description, foundItem.description);
  breakdown.description = Math.round(WEIGHTS.description * descSim);
  totalScore += breakdown.description;
  if (descSim > 0.3) reasons.push(`Description keywords match`);

  return {
    score: Math.min(totalScore, 100),
    breakdown,
    reasons
  };
};

/**
 * Find matches for a newly submitted LOST item
 * Searches all active FOUND items and creates match records
 */
const findMatchesForLostItem = async (lostItem) => {
  try {
    // Get all active found items in the same broad category or building (for performance)
    const foundItems = await query(
      `SELECT * FROM found_items
       WHERE status IN ('active', 'possible_match')
         AND is_approved = true
         AND (category ILIKE $1 OR building ILIKE $2)`,
      [`%${lostItem.category}%`, `%${lostItem.building}%`]
    );

    let bestMatch = null;
    let bestScore = 0;

    for (const foundItem of foundItems.rows) {
      const { score, breakdown, reasons } = calculateMatchScore(lostItem, foundItem);

      if (score >= MIN_MATCH_THRESHOLD) {
        // Check if match already exists
        const existing = await query(
          'SELECT id FROM matches WHERE lost_item_id=$1 AND found_item_id=$2',
          [lostItem.id, foundItem.id]
        );

        if (existing.rows.length === 0) {
          // Create new match record
          const matchResult = await query(
            `INSERT INTO matches (lost_item_id, found_item_id, match_score, match_breakdown, match_reason, status)
             VALUES ($1,$2,$3,$4,$5,'pending') RETURNING *`,
            [lostItem.id, foundItem.id, score, JSON.stringify(breakdown), reasons.join('; ')]
          );

          const match = matchResult.rows[0];

          // Update statuses
          await Promise.all([
            query(`UPDATE lost_items SET status='possible_match', updated_at=NOW() WHERE id=$1`, [lostItem.id]),
            query(`UPDATE found_items SET status='possible_match', updated_at=NOW() WHERE id=$1`, [foundItem.id])
          ]);

          // Notify the owner (person who lost the item)
          await notifyPossibleMatch(lostItem.user_id, score, lostItem.item_name, match.id);
          // Notify the finder
          await notifyFinderOfMatch(foundItem.user_id, foundItem.item_name, match.id);

          if (score > bestScore) { bestScore = score; bestMatch = match; }
          console.log(`✅ Match created: ${lostItem.lost_id} ↔ ${foundItem.found_id} | Score: ${score}%`);
        }
      }
    }

    return bestMatch;
  } catch (error) {
    console.error('findMatchesForLostItem error:', error.message);
    throw error;
  }
};

/**
 * Find matches for a newly submitted FOUND item
 * Searches all active LOST items
 */
const findMatchesForFoundItem = async (foundItem) => {
  try {
    const lostItems = await query(
      `SELECT * FROM lost_items
       WHERE status IN ('active', 'possible_match')
         AND is_approved = true
         AND (category ILIKE $1 OR building ILIKE $2)`,
      [`%${foundItem.category}%`, `%${foundItem.building}%`]
    );

    for (const lostItem of lostItems.rows) {
      const { score, breakdown, reasons } = calculateMatchScore(lostItem, foundItem);

      if (score >= MIN_MATCH_THRESHOLD) {
        const existing = await query(
          'SELECT id FROM matches WHERE lost_item_id=$1 AND found_item_id=$2',
          [lostItem.id, foundItem.id]
        );

        if (existing.rows.length === 0) {
          const matchResult = await query(
            `INSERT INTO matches (lost_item_id, found_item_id, match_score, match_breakdown, match_reason, status)
             VALUES ($1,$2,$3,$4,$5,'pending') RETURNING *`,
            [lostItem.id, foundItem.id, score, JSON.stringify(breakdown), reasons.join('; ')]
          );

          const match = matchResult.rows[0];

          await Promise.all([
            query(`UPDATE lost_items SET status='possible_match', updated_at=NOW() WHERE id=$1`, [lostItem.id]),
            query(`UPDATE found_items SET status='possible_match', updated_at=NOW() WHERE id=$1`, [foundItem.id])
          ]);

          await notifyPossibleMatch(lostItem.user_id, score, lostItem.item_name, match.id);
          await notifyFinderOfMatch(foundItem.user_id, foundItem.item_name, match.id);

          console.log(`✅ Match created: ${lostItem.lost_id} ↔ ${foundItem.found_id} | Score: ${score}%`);
        }
      }
    }
  } catch (error) {
    console.error('findMatchesForFoundItem error:', error.message);
    throw error;
  }
};

/**
 * Run full matching for all unmatched items (admin utility)
 */
const runFullMatching = async () => {
  try {
    const lostItems = await query(
      `SELECT * FROM lost_items WHERE status='active' AND is_approved=true`
    );
    let totalMatches = 0;
    for (const item of lostItems.rows) {
      const match = await findMatchesForLostItem(item);
      if (match) totalMatches++;
    }
    console.log(`Full matching complete. ${totalMatches} new matches found.`);
    return totalMatches;
  } catch (error) {
    console.error('Full matching error:', error.message);
    throw error;
  }
};

module.exports = { calculateMatchScore, findMatchesForLostItem, findMatchesForFoundItem, runFullMatching };
