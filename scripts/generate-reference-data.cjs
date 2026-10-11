/*
 * Deterministic, fictional development fixtures. No source-system data or credentials.
 * Generate: node scripts/generate-reference-data.cjs
 * Seed SQL is non-destructive and idempotent; schema SQL targets a new database.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'database');
const reference = path.join(root, 'public', 'reference');
fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(reference, { recursive: true });
const stamp = '2026-10-11T00:00:00.000Z';
const seedId = 'public-v17';
// V1.7 framework serves public/ assets; old V1.6 Sites checkout used dist/.
const sourceDirectory = fs.existsSync(path.join(root, 'public', 'app.js')) ? 'public' : 'dist';
const sources = ['app.js', 'extensions.js'].map(file => {
  const source = fs.readFileSync(path.join(root, sourceDirectory, file), 'utf8');
  return { file, source, sha256: crypto.createHash('sha256').update(source).digest('hex') };
});
const mockNode = { value: '', style: {}, addEventListener() {}, remove() {} };
const context = vm.createContext({
  document: { querySelector: () => mockNode, querySelectorAll: () => [] },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  window: { addEventListener() {} },
  location: { search: '', href: 'https://example.invalid/' },
  history: { replaceState() {} }, structuredClone, URL, URLSearchParams,
  Blob, setTimeout, clearTimeout,
});
for (const { file, source } of sources) {
  // Strip invocation, retain function definitions and fixture construction.
  const stripped = source.replace(/window\.addEventListener\('popstate',loadURL\);loadURL\(\);/, '')
    .replace(/\brender\(\);\s*$/, '');
  vm.runInContext(stripped, context, { filename: file, timeout: 5000 });
}
const seed = JSON.parse(vm.runInContext('JSON.stringify(seed)', context));
const originalKeys = Object.keys(seed);
const regionIds = seed.regions.map(row => row.id);
// Cover the refund reversal branch that the older fixture did not exercise.
const refundable = seed.charges.find(row => row.id === 'C0-0');
if (!refundable || refundable.service !== 'S0') throw Error('Refund fixture source changed');
refundable.refunded = 30;
refundable.refundDate = '2026-10-10';
for (const ticket of seed.tickets) {
  if (ticket.status === '待分配') ticket.owner = '';
  else ticket.comments.push({ actor: seed.services.find(row => row.id === ticket.owner)?.name || '演示客服', date: ticket.date, body: ticket.status === '待补充' ? '已核对虚构资料，请补充演示订单编号。' : ticket.status === '已解决' ? '虚构问题已核对并给出处理说明，等待创建人关闭。' : '已受理虚构问题，正在核对关联数据。' });
}
seed.messages = seed.tickets.filter(row => row.owner).slice(0, 3).map((ticket, i) => ({ id: 'MSG-DEMO-' + (i + 1), owner: ticket.owner, title: '工单更新：' + ticket.title, regions: [ticket.region], source: '客服工单', date: ticket.date }));
// These fictional migrations predate every event in the fixture window. Current
// relationships remain untouched; event regions and reward rates stay snapshots.
seed.migrations = [
  { id: 'MIG-DEMO-1', agent: 'A1001', fromRegion: 'R1', toRegion: 'R0', service: 'S0', date: '2026-09-01', operator: 'HQ', reason: '虚构历史迁区示例，总部客服服务绑定保留', tea: ['T1', 'T2'] },
  { id: 'MIG-DEMO-2', agent: 'A1004', fromRegion: 'R2', toRegion: 'R3', service: 'S0', date: '2026-09-02', operator: 'HQ', reason: '虚构历史迁区示例，期间流水仍按事件快照归集', tea: ['T7', 'T8'] },
];
seed.logs = [{ time: '2026-10-11 08:00:00', actor: '总公司', account: 'HQ', action: 'V1.7 公开虚构示例初始化；未导入真实业务资料', regions: [...regionIds] }];
if (!originalKeys.every(key => Object.hasOwn(seed, key))) throw Error('Full seed key lost');

// One descriptor is the source for Drizzle, SQLite/D1 and MySQL definitions.
const col = (name, type, flags = {}) => ({ name, type, ...flags });
const id = () => col('id', 'id', { pk: true });
const required = (name, type = 'text', flags = {}) => col(name, type, { required: true, ...flags });
const foreign = (name, table, flags = {}) => col(name, 'id', { ref: [table, 'id'], ...flags });
const created = () => required('created_at', 'short', { default: stamp });
const tables = [
  { name: 'regions', columns: [id(), required('name', 'short'), required('wechat', 'short'), required('status', 'short'), created()] },
  { name: 'backend_accounts', columns: [id(), required('role', 'short'), required('login_account', 'short', { unique: true }), required('display_name', 'short'), required('status', 'short'), created()] },
  { name: 'managers', columns: [col('id', 'id', { pk: true, ref: ['backend_accounts', 'id'] }), required('name', 'short'), required('account', 'short', { unique: true }), required('game_id', 'short', { unique: true }), required('status', 'short')] },
  { name: 'manager_regions', columns: [foreign('manager_id', 'managers', { required: true }), foreign('region_id', 'regions', { required: true, unique: true })], pk: ['manager_id', 'region_id'] },
  { name: 'services', columns: [col('id', 'id', { pk: true, ref: ['backend_accounts', 'id'] }), required('name', 'short'), required('account', 'short', { unique: true }), required('game_id', 'short', { unique: true }), required('type', 'short'), foreign('region_id', 'regions'), required('reward_rate_bps', 'int', { default: 0 }), required('status', 'short')], checks: ['reward_rate_bps >= 0 AND reward_rate_bps <= 2000', "(type = '总部客服' AND region_id IS NULL) OR (type = '区域客服' AND region_id IS NOT NULL)"] },
  { name: 'agents', columns: [id(), required('name', 'short'), required('account', 'short', { unique: true }), required('game_id', 'short', { unique: true }), foreign('region_id', 'regions', { required: true }), foreign('service_id', 'services'), required('creator_label', 'short'), required('performance_owner', 'short'), required('status', 'short'), required('tea_quota', 'int'), required('tier', 'short'), required('cards', 'int')], checks: ['tea_quota >= 0', 'cards >= 0', "performance_owner IN ('company','region')"] },
  { name: 'tea_houses', columns: [id(), required('name', 'short'), foreign('agent_id', 'agents', { required: true }), foreign('region_id', 'regions', { required: true }), required('status', 'short')] },
  { name: 'players', columns: [id(), required('name', 'short'), required('status', 'short')] },
  { name: 'player_tea_memberships', columns: [foreign('player_id', 'players', { required: true }), foreign('tea_id', 'tea_houses', { required: true })], pk: ['player_id', 'tea_id'] },
  { name: 'rooms', columns: [id(), required('event_date', 'short'), foreign('region_id', 'regions', { required: true }), foreign('agent_id', 'agents', { required: true }), foreign('tea_id', 'tea_houses', { required: true }), required('game', 'short'), required('status', 'short'), required('rounds', 'int'), required('cards', 'int')], checks: ['rounds >= 0', 'cards >= 0'] },
  { name: 'room_players', columns: [foreign('room_id', 'rooms', { required: true }), foreign('player_id', 'players', { required: true })], pk: ['room_id', 'player_id'] },
  { name: 'charges', columns: [id(), required('event_date', 'short'), foreign('region_id', 'regions', { required: true }), foreign('agent_id', 'agents', { required: true }), foreign('tea_id', 'tea_houses'), foreign('player_id', 'players', { required: true }), required('amount_cents', 'cents'), foreign('service_id', 'services'), required('reward_rate_bps', 'int'), required('performance_owner', 'short'), required('status', 'short')], checks: ['amount_cents >= 0', 'reward_rate_bps >= 0 AND reward_rate_bps <= 2000'] },
  { name: 'refunds', columns: [id(), foreign('charge_id', 'charges', { required: true, unique: true }), required('event_date', 'short'), foreign('region_id', 'regions', { required: true }), foreign('agent_id', 'agents', { required: true }), required('amount_cents', 'cents'), required('status', 'short')], checks: ['amount_cents > 0'] },
  { name: 'rewards', columns: [id(), foreign('charge_id', 'charges', { required: true }), foreign('refund_id', 'refunds'), foreign('service_id', 'services', { required: true }), foreign('region_id', 'regions', { required: true }), required('event_date', 'short'), required('kind', 'short'), required('base_cents', 'cents'), required('rate_bps', 'int'), required('amount_cents', 'cents'), required('status', 'short')], checks: ['base_cents >= 0', 'rate_bps >= 0 AND rate_bps <= 2000', "kind IN ('accrual','refund_reversal')", "(kind = 'accrual' AND amount_cents >= 0 AND refund_id IS NULL) OR (kind = 'refund_reversal' AND amount_cents <= 0 AND refund_id IS NOT NULL)"] },
  { name: 'transfers', columns: [id(), required('event_date', 'short'), foreign('region_id', 'regions', { required: true }), foreign('agent_id', 'agents', { required: true }), required('game_id', 'short'), required('from_label', 'short'), required('to_label', 'short'), required('cards', 'int'), required('operator_label', 'short'), required('remark')], checks: ['cards >= 0'] },
  { name: 'migrations', columns: [id(), foreign('agent_id', 'agents', { required: true }), foreign('from_region_id', 'regions', { required: true }), foreign('to_region_id', 'regions', { required: true }), foreign('service_id', 'services'), foreign('operator_id', 'backend_accounts', { required: true }), required('event_date', 'short'), required('reason'), required('tea_ids_json', 'json')], checks: ['from_region_id <> to_region_id'] },
  { name: 'tickets', columns: [id(), required('title', 'short'), required('description'), foreign('region_id', 'regions', { required: true }), foreign('agent_id', 'agents', { required: true }), foreign('owner_id', 'services'), foreign('creator_id', 'backend_accounts', { required: true }), required('event_date', 'short'), required('status', 'short'), required('priority', 'short'), required('response_hours', 'int', { default: 24 }), required('resolve_days', 'int', { default: 3 })] },
  { name: 'ticket_comments', columns: [id(), foreign('ticket_id', 'tickets', { required: true }), required('actor_label', 'short'), required('event_date', 'short'), required('body')] },
  { name: 'announcements', columns: [id(), required('title', 'short'), required('body'), foreign('creator_id', 'backend_accounts', { required: true }), required('event_date', 'short'), required('status', 'short'), required('version', 'int')], checks: ['version >= 1'] },
  { name: 'announcement_regions', columns: [foreign('announcement_id', 'announcements', { required: true }), foreign('region_id', 'regions', { required: true })], pk: ['announcement_id', 'region_id'] },
  { name: 'messages', columns: [id(), foreign('owner_id', 'backend_accounts', { required: true }), required('title', 'short'), required('source', 'short'), required('event_date', 'short'), required('regions_json', 'json')] },
  { name: 'data_tasks', columns: [id(), required('name', 'short'), foreign('owner_id', 'backend_accounts', { required: true }), required('event_date', 'short'), required('status', 'short'), required('record_count', 'int'), required('note')], checks: ['record_count >= 0'] },
  { name: 'data_task_regions', columns: [foreign('task_id', 'data_tasks', { required: true }), foreign('region_id', 'regions', { required: true })], pk: ['task_id', 'region_id'] },
  { name: 'access_records', columns: [id(), foreign('owner_id', 'backend_accounts', { required: true }), required('event_date', 'short'), required('event_time', 'short'), required('result', 'short'), required('device', 'short'), required('source_label', 'short'), required('reason')] },
  { name: 'audit', columns: [id(), required('event_time', 'short'), required('actor_label', 'short'), required('account_label', 'short'), required('action'), required('regions_json', 'json')] },
  { name: 'system_config', columns: [col('key', 'id', { pk: true }), required('value_json', 'json'), required('version', 'int'), required('updated_at', 'short')] },
  { name: 'demo_snapshots', columns: [id(), required('data_json', 'json'), required('revision', 'int', { default: 0 }), required('updated_at', 'short')], checks: ['revision >= 0'] },
  { name: 'demo_seed_meta', columns: [col('key', 'id', { pk: true }), required('value')] },
];
const indexes = [
  ['agents', ['region_id', 'service_id']], ['tea_houses', ['region_id', 'agent_id']],
  ['rooms', ['region_id', 'event_date']], ['charges', ['region_id', 'event_date']],
  ['refunds', ['region_id', 'event_date']], ['rewards', ['service_id', 'event_date']],
  ['tickets', ['region_id', 'owner_id', 'status']], ['audit', ['event_time']],
];
const rows = Object.fromEntries(tables.map(table => [table.name, []]));
const add = (table, row) => rows[table].push(row);
const cents = value => {
  const result = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(result)) throw Error('Invalid integer amount');
  return result;
};
const bps = value => Math.round(Number(value) * 100);
for (const r of seed.regions) add('regions', { id: r.id, name: r.name, wechat: r.wechat, status: r.status, created_at: stamp });
add('backend_accounts', { id: 'HQ', role: 'hq', login_account: 'demo_hq', display_name: '总公司演示账号', status: '启用', created_at: stamp });
for (const m of seed.managers) {
  add('backend_accounts', { id: m.id, role: 'regional', login_account: m.account, display_name: m.name, status: m.status, created_at: stamp });
  add('managers', { id: m.id, name: m.name, account: m.account, game_id: m.gameId, status: m.status });
  for (const r of m.regions) add('manager_regions', { manager_id: m.id, region_id: r });
}
for (const s of seed.services) {
  add('backend_accounts', { id: s.id, role: s.type === '总部客服' ? 'service' : 'local', login_account: s.account, display_name: s.name, status: s.status, created_at: stamp });
  add('services', { id: s.id, name: s.name, account: s.account, game_id: s.gameId, type: s.type, region_id: s.region === 'all' ? null : s.region, reward_rate_bps: bps(s.rate), status: s.status });
}
for (const a of seed.agents) add('agents', { id: a.id, name: a.name, account: a.account, game_id: a.gameId, region_id: a.region, service_id: a.service || null, creator_label: a.creator, performance_owner: a.company ? 'company' : 'region', status: a.status, tea_quota: a.quota, tier: a.tier, cards: a.cards });
for (const t of seed.tea) add('tea_houses', { id: t.id, name: t.name, agent_id: t.agent, region_id: t.region, status: t.status });
for (const p of seed.players) {
  add('players', { id: p.id, name: p.name, status: p.status });
  for (const t of new Set(p.tea)) add('player_tea_memberships', { player_id: p.id, tea_id: t });
}
for (const r of seed.rooms) {
  add('rooms', { id: r.id, event_date: r.date, region_id: r.region, agent_id: r.agent, tea_id: r.tea, game: r.game, status: r.status, rounds: r.rounds, cards: r.cards });
  for (const p of new Set(r.players)) add('room_players', { room_id: r.id, player_id: p });
}
for (const c of seed.charges) {
  add('charges', { id: c.id, event_date: c.date, region_id: c.region, agent_id: c.agent, tea_id: c.tea || null, player_id: c.player, amount_cents: cents(c.amount), service_id: c.service || null, reward_rate_bps: bps(c.rate), performance_owner: c.company ? 'company' : 'region', status: c.status });
  if (c.refunded) add('refunds', { id: 'RF-' + c.id, charge_id: c.id, event_date: c.refundDate, region_id: c.region, agent_id: c.agent, amount_cents: cents(c.refunded), status: '成功' });
  if (c.rate > 0 && c.status === '成功') {
    add('rewards', { id: 'RW-' + c.id, charge_id: c.id, refund_id: null, service_id: c.service, region_id: c.region, event_date: c.date, kind: 'accrual', base_cents: cents(c.amount), rate_bps: bps(c.rate), amount_cents: Math.round(cents(c.amount) * bps(c.rate) / 10000), status: '待对账' });
    if (c.refunded) add('rewards', { id: 'RW-RF-' + c.id, charge_id: c.id, refund_id: 'RF-' + c.id, service_id: c.service, region_id: c.region, event_date: c.refundDate, kind: 'refund_reversal', base_cents: cents(c.refunded), rate_bps: bps(c.rate), amount_cents: -Math.round(cents(c.refunded) * bps(c.rate) / 10000), status: '待对账' });
  }
}
for (const t of seed.transfers) add('transfers', { id: t.id, event_date: t.date, region_id: t.region, agent_id: t.agent, game_id: t.gameId, from_label: t.from, to_label: t.to, cards: t.cards, operator_label: t.operator, remark: t.remark });
for (const m of seed.migrations) add('migrations', { id: m.id, agent_id: m.agent, from_region_id: m.fromRegion, to_region_id: m.toRegion, service_id: m.service, operator_id: m.operator, event_date: m.date, reason: m.reason, tea_ids_json: JSON.stringify(m.tea) });
for (const t of seed.tickets) {
  add('tickets', { id: t.id, title: t.title, description: t.description, region_id: t.region, agent_id: t.agent, owner_id: t.owner || null, creator_id: t.creator, event_date: t.date, status: t.status, priority: t.priority, response_hours: t.responseHours ?? 24, resolve_days: t.resolveDays ?? 3 });
  for (let i = 0; i < t.comments.length; i++) {
    const c = t.comments[i];
    add('ticket_comments', { id: t.id + '-COMMENT-' + i, ticket_id: t.id, actor_label: c.actor, event_date: c.date, body: c.body });
  }
}
for (const n of seed.announcements) {
  add('announcements', { id: n.id, title: n.title, body: n.body, creator_id: n.creator, event_date: n.date, status: n.status, version: n.version });
  for (const r of n.regions) add('announcement_regions', { announcement_id: n.id, region_id: r });
}
for (const m of seed.messages) add('messages', { id: m.id, owner_id: m.owner, title: m.title, source: m.source, event_date: m.date, regions_json: JSON.stringify(m.regions) });
for (const t of seed.tasks) {
  add('data_tasks', { id: t.id, name: t.name, owner_id: t.owner, event_date: t.date, status: t.status, record_count: t.count, note: t.note });
  for (const r of t.regions) add('data_task_regions', { task_id: t.id, region_id: r });
}
for (const a of seed.access) add('access_records', { id: a.id, owner_id: a.owner, event_date: a.date, event_time: a.time, result: a.result, device: a.device, source_label: a.source, reason: a.reason });
seed.logs.forEach((a, i) => add('audit', { id: 'AUDIT-SEED-' + i, event_time: a.time, actor_label: a.actor, account_label: a.account, action: a.action, regions_json: JSON.stringify(a.regions) }));
for (const [key, value] of Object.entries(seed.config)) add('system_config', { key, value_json: JSON.stringify(value), version: 1, updated_at: stamp });
add('demo_snapshots', { id: seedId, data_json: JSON.stringify(seed), revision: 0, updated_at: stamp });
add('demo_seed_meta', { key: 'seed-date', value: stamp });
add('demo_seed_meta', { key: 'public-v17-seeded', value: '1' });
// Last inserted marker: only a complete seed is allowed to advertise its version.
add('demo_seed_meta', { key: 'seed-version', value: 'v1.7' });

const q = name => '`' + name + '`';
const literal = (value, dialect = 'sqlite') => value === null ? 'NULL' : typeof value === 'number' ? String(value) : "'" + (dialect === 'mysql' ? String(value).replace(/\\/g, '\\\\') : String(value)).replace(/'/g, "''") + "'";
const camel = name => name.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const tableVar = name => camel(name);
const sqlType = (column, dialect) => dialect === 'sqlite' ? ['int', 'cents'].includes(column.type) ? 'INTEGER' : 'TEXT' : ({ id: 'VARCHAR(80)', short: 'VARCHAR(255)', text: 'TEXT', json: 'JSON', int: 'INT', cents: 'BIGINT' }[column.type]);
function createSql(dialect) {
  const lines = [dialect === 'sqlite' ? 'PRAGMA foreign_keys = ON;' : 'SET NAMES utf8mb4;', '-- Fictional V1.7 development reference. No database or user is created.'];
  for (const table of tables) {
    const body = table.columns.map(c => {
      let sql = `${q(c.name)} ${sqlType(c, dialect)}`;
      if (c.pk) sql += ' PRIMARY KEY';
      if (c.required || c.pk) sql += ' NOT NULL';
      if (c.unique) sql += ' UNIQUE';
      if (c.default !== undefined) sql += ' DEFAULT ' + literal(c.default);
      return sql;
    });
    if (table.pk) body.push('PRIMARY KEY (' + table.pk.map(q).join(', ') + ')');
    for (const c of table.columns.filter(c => c.ref)) body.push(`FOREIGN KEY (${q(c.name)}) REFERENCES ${q(c.ref[0])} (${q(c.ref[1])}) ON DELETE RESTRICT ON UPDATE RESTRICT`);
    for (let i = 0; i < (table.checks || []).length; i++) body.push(`CONSTRAINT ${q(table.name + '_check_' + i)} CHECK (${table.checks[i]})`);
    lines.push(`CREATE TABLE IF NOT EXISTS ${q(table.name)} (\n  ${body.join(',\n  ')}\n)${dialect === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin' : ''};`);
  }
  for (const [name, columns] of indexes) {
    // MySQL 8 has no CREATE INDEX IF NOT EXISTS; table-level indexes avoid that issue.
    if (dialect === 'sqlite') lines.push(`CREATE INDEX IF NOT EXISTS ${q(name + '_' + columns.join('_') + '_idx')} ON ${q(name)} (${columns.map(q).join(', ')});`);
  }
  if (dialect === 'mysql') {
    for (const [name, columns] of indexes) {
      const needle = `CREATE TABLE IF NOT EXISTS ${q(name)} (`;
      const i = lines.findIndex(line => line.startsWith(needle));
      lines[i] = lines[i].replace('\n) ENGINE=', `,\n  INDEX ${q(name + '_' + columns.join('_') + '_idx')} (${columns.map(q).join(', ')})\n) ENGINE=`);
    }
  }
  return lines.join('\n\n') + '\n';
}
function drizzleSchema() {
  const lines = ['// Generated by scripts/generate-reference-data.cjs; change its table descriptors.', 'import { sql } from "drizzle-orm";', 'import { sqliteTable, text, integer, primaryKey, index, check } from "drizzle-orm/sqlite-core";', ''];
  for (const table of tables) {
    lines.push(`export const ${tableVar(table.name)} = sqliteTable(${JSON.stringify(table.name)}, {`);
    for (const c of table.columns) {
      let decl = `${['int', 'cents'].includes(c.type) ? 'integer' : 'text'}(${JSON.stringify(c.name)})`;
      if (c.pk) decl += '.primaryKey()';
      if (c.required || c.pk) decl += '.notNull()';
      if (c.unique) decl += '.unique()';
      if (c.default !== undefined) decl += `.default(${JSON.stringify(c.default)})`;
      if (c.ref) decl += `.references(() => ${tableVar(c.ref[0])}.${camel(c.ref[1])}, { onDelete: "restrict", onUpdate: "restrict" })`;
      lines.push(`  ${camel(c.name)}: ${decl},`);
    }
    const extra = [];
    if (table.pk) extra.push(`primaryKey({ columns: [${table.pk.map(name => 'table.' + camel(name)).join(', ')}] })`);
    for (const [name, columns] of indexes.filter(([name]) => name === table.name)) extra.push(`index(${JSON.stringify(name + '_' + columns.join('_') + '_idx')}).on(${columns.map(name => 'table.' + camel(name)).join(', ')})`);
    for (let i = 0; i < (table.checks || []).length; i++) {
      const expr = table.checks[i].replace(/\b[a-z][a-z_]+\b/g, name => table.columns.some(c => c.name === name) ? '${table.' + camel(name) + '}' : name);
      extra.push(`check(${JSON.stringify(table.name + '_check_' + i)}, sql\`${expr}\`)`);
    }
    lines.push(extra.length ? `}, (table) => [\n  ${extra.join(',\n  ')},\n]);` : '});');
    lines.push('');
  }
  return lines.join('\n');
}
const statements = [];
function seedSql(dialect) {
  const lines = ['-- Fictional V1.7 fixtures; integer money = CNY cents, rate = basis points (3% = 300).', '-- Re-import retains existing rows. Import schema first into an empty development database.', dialect === 'sqlite' ? 'PRAGMA foreign_keys = ON;\nBEGIN TRANSACTION;' : 'SET NAMES utf8mb4;\nSTART TRANSACTION;'];
  for (const table of tables) {
    lines.push(`\n-- ${table.name}: ${rows[table.name].length} rows`);
    for (const row of rows[table.name]) {
      const columns = table.columns.map(c => c.name);
      const params = columns.map(name => row[name] === undefined ? null : row[name]);
      const verb = dialect === 'sqlite' ? 'INSERT OR IGNORE' : 'INSERT IGNORE';
      lines.push(`${verb} INTO ${q(table.name)} (${columns.map(q).join(', ')}) VALUES (${params.map(value => literal(value, dialect)).join(', ')});`);
    }
  }
  lines.push('\nCOMMIT;');
  return lines.join('\n') + '\n';
}
function buildBoundStatements() {
  for (const table of tables) {
    const columns = table.columns.map(c => c.name);
    let params = [], numbers = new Map(), values = [];
    const flush = () => {
      if (!values.length) return;
      statements.push({ sql: `INSERT OR IGNORE INTO ${q(table.name)} (${columns.map(q).join(', ')}) VALUES ${values.join(', ')}`, params });
      params = []; numbers = new Map(); values = [];
    };
    for (const row of rows[table.name]) {
      const incoming = columns.map(name => row[name] === undefined ? null : row[name]);
      const keyOf = value => typeof value + ':' + JSON.stringify(value);
      const extras = new Set(incoming.map(keyOf).filter(key => !numbers.has(key)));
      if (params.length + extras.size > 90) flush();
      const placeholders = incoming.map(value => {
        const key = keyOf(value);
        if (!numbers.has(key)) { params.push(value); numbers.set(key, params.length); }
        return '?' + numbers.get(key);
      });
      values.push('(' + placeholders.join(', ') + ')');
    }
    flush();
  }
}
// Validate all IDs and relationship columns before creating deliverables.
for (const table of tables) {
  const seen = new Set();
  for (const row of rows[table.name]) {
    for (const c of table.columns) {
      if ((c.required || c.pk) && row[c.name] == null) throw Error(`Missing ${table.name}.${c.name}`);
      if (c.ref && row[c.name] != null && !rows[c.ref[0]].some(parent => parent[c.ref[1]] === row[c.name])) throw Error(`Invalid FK ${table.name}.${c.name}=${row[c.name]}`);
      if (['int', 'cents'].includes(c.type) && row[c.name] != null && !Number.isSafeInteger(row[c.name])) throw Error(`Not integer ${table.name}.${c.name}`);
    }
    const pks = table.pk || table.columns.filter(c => c.pk).map(c => c.name);
    const key = JSON.stringify(pks.map(name => row[name]));
    if (seen.has(key)) throw Error(`Duplicate key ${table.name} ${key}`);
    seen.add(key);
  }
}
fs.writeFileSync(path.join(root, 'db', 'schema.ts'), drizzleSchema());
fs.writeFileSync(path.join(output, 'schema.sqlite.sql'), createSql('sqlite'));
fs.writeFileSync(path.join(output, 'schema.mysql8.sql'), createSql('mysql'));
fs.writeFileSync(path.join(output, 'seed.sqlite.sql'), seedSql('sqlite'));
fs.writeFileSync(path.join(output, 'seed.mysql8.sql'), seedSql('mysql'));
buildBoundStatements();
const counts = Object.fromEntries(tables.map(table => [table.name, rows[table.name].length]));
fs.writeFileSync(path.join(output, 'seed-statements.json'), JSON.stringify({ version: 'v1.7', seedId, completedKey: 'seed-version', completedValue: 'v1.7', statements, counts }, null, 2) + '\n');
fs.writeFileSync(path.join(reference, 'seed.json'), JSON.stringify(seed, null, 2) + '\n');
for (const file of ['schema.sqlite.sql', 'schema.mysql8.sql', 'seed.sqlite.sql', 'seed.mysql8.sql']) fs.copyFileSync(path.join(output, file), path.join(reference, file));
for (const [source, alias] of [['schema.sqlite.sql', 'sqlite-schema.sql'], ['seed.sqlite.sql', 'sqlite-seed.sql'], ['schema.mysql8.sql', 'mysql-schema.sql'], ['seed.mysql8.sql', 'mysql-seed.sql']]) {
  fs.copyFileSync(path.join(output, source), path.join(reference, alias));
}
const manifest = { version: '1.7', fixtureDate: stamp, seedId, fictional: true, sourceDirectory, originalSeedKeys: originalKeys, seedKeys: Object.keys(seed), sourceHashes: sources.map(({ file, sha256 }) => ({ file, sha256 })), tables: counts, totalRows: Object.values(counts).reduce((a, b) => a + b, 0), eventWindow: { from: Math.min(...seed.rooms.map(row => Date.parse(row.date))), to: Math.max(...seed.rooms.map(row => Date.parse(row.date))) }, moneyUnit: 'CNY cents (integer)', rateUnit: 'basis points (integer)', mysqlValidation: 'SQL generated only; no MySQL runtime execution claimed' };
manifest.eventWindow = Object.fromEntries(Object.entries(manifest.eventWindow).map(([key, value]) => [key, new Date(value).toISOString().slice(0, 10)]));
fs.writeFileSync(path.join(output, 'seed-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(reference, 'seed-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const dictionary = ['# V1.7 虚构数据字典', '', '金额均以整数分存储；比例均以整数基点存储（3% = 300）。业务事件保留发生时的区域、客服及比例快照。', '', '公开角色切换仅用于演示，不构成生产认证。下面的规范化表是开发参考，真实系统对接仍需由接口执行权限和业务校验。', ''];
for (const table of tables) {
  dictionary.push(`## ${table.name}（${counts[table.name]} 条）`, '', '| 字段 | SQLite类型 | 必填 | 关系 / 约束 |', '|---|---|---|---|');
  for (const c of table.columns) dictionary.push(`| ${c.name} | ${sqlType(c, 'sqlite')} | ${(c.required || c.pk) ? '是' : '否'} | ${[c.pk ? '主键' : '', c.unique ? '唯一' : '', c.ref ? `${c.ref[0]}.${c.ref[1]}` : '', c.default !== undefined ? '默认 ' + c.default : ''].filter(Boolean).join('；') || '—'} |`);
  if (table.pk) dictionary.push('', '联合主键：' + table.pk.join(' + '));
  if (table.checks) dictionary.push('', '检查约束：' + table.checks.map(check => '`' + check + '`').join('；'));
  dictionary.push('');
}
fs.writeFileSync(path.join(output, 'data-dictionary.md'), dictionary.join('\n') + '\n');
console.log(JSON.stringify({ seedId, counts, totalRows: manifest.totalRows, seedKeys: manifest.seedKeys }, null, 2));
