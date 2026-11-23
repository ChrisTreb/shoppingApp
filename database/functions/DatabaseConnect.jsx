import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import { DEFAULT_PRODUCTS } from "../seedData";

// Web fallback mock storage in memory
class WebStorageMock {
  constructor() {
    const today = new Date().toISOString().slice(0, 10);
    this.products = DEFAULT_PRODUCTS.map((p, index) => ({
      id: index + 1,
      name: p.name,
      type: p.type,
      inCurrentList: p.inCurrentList,
      lastOrder: today,
      numOrdered: 0,
    }));
    this.nextProductId = this.products.length + 1;

    const activeItems = this.products.filter((p) => p.inCurrentList === 1);
    this.lists = [
      {
        id: 1,
        listName: "Mes premières courses",
        createdAt: today,
        products: JSON.stringify(activeItems),
        currentList: 1,
      },
    ];
    this.nextListId = 2;
  }

  execSync(sql) {}

  runSync(sql, params = []) {
    if (sql.includes("INSERT INTO productsLists")) {
      const id = this.nextListId++;
      this.lists.forEach((l) => (l.currentList = 0));
      this.lists.push({
        id,
        listName: params[0],
        createdAt: params[1],
        products: params[2] || "[]",
        currentList: params[3] ?? 1,
      });
      return { changes: 1, lastInsertRowId: id };
    }
    if (sql.includes("INSERT INTO products")) {
      const id = this.nextProductId++;
      this.products.push({
        id,
        name: params[0],
        type: params[1],
        lastOrder: params[2],
        inCurrentList: params[3] ?? 0,
        numOrdered: 0,
      });
      return { changes: 1, lastInsertRowId: id };
    }
    if (sql.includes("UPDATE productsLists SET currentList = 0")) {
      this.lists.forEach((l) => (l.currentList = 0));
      return { changes: this.lists.length };
    }
    if (sql.includes("UPDATE productsLists SET currentList = 1 WHERE id = ?")) {
      this.lists.forEach((l) => (l.currentList = l.id === params[0] ? 1 : 0));
      return { changes: 1 };
    }
    if (sql.includes("UPDATE products SET inCurrentList = 0")) {
      if (params.length > 0) {
        this.products.forEach((p) => {
          if (p.id === params[0]) p.inCurrentList = 0;
        });
      } else {
        this.products.forEach((p) => (p.inCurrentList = 0));
      }
      return { changes: this.products.length };
    }
    if (sql.includes("UPDATE products SET inCurrentList = 1 WHERE id = ?")) {
      this.products.forEach((p) => {
        if (p.id === params[0]) p.inCurrentList = 1;
      });
      return { changes: 1 };
    }
    if (sql.includes("DELETE FROM products WHERE id = ?")) {
      this.products = this.products.filter((p) => p.id !== params[0]);
      return { changes: 1 };
    }
    if (sql.includes("DROP TABLE IF EXISTS productsLists")) {
      this.lists = [];
      return { changes: 0 };
    }
    if (sql.includes("DROP TABLE IF EXISTS products")) {
      this.products = [];
      return { changes: 0 };
    }
    return { changes: 0 };
  }

  getAllSync(sql, params = []) {
    if (sql.includes("FROM productsLists")) {
      return [...this.lists];
    }
    if (sql.includes("FROM products WHERE inCurrentList = 1")) {
      return this.products.filter((p) => p.inCurrentList === 1);
    }
    if (sql.includes("FROM products")) {
      return [...this.products].sort((a, b) => a.type.localeCompare(b.type));
    }
    return [];
  }

  getFirstSync(sql, params = []) {
    if (sql.includes("COUNT(*) as count FROM products")) {
      return { count: this.products.length };
    }
    if (sql.includes("FROM productsLists WHERE currentList = 1")) {
      return this.lists.find((l) => l.currentList === 1) || null;
    }
    return null;
  }

  withTransactionSync(cb) {
    return cb();
  }
}

let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    if (Platform.OS === "web") {
      dbInstance = new WebStorageMock();
    } else {
      dbInstance = SQLite.openDatabaseSync("db.db");
      try {
        dbInstance.execSync("PRAGMA journal_mode = WAL;");
      } catch (e) {
        // WAL pragma safe to ignore
      }
    }
  }
  return dbInstance;
}

export function initDatabase() {
  const db = getDatabase();
  const today = new Date().toISOString().slice(0, 10);
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        inCurrentList INTEGER DEFAULT 0,
        lastOrder TIMESTAMP,
        numOrdered INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS productsLists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        listName VARCHAR(50) NOT NULL,
        createdAt TIMESTAMP,
        products TEXT,
        currentList INTEGER DEFAULT 0
      );
    `);

    // Check if products table is empty to seed initial supermarket catalog
    const countRow = db.getFirstSync("SELECT COUNT(*) as count FROM products");
    const count = countRow ? countRow.count : 0;

    if (count === 0) {
      db.withTransactionSync(() => {
        // Seed default supermarket catalog
        DEFAULT_PRODUCTS.forEach((p) => {
          db.runSync(
            "INSERT INTO products (name, type, lastOrder, inCurrentList, numOrdered) VALUES (?, ?, ?, ?, 0)",
            [p.name, p.type, today, p.inCurrentList]
          );
        });

        // Create an initial active shopping list with starter items
        const initialListProducts = db.getAllSync(
          "SELECT * FROM products WHERE inCurrentList = 1 ORDER BY type ASC, name ASC"
        );

        db.runSync(
          "INSERT INTO productsLists (listName, createdAt, products, currentList) VALUES (?, ?, ?, 1)",
          ["Mes premières courses", today, JSON.stringify(initialListProducts)]
        );
      });
    }
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

// Database Service operations with parameterized, safe queries
export const dbService = {
  // Get all products sorted by type
  getProducts() {
    const db = getDatabase();
    try {
      return db.getAllSync("SELECT * FROM products ORDER BY type ASC, name ASC");
    } catch (err) {
      console.error("dbService.getProducts error:", err);
      return [];
    }
  },

  // Get products currently in the active list
  getCurrentListProducts() {
    const db = getDatabase();
    try {
      return db.getAllSync("SELECT * FROM products WHERE inCurrentList = 1 ORDER BY type ASC, name ASC");
    } catch (err) {
      console.error("dbService.getCurrentListProducts error:", err);
      return [];
    }
  },

  // Get the active list
  getCurrentList() {
    const db = getDatabase();
    try {
      return db.getFirstSync("SELECT * FROM productsLists WHERE currentList = 1 LIMIT 1");
    } catch (err) {
      console.error("dbService.getCurrentList error:", err);
      return null;
    }
  },

  // Get all lists
  getAllLists() {
    const db = getDatabase();
    try {
      return db.getAllSync("SELECT * FROM productsLists ORDER BY id DESC");
    } catch (err) {
      console.error("dbService.getAllLists error:", err);
      return [];
    }
  },

  // Insert a new product
  insertProduct(name, type) {
    const db = getDatabase();
    const today = new Date().toISOString().slice(0, 10);
    try {
      return db.runSync(
        "INSERT INTO products (name, type, lastOrder, inCurrentList, numOrdered) VALUES (?, ?, ?, 0, 0)",
        [name.trim(), type.trim(), today]
      );
    } catch (err) {
      console.error("dbService.insertProduct error:", err);
      throw err;
    }
  },

  // Delete product by ID (safe from SQL injection)
  deleteProduct(id) {
    const db = getDatabase();
    try {
      return db.runSync("DELETE FROM products WHERE id = ?", [id]);
    } catch (err) {
      console.error("dbService.deleteProduct error:", err);
      throw err;
    }
  },

  // Insert a new list and make it the current active list
  createList(name) {
    const db = getDatabase();
    const today = new Date().toISOString().slice(0, 10);
    try {
      return db.withTransactionSync(() => {
        // Mark all lists as non-current
        db.runSync("UPDATE productsLists SET currentList = 0 WHERE currentList = 1");
        // Reset all products from current list
        db.runSync("UPDATE products SET inCurrentList = 0 WHERE inCurrentList = 1");
        // Insert new list with currentList = 1 and empty array
        return db.runSync(
          "INSERT INTO productsLists (listName, createdAt, products, currentList) VALUES (?, ?, ?, 1)",
          [name.trim(), today, "[]"]
        );
      });
    } catch (err) {
      console.error("dbService.createList error:", err);
      throw err;
    }
  },

  // Add product to the current list
  addProductToCurrentList(product) {
    const db = getDatabase();
    try {
      return db.withTransactionSync(() => {
        const currentList = db.getFirstSync("SELECT * FROM productsLists WHERE currentList = 1 LIMIT 1");
        if (!currentList) {
          throw new Error("NO_ACTIVE_LIST");
        }

        let productsArr = [];
        if (currentList.products) {
          try {
            const raw = currentList.products.trim();
            productsArr = raw.startsWith("[") ? JSON.parse(raw) : JSON.parse(`[${raw}]`);
          } catch (e) {
            productsArr = [];
          }
        }

        const alreadyExists = productsArr.some((p) => p.id === product.id);
        if (alreadyExists) {
          return { alreadyInList: true };
        }

        productsArr.push(product);

        // Update list JSON and mark product inCurrentList = 1
        db.runSync("UPDATE productsLists SET products = ? WHERE currentList = 1", [JSON.stringify(productsArr)]);
        db.runSync("UPDATE products SET inCurrentList = 1 WHERE id = ?", [product.id]);

        return { success: true };
      });
    } catch (err) {
      console.error("dbService.addProductToCurrentList error:", err);
      throw err;
    }
  },

  // Remove product from current list
  removeProductFromCurrentList(productId) {
    const db = getDatabase();
    try {
      return db.withTransactionSync(() => {
        db.runSync("UPDATE products SET inCurrentList = 0 WHERE id = ?", [productId]);

        const currentList = db.getFirstSync("SELECT * FROM productsLists WHERE currentList = 1 LIMIT 1");
        if (currentList && currentList.products) {
          try {
            const raw = currentList.products.trim();
            const productsArr = raw.startsWith("[") ? JSON.parse(raw) : JSON.parse(`[${raw}]`);
            const filtered = productsArr.filter((p) => p.id !== productId);
            db.runSync("UPDATE productsLists SET products = ? WHERE currentList = 1", [JSON.stringify(filtered)]);
          } catch (e) {
            // ignore JSON error
          }
        }
      });
    } catch (err) {
      console.error("dbService.removeProductFromCurrentList error:", err);
      throw err;
    }
  },

  // Switch to another list in a single atomic transaction
  switchList(listId, rawProducts) {
    const db = getDatabase();
    try {
      return db.withTransactionSync(() => {
        // Reset all products inCurrentList = 0
        db.runSync("UPDATE products SET inCurrentList = 0 WHERE inCurrentList = 1");

        // Deactivate previous current list
        db.runSync("UPDATE productsLists SET currentList = 0 WHERE currentList = 1");

        // Set target list as current
        db.runSync("UPDATE productsLists SET currentList = 1 WHERE id = ?", [listId]);

        // Parse products of target list and activate them
        let productsArr = [];
        if (rawProducts) {
          try {
            const raw = String(rawProducts).trim();
            productsArr = raw.startsWith("[") ? JSON.parse(raw) : JSON.parse(`[${raw}]`);
          } catch (e) {
            productsArr = [];
          }
        }

        if (productsArr.length > 0) {
          const ids = productsArr.map((p) => p.id).filter((id) => id !== undefined && id !== null);
          if (ids.length > 0) {
            const placeholders = ids.map(() => "?").join(",");
            db.runSync(`UPDATE products SET inCurrentList = 1 WHERE id IN (${placeholders})`, ids);
          }
        }
      });
    } catch (err) {
      console.error("dbService.switchList error:", err);
      throw err;
    }
  },

  // Batch import products from parsed CSV
  importProducts(items) {
    const db = getDatabase();
    const today = new Date().toISOString().slice(0, 10);
    let inserted = 0;
    let updated = 0;

    try {
      db.withTransactionSync(() => {
        items.forEach((item) => {
          if (!item.name || !item.name.trim()) return;
          const name = item.name.trim();
          const type = (item.type && item.type.trim()) || "Autres";

          const existing = db.getFirstSync(
            "SELECT id FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1",
            [name]
          );

          if (existing) {
            db.runSync(
              "UPDATE products SET type = ? WHERE id = ?",
              [type, existing.id]
            );
            updated++;
          } else {
            db.runSync(
              "INSERT INTO products (name, type, lastOrder, inCurrentList, numOrdered) VALUES (?, ?, ?, 0, 0)",
              [name, type, today]
            );
            inserted++;
          }
        });
      });
      return { inserted, updated };
    } catch (err) {
      console.error("dbService.importProducts error:", err);
      throw err;
    }
  },

  // Drop products table and reinit (re-seeds catalog)
  dropProductsTable() {
    const db = getDatabase();
    try {
      db.runSync("DROP TABLE IF EXISTS products");
      initDatabase();
    } catch (err) {
      console.error("dbService.dropProductsTable error:", err);
      throw err;
    }
  },

  // Drop lists table and reinit
  dropListsTable() {
    const db = getDatabase();
    try {
      db.withTransactionSync(() => {
        db.runSync("UPDATE products SET inCurrentList = 0 WHERE inCurrentList = 1");
        db.runSync("DROP TABLE IF EXISTS productsLists");
      });
      initDatabase();
    } catch (err) {
      console.error("dbService.dropListsTable error:", err);
      throw err;
    }
  },
};

export default getDatabase;
