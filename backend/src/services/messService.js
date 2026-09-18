const { pool } = require('../config/db');
const activityService = require('./activityService');

/**
 * Cutoff time checker for student meal participation.
 * Default cutoff rules:
 * - BREAKFAST: 07:00 (7 AM same day)
 * - LUNCH:     09:00 (9 AM same day)
 * - SNACKS:    14:00 (2 PM same day)
 * - DINNER:    17:00 (5 PM same day)
 *
 * @param {string} mealDate - 'YYYY-MM-DD'
 * @param {string} mealType - 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER'
 * @returns {boolean} true if cutoff has passed, false if still allowed
 */
const isCutoffPassed = (mealDate, mealType) => {
  const now = new Date();
  const targetDate = new Date(mealDate + 'T00:00:00');
  
  // Cutoff hour definitions (24h format)
    const cutoffHours = {
    BREAKFAST: 7,
    LUNCH: 9,
    DINNER: 17
  };

  const cutoffHour = cutoffHours[mealType] ?? 12;

  // Set the cutoff deadline date/time
  const cutoffTime = new Date(mealDate + 'T00:00:00');
  cutoffTime.setHours(cutoffHour, 0, 0, 0);

  // If targetDate is in the past (before today), cutoff has passed
  const todayStr = now.toISOString().split('T')[0];
  if (mealDate < todayStr) return true;

  // If targetDate is today, compare current time with cutoff time
  if (mealDate === todayStr) {
    return now.getTime() >= cutoffTime.getTime();
  }

  // Future dates are allowed
  return false;
};

class MessService {
  /**
   * Fetch menu items by hostel and/or date range.
   */
  static async getMenus({ hostelId, date, startDate, endDate, mealType }) {
    let sql = `
      SELECT m.id, m.hostel_id, DATE_FORMAT(m.menu_date, '%Y-%m-%d') as menu_date, m.meal_type, m.meal_name, m.description, m.is_available, m.created_by, m.created_at, m.updated_at, h.name as hostel_name, u.username as creator_name
      FROM mess_menus m
      LEFT JOIN hostels h ON m.hostel_id = h.id
      LEFT JOIN users u ON m.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (hostelId !== undefined && hostelId !== null) {
      sql += ` AND (m.hostel_id = ? OR m.hostel_id IS NULL)`;
      params.push(hostelId);
    }

    if (date) {
      sql += ` AND m.menu_date = ?`;
      params.push(date);
    } else if (startDate && endDate) {
      sql += ` AND m.menu_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    if (mealType) {
      sql += ` AND m.meal_type = ?`;
      params.push(mealType);
    }

    sql += ` ORDER BY m.menu_date ASC, FIELD(m.meal_type, 'BREAKFAST', 'LUNCH', 'DINNER')`;

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  /**
   * Get today's menu for a hostel.
   */
  static async getTodayMenu(hostelId) {
    const today = new Date().toISOString().split('T')[0];
    return this.getMenus({ hostelId, date: today });
  }

  /**
   * Get weekly menu starting from startDate or current week's Monday.
   */
  static async getWeeklyMenu(hostelId, startDate) {
    let monday;
    if (startDate) {
      monday = new Date(startDate);
    } else {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      monday = new Date(now.setDate(diff));
    }

    const startStr = monday.toISOString().split('T')[0];
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const endStr = sunday.toISOString().split('T')[0];

    const rows = await this.getMenus({ hostelId, startDate: startStr, endDate: endStr });
    return {
      startDate: startStr,
      endDate: endStr,
      items: rows
    };
  }

  /**
   * Get menu item by ID.
   */
  static async getMenuItemById(id) {
    const sql = `
      SELECT m.id, m.hostel_id, DATE_FORMAT(m.menu_date, '%Y-%m-%d') as menu_date, m.meal_type, m.meal_name, m.description, m.is_available, m.created_by, m.created_at, m.updated_at, h.name as hostel_name
      FROM mess_menus m
      LEFT JOIN hostels h ON m.hostel_id = h.id
      WHERE m.id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  }

  /**
   * Create a new menu item.
   * Validates duplicate (hostel_id, menu_date, meal_type).
   */
  static async createMenuItem({ hostelId, menuDate, mealType, mealName, description, isAvailable, createdBy }) {
    const validMealTypes = ['BREAKFAST', 'LUNCH', 'DINNER'];
    if (!validMealTypes.includes(mealType)) {
      throw new Error(`Invalid meal type: ${mealType}. Must be one of BREAKFAST, LUNCH, DINNER.`);
    }

    if (!mealName || !mealName.trim()) {
      throw new Error('Meal name is required.');
    }

    // Check for existing entry for same hostel/date/meal_type
    let dupCheckSql = `
      SELECT id FROM mess_menus
      WHERE menu_date = ? AND meal_type = ? AND (hostel_id = ? OR (hostel_id IS NULL AND ? IS NULL))
    `;
    const [existing] = await pool.query(dupCheckSql, [menuDate, mealType, hostelId || null, hostelId || null]);
    if (existing.length > 0) {
      throw new Error(`A ${mealType} menu already exists for this date and hostel.`);
    }

    const insertSql = `
      INSERT INTO mess_menus (hostel_id, menu_date, meal_type, meal_name, description, is_available, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(insertSql, [
      hostelId || null,
      menuDate,
      mealType,
      mealName.trim(),
      description ? description.trim() : null,
      isAvailable !== undefined ? (isAvailable ? 1 : 0) : 1,
      createdBy
    ]);

    const created = await this.getMenuItemById(result.insertId);

    await activityService.logActivity({
      actorId: createdBy,
      action: 'MENU_CREATED',
      module: 'MESS',
      entityType: 'MENU',
      entityId: result.insertId,
      hostelId: hostelId || null,
      description: `Created ${mealType} mess menu '${mealName.trim()}' for ${menuDate}`,
      metadata: { menu_date: menuDate, meal_type: mealType }
    });

    return created;
  }

  /**
   * Update menu item.
   */
  static async updateMenuItem(id, { mealName, description, isAvailable }, user) {
    const existing = await this.getMenuItemById(id);
    if (!existing) {
      throw new Error('Menu item not found.');
    }

    // Scope check: Superintendents can only update menus for assigned hostels (or general menus if assigned to at least one hostel)
    if (user.role === 'SUPERINTENDENT' && existing.hostel_id) {
      const [sh] = await pool.query(
        'SELECT 1 FROM superintendent_hostels WHERE user_id = ? AND hostel_id = ?',
        [user.id, existing.hostel_id]
      );
      if (sh.length === 0) {
        throw new Error('Unauthorized: You can only update menus for your assigned hostels.');
      }
    }

    const updateSql = `
      UPDATE mess_menus
      SET meal_name = COALESCE(?, meal_name),
          description = COALESCE(?, description),
          is_available = COALESCE(?, is_available)
      WHERE id = ?
    `;

    const availVal = isAvailable !== undefined ? (isAvailable ? 1 : 0) : null;
    await pool.query(updateSql, [
      mealName !== undefined ? mealName.trim() : null,
      description !== undefined ? description.trim() : null,
      availVal,
      id
    ]);

    await activityService.logActivity({
      actorId: user.id,
      action: 'MENU_UPDATED',
      module: 'MESS',
      entityType: 'MENU',
      entityId: id,
      hostelId: existing.hostel_id,
      description: `Updated ${existing.meal_type} mess menu #${id}`,
      metadata: { meal_type: existing.meal_type, is_available: availVal }
    });

    return this.getMenuItemById(id);
  }

  /**
   * Delete menu item.
   */
  static async deleteMenuItem(id, user) {
    const existing = await this.getMenuItemById(id);
    if (!existing) {
      throw new Error('Menu item not found.');
    }

    if (user.role === 'SUPERINTENDENT') {
      const [sh] = await pool.query(
        'SELECT 1 FROM superintendent_hostels WHERE user_id = ? AND hostel_id = ?',
        [user.id, existing.hostel_id]
      );
      if (sh.length === 0) {
        throw new Error('Unauthorized: You can only delete menus for your assigned hostels.');
      }
    }

    await pool.query('DELETE FROM mess_menus WHERE id = ?', [id]);
    return { success: true, id };
  }

  /**
   * Record or update student meal participation (TAKING / NOT_TAKING).
   * Enforces cutoff verification for student roles.
   */
  static async setMealParticipation({ studentId, hostelId, mealDate, mealType, status, isStudentRole = true }) {
    const validMealTypes = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
    if (!validMealTypes.includes(mealType)) {
      throw new Error(`Invalid meal type: ${mealType}.`);
    }

    const validStatus = ['TAKING', 'NOT_TAKING'];
    if (!validStatus.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be TAKING or NOT_TAKING.`);
    }

    // Cutoff check for student
    if (isStudentRole && isCutoffPassed(mealDate, mealType)) {
      throw new Error(`Cutoff time for ${mealType} on ${mealDate} has passed. Updates are no longer allowed.`);
    }

    const upsertSql = `
      INSERT INTO meal_attendance (student_id, hostel_id, meal_date, meal_type, status, marked_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE status = VALUES(status), marked_at = NOW()
    `;

    await pool.query(upsertSql, [studentId, hostelId, mealDate, mealType, status]);

    const [rows] = await pool.query(
      `SELECT * FROM meal_attendance WHERE student_id = ? AND meal_date = ? AND meal_type = ?`,
      [studentId, mealDate, mealType]
    );

    return rows[0];
  }

  /**
   * Get student's own meal participation history.
   */
  static async getStudentParticipation(studentId, { startDate, endDate, page = 1, limit = 20 }) {
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    let whereClause = `WHERE ma.student_id = ?`;
    const params = [studentId];

    if (startDate && endDate) {
      whereClause += ` AND ma.meal_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    const countSql = `SELECT COUNT(*) as total FROM meal_attendance ma ${whereClause}`;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0]?.total || 0;

    const dataSql = `
      SELECT ma.*, m.meal_name, m.description as menu_description
      FROM meal_attendance ma
      LEFT JOIN mess_menus m ON (ma.hostel_id = m.hostel_id OR m.hostel_id IS NULL) 
                             AND ma.meal_date = m.menu_date 
                             AND ma.meal_type = m.meal_type
      ${whereClause}
      ORDER BY ma.meal_date DESC, FIELD(ma.meal_type, 'BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER')
      LIMIT ${l} OFFSET ${offset}
    `;

    const [records] = await pool.query(dataSql, params);

    return {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
      records
    };
  }

  /**
   * Get hostel meal participation roster (Staff view).
   */
  static async getHostelParticipation({ hostelId, mealDate, mealType, status, page = 1, limit = 20, search }) {
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    let whereClause = `WHERE ma.hostel_id = ?`;
    const params = [hostelId];

    if (mealDate) {
      whereClause += ` AND ma.meal_date = ?`;
      params.push(mealDate);
    }

    if (mealType) {
      whereClause += ` AND ma.meal_type = ?`;
      params.push(mealType);
    }

    if (status) {
      whereClause += ` AND ma.status = ?`;
      params.push(status);
    }

    if (search && search.trim()) {
      whereClause += ` AND (s.full_name LIKE ? OR s.student_id LIKE ? OR s.roll_number LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const countSql = `
      SELECT COUNT(*) as total
      FROM meal_attendance ma
      JOIN students s ON ma.student_id = s.id
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0]?.total || 0;

    const dataSql = `
      SELECT ma.*, s.full_name as student_name, s.student_id as student_code, r.room_number
      FROM meal_attendance ma
      JOIN students s ON ma.student_id = s.id
      LEFT JOIN beds b ON s.bed_id = b.id
      LEFT JOIN rooms r ON b.room_id = r.id
      ${whereClause}
      ORDER BY ma.meal_date DESC, FIELD(ma.meal_type, 'BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'), s.full_name ASC
      LIMIT ${l} OFFSET ${offset}
    `;

    const [records] = await pool.query(dataSql, params);

    return {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
      records
    };
  }

  /**
   * Get mess summary & expected counts for today or specific date.
   */
  static async getMessSummary(hostelId, mealDate) {
    const targetDate = mealDate || new Date().toISOString().split('T')[0];

    // Total active students in this hostel
    let studentCountSql = `SELECT COUNT(*) as total FROM students s WHERE s.status = 'ACTIVE'`;
    const studentParams = [];
    if (hostelId) {
      studentCountSql = `SELECT COUNT(*) as total FROM students s JOIN beds b ON s.bed_id = b.id JOIN rooms r ON b.room_id = r.id WHERE s.status = 'ACTIVE' AND r.hostel_id = ?`;
      studentParams.push(hostelId);
    }

    const [studentRows] = await pool.query(studentCountSql, studentParams);
    const totalStudents = studentRows[0]?.total || 0;

    // Get menu for target date
    const menuItems = await this.getMenus({ hostelId, date: targetDate });

    // Get participation stats per meal
    let participationSql = `
      SELECT meal_type, status, COUNT(*) as count
      FROM meal_attendance
      WHERE meal_date = ?
    `;
    const partParams = [targetDate];
    if (hostelId) {
      participationSql += ` AND hostel_id = ?`;
      partParams.push(hostelId);
    }
    participationSql += ` GROUP BY meal_type, status`;

    const [partRows] = await pool.query(participationSql, partParams);

    const mealTypes = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
    const summary = {};

    mealTypes.forEach(type => {
      const takingRow = partRows.find(r => r.meal_type === type && r.status === 'TAKING');
      const notTakingRow = partRows.find(r => r.meal_type === type && r.status === 'NOT_TAKING');

      const taking = takingRow ? Number(takingRow.count) : 0;
      const notTaking = notTakingRow ? Number(notTakingRow.count) : 0;

      // Default assume taking unless explicitly marked NOT_TAKING
      const unselected = Math.max(0, totalStudents - (taking + notTaking));

      summary[type] = {
        mealType: type,
        taking,
        notTaking,
        unselected,
        totalActiveStudents: totalStudents,
        expectedMeals: taking + unselected, // Default opt-in if unselected
        menu: menuItems.find(m => m.meal_type === type) || null
      };
    });

    return {
      date: targetDate,
      hostelId: hostelId || 'ALL',
      totalStudents,
      meals: summary
    };
  }

  /**
   * Get basic mess analytics (participation percentages).
   */
  static async getMessAnalytics(hostelId, startDate, endDate) {
    const end = endDate || new Date().toISOString().split('T')[0];
    let start = startDate;
    if (!start) {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
    }

    let sql = `
      SELECT meal_type, status, COUNT(*) as count
      FROM meal_attendance
      WHERE meal_date BETWEEN ? AND ?
    `;
    const params = [start, end];
    if (hostelId) {
      sql += ` AND hostel_id = ?`;
      params.push(hostelId);
    }
    sql += ` GROUP BY meal_type, status`;

    const [rows] = await pool.query(sql, params);

    const mealTypes = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
    const analytics = {};

    mealTypes.forEach(type => {
      const taking = Number(rows.find(r => r.meal_type === type && r.status === 'TAKING')?.count || 0);
      const notTaking = Number(rows.find(r => r.meal_type === type && r.status === 'NOT_TAKING')?.count || 0);
      const total = taking + notTaking;
      const percentage = total > 0 ? parseFloat(((taking / total) * 100).toFixed(1)) : 100;

      analytics[type] = {
        taking,
        notTaking,
        totalResponses: total,
        participationPercentage: percentage
      };
    });

    return {
      startDate: start,
      endDate: end,
      hostelId: hostelId || 'ALL',
      analytics
    };
  }

  /**
   * Apply default 7-day food menu plan for a hostel or all hostels.
   */
  static async applyDefaultWeeklyPlan({ hostelId, startDate, createdBy }) {
    const DEFAULT_TEMPLATE = [
      {
        offset: 0,
        BREAKFAST: { name: 'Puri Sabzi & Boiled Egg / Banana', desc: 'Hot puris with spiced aloo chana sabzi, boiled egg or banana, and hot tea/coffee' },
        LUNCH: { name: 'Steamed Rice, Dal Tadka & Mix Veg', desc: 'Basmati rice, yellow dal tadka, seasonal mixed vegetables, crispy papad, salad and fresh curd' },
        DINNER: { name: 'Tawa Roti, Egg Curry / Paneer Butter Masala', desc: 'Fresh wheat rotis, rich egg curry or paneer butter masala, steamed rice, dal fry and pickle' }
      },
      {
        offset: 1,
        BREAKFAST: { name: 'Idli Sambar & Coconut Chutney', desc: 'Soft steamed idlis with piping hot vegetable sambar, fresh coconut chutney and tea/coffee' },
        LUNCH: { name: 'Rice, Dal Fry, Aloo Gobhi Matar & Salad', desc: 'Steamed rice, arhar dal fry, homestyle aloo gobhi matar sabzi, green salad and curd' },
        DINNER: { name: 'Roti, Veg Pulao, Dal Makhani & Sweet Kheer', desc: 'Soft rotis, aromatic veg pulao, creamy dal makhani, mix veg curry and sweet rice kheer' }
      },
      {
        offset: 2,
        BREAKFAST: { name: 'Aloo Paratha with Curd & Pickle', desc: 'Stuffed aloo parathas served with fresh curd, mango pickle, butter and hot masala chai' },
        LUNCH: { name: 'Rice, Odia Dalma & Bhindi Kurkuri', desc: 'Steamed rice, authentic vegetable dalma, crispy bhindi fry, papad, curd and lemon' },
        DINNER: { name: 'Roti, Chicken Curry / Shahi Paneer & Rice', desc: 'Hot rotis, special chicken curry or shahi paneer, jeera rice, dal tadka and onions' }
      },
      {
        offset: 3,
        BREAKFAST: { name: 'Uttapam / Masala Dosa with Sambar', desc: 'Crispy dosa / onion uttapam served with lentil sambar, tomato chutney and tea' },
        LUNCH: { name: 'Rice, Chana Dal & Aloo Baingan', desc: 'Steamed rice, chana dal fry, spiced aloo baingan bhaja, cucumber salad and fresh dahi' },
        DINNER: { name: 'Roti, Jeera Rice, Kadai Sabzi & Gulab Jamun', desc: 'Phulka rotis, jeera rice, seasonal kadai veg curry, dal fry, and warm gulab jamun' }
      },
      {
        offset: 4,
        BREAKFAST: { name: 'Poha with Peanuts, Sev & Boiled Egg / Fruit', desc: 'Indori poha garnished with roasted peanuts, coriander and sev, boiled egg or fruit, tea' },
        LUNCH: { name: 'Rice, Yellow Moong Dal, Soyabean Aloo Curry', desc: 'Steamed rice, yellow moong dal, soya chunks aloo curry, roasted papad and curd' },
        DINNER: { name: 'Roti, Egg Curry / Kadai Paneer, Rice & Dal', desc: 'Fresh wheat rotis, egg curry or kadai paneer, steamed rice, dal fry and green salad' }
      },
      {
        offset: 5,
        BREAKFAST: { name: 'Bread Butter Jam & Veg Cutlet / Omelette', desc: 'Toasted bread with butter & fruit jam, crispy vegetable cutlet or masala omelette, tea/coffee' },
        LUNCH: { name: 'Rice, Dal Makhani & Kashmiri Aloo Dum', desc: 'Steamed rice, rich dal makhani, Kashmiri aloo dum, cucumber tomato salad and curd' },
        DINNER: { name: 'Roti, Veg Fried Rice & Manchurian / Chilli Paneer', desc: 'Soft rotis, Indo-Chinese veg fried rice, veg manchurian gravy / chilli paneer, and soup' }
      },
      {
        offset: 6,
        BREAKFAST: { name: 'Chole Bhature & Masala Chai', desc: 'Fluffy bhaturas with Punjabi chole, sliced onions & green chillies, and special masala tea' },
        LUNCH: { name: 'Sunday Feast: Biryani / Chicken Curry / Shahi Paneer', desc: 'Weekend special biryani / ghee rice, chicken masala / shahi paneer, boondi raita, papad & sweet' },
        DINNER: { name: 'Roti, Special Bhog Khichdi, Aloo Bhaja & Ice Cream', desc: 'Light comfort dinner: Roti, special bhog khichdi / steamed rice, aloo bhaja, dal, and ice cream' }
      }
    ];

    let monday;
    if (startDate) {
      monday = new Date(startDate);
    } else {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      monday = new Date(now.setDate(diff));
    }

    const targetHostelId = hostelId ? parseInt(hostelId, 10) : null;
    let count = 0;

    for (const dayItem of DEFAULT_TEMPLATE) {
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + dayItem.offset);
      const dateStr = targetDate.toISOString().slice(0, 10);

      for (const mealType of ['BREAKFAST', 'LUNCH', 'DINNER']) {
        const mealInfo = dayItem[mealType];

        const dupCheckSql = `
          SELECT id FROM mess_menus
          WHERE menu_date = ? AND meal_type = ? AND (hostel_id = ? OR (hostel_id IS NULL AND ? IS NULL))
        `;
        const [existing] = await pool.query(dupCheckSql, [dateStr, mealType, targetHostelId, targetHostelId]);

        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO mess_menus (hostel_id, menu_date, meal_type, meal_name, description, is_available, created_by)
             VALUES (?, ?, ?, ?, ?, 1, ?)`,
            [targetHostelId, dateStr, mealType, mealInfo.name, mealInfo.desc, createdBy]
          );
        } else {
          await pool.query(
            `UPDATE mess_menus 
             SET meal_name = ?, description = ?, is_available = 1, created_by = ? 
             WHERE id = ?`,
            [mealInfo.name, mealInfo.desc, createdBy, existing[0].id]
          );
        }
        count++;
      }
    }

    await activityService.logActivity({
      actorId: createdBy,
      action: 'DEFAULT_MENU_APPLIED',
      module: 'MESS',
      entityType: 'MENU',
      entityId: targetHostelId || 0,
      hostelId: targetHostelId,
      description: `Applied default 7-day food menu plan for ${targetHostelId ? `hostel #${targetHostelId}` : 'all hostels'}`
    });

    return { success: true, count, hostelId: targetHostelId };
  }
}

module.exports = MessService;
