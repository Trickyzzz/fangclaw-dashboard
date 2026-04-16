import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { DatabaseSync as DatabaseSyncType } from "node:sqlite";
import { CORE_FACTOR_TEMPLATES } from "./factorTemplateCatalog";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite") as {
  DatabaseSync: typeof import("node:sqlite").DatabaseSync;
};

type SqliteDb = DatabaseSyncType;

let sqliteDb: SqliteDb | null = null;
let initialized = false;

function resolveSqlitePath() {
  const url = process.env.DATABASE_URL ?? "";
  const rel = url.replace(/^sqlite:/, "").trim() || "./data/fangclaw.db";
  return path.isAbsolute(rel) ? rel : path.resolve(process.cwd(), rel);
}

function nowIso() {
  return new Date().toISOString();
}

function seedIfEmpty(db: SqliteDb) {
  const count = db.prepare("SELECT COUNT(1) AS count FROM companies").get() as { count: number };
  if ((count?.count ?? 0) > 0) return;

  const companies = [
    ["688981", "中芯国际", "晶圆代工", "中游", 10, JSON.stringify(["A股", "半导体"])],
    ["688256", "寒武纪", "AI芯片", "上游", 9, JSON.stringify(["A股", "AI芯片"])],
    ["000977", "浪潮信息", "AI服务器", "中游", 8, JSON.stringify(["A股", "服务器"])],
    ["NVDA", "NVIDIA", "GPU/AI芯片", "上游", 10, JSON.stringify(["美股", "GPU"])],
    ["TSM", "台积电", "晶圆代工", "中游", 9, JSON.stringify(["美股", "代工"])],
    ["ASML", "ASML", "光刻机", "上游", 8, JSON.stringify(["美股", "设备"])],
  ];
  const insertCompany = db.prepare(`
    INSERT INTO companies(symbol,name,sector,chainPosition,weight,tags,isActive,addedAt,lastChange)
    VALUES(?,?,?,?,?,?,1,?,?)
  `);
  for (const c of companies) {
    insertCompany.run(...c, nowIso(), nowIso());
  }

  const indicators = [
    [1, "央行货币政策信号", "宏观/政策", "监控货币政策变化", "normal"],
    [5, "AI算力需求指数", "中观/行业", "追踪AI算力需求变化", "normal"],
    [9, "营收增速(YoY)", "微观/公司", "监控公司营收同比", "normal"],
    [14, "动量因子(Momentum)", "因子/量价", "动量趋势跟踪", "normal"],
    [18, "重大合同/订单", "事件/催化", "重大订单监控", "normal"],
    [17, "资金流向因子", "资金行为", "主力资金净流入监控", "normal"],
  ];
  const insertIndicator = db.prepare(`
    INSERT INTO indicators(id,name,category,description,lastStatus,updatedAt,triggerCount)
    VALUES(?,?,?,?,?,?,0)
  `);
  for (const i of indicators) {
    insertIndicator.run(i[0], i[1], i[2], i[3], i[4], nowIso());
  }

  const keyVars = [
    ["美联储利率决议", "宏观政策", "降息25bp", "Bullish"],
    ["10Y美债利率", "宏观政策", "4.35%", "Bearish"],
  ];
  const insertKv = db.prepare(`
    INSERT INTO keyVariables(name,category,currentValue,signal,updatedAt,createdAt)
    VALUES(?,?,?,?,?,?)
  `);
  for (const kv of keyVars) {
    insertKv.run(kv[0], kv[1], kv[2], kv[3], nowIso(), nowIso());
  }

  const templates = [
    ["F01", "北向资金先知", "资金行为", 10],
    ["F02", "产能周期拐点", "中观/行业", 9],
  ];
  const insertTemplate = db.prepare(`
    INSERT INTO factorTemplates(code,name,category,priority,isActive,createdAt,updatedAt)
    VALUES(?,?,?,?,1,?,?)
  `);
  for (const t of templates) {
    insertTemplate.run(t[0], t[1], t[2], t[3], nowIso(), nowIso());
  }

  db.prepare(`
    INSERT INTO changeLogs(timestamp,action,message,createdAt)
    VALUES(?,?,?,?)
  `).run(Date.now(), "init", "SQLite 模式初始化完成", nowIso());
}

function ensureBaselineCompanies(db: SqliteDb) {
  const baselineCompanies = [
    ["688981", "中芯国际", "晶圆代工", "中游", 10, JSON.stringify(["A股", "半导体"])],
    ["688256", "寒武纪", "AI芯片", "上游", 9, JSON.stringify(["A股", "AI芯片"])],
    ["000977", "浪潮信息", "AI服务器", "中游", 8, JSON.stringify(["A股", "服务器"])],
    ["300557", "理工光科", "机器人/光纤传感", "中游", 7, JSON.stringify(["A股", "机器人", "传感"])],
    ["NVDA", "NVIDIA", "GPU/AI芯片", "上游", 10, JSON.stringify(["美股", "GPU"])],
    ["TSM", "台积电", "晶圆代工", "中游", 9, JSON.stringify(["美股", "代工"])],
    ["ASML", "ASML", "光刻机", "上游", 8, JSON.stringify(["美股", "设备"])],
  ];

  const insertCompany = db.prepare(`
    INSERT OR IGNORE INTO companies(symbol,name,sector,chainPosition,weight,tags,isActive,addedAt,lastChange)
    VALUES(?,?,?,?,?,?,1,?,?)
  `);

  for (const c of baselineCompanies) {
    insertCompany.run(...c, nowIso(), nowIso());
  }
}

function ensureBaselineFactorTemplates(db: SqliteDb) {
  const insertTemplate = db.prepare(`
    INSERT OR IGNORE INTO factorTemplates(
      code,name,nameEn,category,crossCategory,description,signalDefinition,
      dataSources,applicableMarkets,historicalWinRate,avgDurationDays,priority,isActive,createdAt,updatedAt
    )
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)
  `);

  for (const template of CORE_FACTOR_TEMPLATES) {
    insertTemplate.run(
      template.code,
      template.name,
      template.nameEn,
      template.category,
      template.crossCategory,
      template.description,
      template.signalDefinition,
      JSON.stringify(template.dataSources),
      JSON.stringify(template.applicableMarkets),
      template.historicalWinRate,
      template.avgDurationDays,
      template.priority,
      nowIso(),
      nowIso(),
    );
  }
}

function initSqlite(db: SqliteDb) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      sector TEXT,
      chainPosition TEXT NOT NULL,
      weight INTEGER NOT NULL DEFAULT 5,
      tags TEXT,
      addedAt TEXT NOT NULL,
      lastChange TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      latestPrice REAL,
      priceChange REAL,
      priceUpdatedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS indicators (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      threshold TEXT,
      example TEXT,
      dataSources TEXT,
      lastStatus TEXT NOT NULL DEFAULT 'normal',
      lastTriggeredAt TEXT,
      crossDimension TEXT,
      firstTriggeredAt TEXT,
      triggerCount INTEGER NOT NULL DEFAULT 0,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS changeLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      action TEXT NOT NULL,
      symbol TEXT,
      name TEXT,
      message TEXT,
      reason TEXT,
      evidenceId TEXT,
      oldWeight INTEGER,
      newWeight INTEGER,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS evidenceChains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evidenceId TEXT NOT NULL UNIQUE,
      sourceMessage TEXT NOT NULL,
      sourceType TEXT,
      sourceUrl TEXT,
      sourceTimestamp INTEGER,
      analysis TEXT,
      impacts TEXT,
      verificationQuestions TEXT,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS keyVariables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      nameEn TEXT,
      category TEXT NOT NULL,
      currentValue TEXT NOT NULL,
      triggerCondition TEXT,
      signal TEXT NOT NULL DEFAULT 'Neutral',
      impactNote TEXT,
      source TEXT,
      updatedAt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS factorTemplates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      nameEn TEXT,
      category TEXT NOT NULL,
      crossCategory TEXT,
      description TEXT,
      signalDefinition TEXT,
      dataSources TEXT,
      applicableMarkets TEXT,
      historicalWinRate REAL,
      avgDurationDays INTEGER,
      priority INTEGER NOT NULL DEFAULT 5,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS watchlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ownerKey TEXT NOT NULL,
      symbol TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      UNIQUE(ownerKey, symbol)
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      channel TEXT NOT NULL,
      channelAddress TEXT NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'daily',
      watchCompanies TEXT,
      watchDimensions TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS trials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact TEXT NOT NULL,
      contactType TEXT NOT NULL,
      startedAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      pushCount INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS shareTokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      evidenceId TEXT NOT NULL,
      sharedBy INTEGER,
      viewCount INTEGER NOT NULL DEFAULT 0,
      isActive INTEGER NOT NULL DEFAULT 1,
      expiresAt TEXT,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS dailyReports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reportDate TEXT NOT NULL UNIQUE,
      content TEXT,
      pushStatus TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL
    );
  `);
  seedIfEmpty(db);
  ensureBaselineCompanies(db);
  ensureBaselineFactorTemplates(db);
}

export function isSqliteMode() {
  return (process.env.DATABASE_URL ?? "").startsWith("sqlite:");
}

export function getSqlite() {
  if (!sqliteDb) {
    const filePath = resolveSqlitePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    sqliteDb = new DatabaseSync(filePath);
  }
  if (!initialized) {
    initSqlite(sqliteDb);
    initialized = true;
  }
  return sqliteDb;
}
