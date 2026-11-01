/**
 * EventGeniePlan AI - Intelligent Seating Chart Optimizer
 * Constraint Satisfaction Graph Solver for Relationships, Friction Pairs & Dietary Clusters
 */

/**
 * Evaluates the harmony score (0-100) and detects clashes for current seating arrangement
 */
function evaluateSeatingChart(guests = [], tables = []) {
  let harmonyScore = 100;
  const clashes = [];
  const dietaryClusters = {};
  const tableGuestMap = {};

  // Build table map
  tables.forEach(t => {
    tableGuestMap[t.id] = [];
  });

  guests.forEach(g => {
    if (g.tableId && tableGuestMap[g.tableId]) {
      tableGuestMap[g.tableId].push(g);
    }
  });

  // Check Table Capacities & Clashes
  tables.forEach(table => {
    const tableGuests = tableGuestMap[table.id] || [];

    // Capacity Check
    if (tableGuests.length > table.capacity) {
      harmonyScore -= (tableGuests.length - table.capacity) * 20;
      clashes.push({
        type: 'capacity_overflow',
        severity: 'Critical',
        tableId: table.id,
        tableName: table.name,
        message: `${table.name} exceeds maximum capacity (${tableGuests.length}/${table.capacity} seated)`
      });
    }

    // Friction / Feud Check within this table
    for (let i = 0; i < tableGuests.length; i++) {
      for (let j = i + 1; j < tableGuests.length; j++) {
        const g1 = tableGuests[i];
        const g2 = tableGuests[j];

        const hasFriction = (g1.frictionWith && g1.frictionWith.includes(g2.id)) ||
          (g2.frictionWith && g2.frictionWith.includes(g1.id));

        if (hasFriction) {
          harmonyScore -= 35;
          clashes.push({
            type: 'friction_conflict',
            severity: 'Critical',
            tableId: table.id,
            tableName: table.name,
            guest1: { id: g1.id, name: g1.name },
            guest2: { id: g2.id, name: g2.name },
            message: `Friction Alert: ${g1.name} and ${g2.name} are seated together at ${table.name}!`
          });
        }
      }
    }

    // Dietary Clustering Analysis
    const dietCounts = {};
    tableGuests.forEach(g => {
      if (g.diet && g.diet !== 'None') {
        dietCounts[g.diet] = (dietCounts[g.diet] || 0) + 1;
      }
    });

    Object.entries(dietCounts).forEach(([diet, count]) => {
      if (count >= 2) {
        dietaryClusters[table.id] = dietaryClusters[table.id] || [];
        dietaryClusters[table.id].push(`${count}x ${diet}`);
      }
    });
  });

  // Calculate unassigned guests penalty
  const unassigned = guests.filter(g => !g.tableId);
  if (unassigned.length > 0) {
    harmonyScore -= Math.min(25, unassigned.length * 3);
  }

  return {
    harmonyScore: Math.max(10, Math.min(100, Math.round(harmonyScore))),
    clashes,
    hasClashes: clashes.length > 0,
    dietaryClusters,
    unassignedCount: unassigned.length,
    totalGuests: guests.length
  };
}

/**
 * Algorithmic Constraint Satisfaction Solver
 * Reassigns guests to maximize group affinity, separate friction pairs, and cluster diets
 */
function algorithmicSeatingSolver(guests = [], tables = []) {
  const guestsClone = JSON.parse(JSON.stringify(guests));
  const tablesClone = JSON.parse(JSON.stringify(tables));

  // Initialize table occupancy
  const tableAssignments = {};
  tablesClone.forEach(t => {
    tableAssignments[t.id] = [];
  });

  // Priority 1: Handle VIPs and Pre-assigned anchor guests
  const sortedGuests = [...guestsClone].sort((a, b) => {
    if (a.vip && !b.vip) return -1;
    if (!a.vip && b.vip) return 1;
    // Guests with friction first (most constrained)
    const aFriction = (a.frictionWith || []).length;
    const bFriction = (b.frictionWith || []).length;
    return bFriction - aFriction;
  });

  let frictionConflictsResolved = 0;

  for (const guest of sortedGuests) {
    let bestTableId = null;
    let highestScore = -Infinity;

    for (const table of tablesClone) {
      const currentAssigned = tableAssignments[table.id];
      if (currentAssigned.length >= table.capacity) {
        continue; // Table full
      }

      // Check if table contains friction enemy
      const hasConflict = currentAssigned.some(seated =>
        (guest.frictionWith && guest.frictionWith.includes(seated.id)) ||
        (seated.frictionWith && seated.frictionWith.includes(guest.id))
      );

      if (hasConflict) {
        continue; // Hard constraint: NEVER place enemies at same table
      }

      // Scoring criteria
      let score = 0;

      // VIP Table Matching
      if (guest.vip && (table.name.includes('VIP') || table.id === 'tbl_1')) {
        score += 50;
      }

      // Affinity Group Matching
      const matchingAffinityCount = currentAssigned.filter(s => s.affinityGroup && s.affinityGroup === guest.affinityGroup).length;
      score += matchingAffinityCount * 25;

      // Dietary Clustering (Reward grouping same dietary needs together for catering efficiency)
      if (guest.diet && guest.diet !== 'None') {
        const matchingDietCount = currentAssigned.filter(s => s.diet === guest.diet).length;
        score += matchingDietCount * 15;
      }

      // Spread balance
      score -= currentAssigned.length * 2;

      if (score > highestScore) {
        highestScore = score;
        bestTableId = table.id;
      }
    }

    // Fallback if no ideal table found, find first table with space that has no friction
    if (!bestTableId) {
      for (const table of tablesClone) {
        const currentAssigned = tableAssignments[table.id];
        if (currentAssigned.length < table.capacity) {
          const hasConflict = currentAssigned.some(seated =>
            (guest.frictionWith && guest.frictionWith.includes(seated.id)) ||
            (seated.frictionWith && seated.frictionWith.includes(guest.id))
          );
          if (!hasConflict) {
            bestTableId = table.id;
            break;
          }
        }
      }
    }

    if (bestTableId) {
      tableAssignments[bestTableId].push(guest);
      guest.tableId = bestTableId;
      if (guest.frictionWith && guest.frictionWith.length > 0) {
        frictionConflictsResolved++;
      }
    } else {
      // Guest left unassigned due to table capacity limits
      guest.tableId = null;
    }
  }

  // Update table objects
  tablesClone.forEach(t => {
    t.assignedGuests = (tableAssignments[t.id] || []).map(g => g.id);
  });

  const evaluation = evaluateSeatingChart(sortedGuests, tablesClone);

  return {
    tableAssignments: tablesClone.map(t => ({
      tableId: t.id,
      tableName: t.name,
      capacity: t.capacity,
      seatedCount: (tableAssignments[t.id] || []).length,
      guestIds: (tableAssignments[t.id] || []).map(g => g.id),
      guests: (tableAssignments[t.id] || []).map(g => ({
        id: g.id,
        name: g.name,
        affinityGroup: g.affinityGroup,
        diet: g.diet,
        vip: g.vip
      }))
    })),
    updatedGuests: sortedGuests,
    frictionConflictsResolved,
    dietaryClustersFormed: Object.entries(evaluation.dietaryClusters).map(([tblId, clusters]) => {
      const tbl = tablesClone.find(t => t.id === tblId);
      return `${tbl ? tbl.name : tblId}: ${clusters.join(', ')}`;
    }),
    harmonyScore: evaluation.harmonyScore,
    clashes: evaluation.clashes
  };
}

module.exports = {
  evaluateSeatingChart,
  algorithmicSeatingSolver
};
