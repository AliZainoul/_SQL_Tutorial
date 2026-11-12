"""Replays every query shown in the course (verification/queries.json) on SQLite, PostgreSQL
and MySQL, then compares the results with the ones displayed in the HTML pages.
Configuration through environment variables (defaults match a local training setup):
  PG_DSN     e.g. "host=127.0.0.1 dbname=bookstore user=bookstore_user password=change_me_please"
  MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB, MYSQL_SOCKET (or MYSQL_HOST)
Requires: pip install psycopg2-binary pymysql
WARNING: the script RESETS the target databases (drops the bookstore tables). Use training databases only."""
import json, os, sqlite3, sys, datetime
from decimal import Decimal
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
REG = json.loads((ROOT/'verification/queries.json').read_text(encoding='utf8'))

def statements(sql):
    """Split on ';' outside quotes and -- comments (several statements may share a line)."""
    out, cur, q, i = [], [], None, 0
    while i < len(sql):
        ch = sql[i]
        if q:
            cur.append(ch)
            if ch == q: q = None
        elif ch in ("'", '"'): q = ch; cur.append(ch)
        elif sql.startswith('--', i):
            j = sql.find(chr(10), i); j = len(sql) if j < 0 else j
            cur.append(sql[i:j]); i = j; continue
        elif ch == ';':
            st = ''.join(cur).strip()
            if st: out.append(st)
            cur = []
        else: cur.append(ch)
        i += 1
    st = ''.join(cur).strip()
    if st and not all(l.strip().startswith('--') or not l.strip() for l in st.splitlines()): out.append(st)
    return out


def norm(v):
    if v is None: return None
    if isinstance(v, bool): return int(v)
    if isinstance(v, (Decimal, float)): return round(float(v), 2)
    if isinstance(v, (datetime.date, datetime.datetime)): return str(v)
    return v

class Engine:
    name = ''
    def run(self, sql):  # -> ('ERROR', None) or (cols, rows)
        cols, rows = [], []
        try:
            for st in statements(sql):
                cur = self.cur(); cur.execute(st)
                if cur.description: cols = [d[0] for d in cur.description]; rows = cur.fetchall()
        except Exception as e:
            return 'ERROR', str(e).splitlines()[0][:120]
        return cols, [[norm(v) for v in r] for r in rows]

class SQLite(Engine):
    name = 'sqlite'
    def __init__(s): s.reset()
    def cur(s): return s.db.cursor()
    def reset(s):
        s.db = sqlite3.connect(':memory:', isolation_level=None); s.db.executescript((ROOT/'sql/sqlite/02_schema.sql').read_text(encoding='utf8'))
        s.db.executescript((ROOT/'sql/sqlite/03_seed.sql').read_text(encoding='utf8')); s.db.execute('PRAGMA foreign_keys=ON')

class PG(Engine):
    name = 'postgresql'
    def __init__(s):
        import psycopg2
        s.mod = psycopg2; s.dsn = os.environ.get('PG_DSN', 'host=127.0.0.1 dbname=bookstore user=bookstore_user password=change_me_please')
        s.conn = psycopg2.connect(s.dsn); s.conn.autocommit = True; s.reset()
    def cur(s): return s.conn.cursor()
    def reset(s):
        c = s.conn.cursor(); c.execute('DROP TABLE IF EXISTS payments, order_items, orders, books, customers, categories CASCADE')
        c.execute('DROP TABLE IF EXISTS order_totals, order_totals_copy, publishers')
        for f in ('02_schema', '03_seed'): c.execute((ROOT/f'sql/postgresql/{f}.sql').read_text(encoding='utf8'))

class MySQL(Engine):
    name = 'mysql'
    def __init__(s):
        import pymysql
        kw = dict(user=os.environ.get('MYSQL_USER', 'root'), password=os.environ.get('MYSQL_PASSWORD', ''), database=os.environ.get('MYSQL_DB', 'bookstore'), autocommit=True, client_flag=pymysql.constants.CLIENT.MULTI_STATEMENTS)
        if os.environ.get('MYSQL_HOST'): kw['host'] = os.environ['MYSQL_HOST']
        else: kw['unix_socket'] = os.environ.get('MYSQL_SOCKET', '/var/run/mysqld/mysqld.sock')
        s.conn = pymysql.connect(**kw); s.reset()
    def cur(s): return s.conn.cursor()
    def reset(s):
        c = s.conn.cursor()
        for v in 'v_customer_totals,v_available_books,v_order_totals,v_unsold_books,v_customers_without_phone,v_le_titles,v_paris_newsletter,v_customer_spending,v_paid_orders'.split(','): c.execute(f'DROP VIEW IF EXISTS {v}')
        c.execute('DROP TEMPORARY TABLE IF EXISTS order_totals'); c.execute('DROP TABLE IF EXISTS publishers'); c.execute('SET FOREIGN_KEY_CHECKS=0'); c.execute('DROP TABLE IF EXISTS payments, order_items, orders, books, customers, categories'); c.execute('SET FOREIGN_KEY_CHECKS=1')
        for f in ('02_schema', '03_seed'):
            for st in statements((ROOT/f'sql/mysql/{f}.sql').read_text(encoding='utf8')): c.execute(st)

def main():
    engines = {}
    for cls in (SQLite, PG, MySQL):
        try: engines[cls.name] = cls()
        except Exception as e: print(f'[skip] {cls.name}: {e}')
    stats = {n: [0, 0, []] for n in engines}
    for q in REG:
        eng = engines.get(q['engine'])
        if not eng: continue
        cols, rows = eng.run(q['sql']); exp = q['expected']; ok = False
        if exp == 'ERROR': ok = (cols == 'ERROR')
        elif cols != 'ERROR':
            a, b = rows, exp['rows']; a = [list(r) for r in a]
            if not q['ordered']: a, b = sorted(a, key=repr), sorted(b, key=repr)
            ok = (a == b) and len(cols) == len(exp['cols'])
        stats[q['engine']][0 if ok else 1] += 1
        if not ok: stats[q['engine']][2].append((q['id'], q['sql'][:70].replace('\n', ' '), rows if cols == 'ERROR' else rows[:3]))
        if not q['sql'].lstrip().upper().startswith('SELECT'): eng.reset()
    bad = 0
    for n, (ok, ko, det) in stats.items():
        print(f'{n:11s} identical results: {ok:3d}   mismatches: {ko}'); bad += ko
        for d in det[:8]: print('   ✗', d)
    sys.exit(1 if bad else 0)
if __name__ == '__main__': main()
