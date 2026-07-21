#!/usr/bin/env python3
"""PS-008: Business Flow E2E (corrected) — Contract→Order→Revenue→Cost→Collection→Payment→Dashboard"""
import subprocess, json, sys

API = "http://localhost:8000"
FAILURES = []

def api(method, path, data=None):
    cmd = ['curl', '-s', '-w', '\n%{http_code}', f'{API}{path}']
    if method == 'POST':
        cmd += ['-X', 'POST', '-H', 'Content-Type: application/json', '-d', json.dumps(data)]
    elif method == 'GET':
        pass
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    lines = r.stdout.strip().rsplit('\n', 1)
    http_code = lines[-1].strip()
    body = lines[0] if len(lines) > 1 else '{}'
    try: return json.loads(body), http_code
    except: return {'error': body[:200]}, http_code

def check(label, ok, detail=""):
    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] {label}" + (f" — {detail}" if detail else ""))
    if not ok: FAILURES.append(label)

print("=" * 60)
print("PS-008: Business Flow E2E")
print("=" * 60)

# ── 1. Create Contract ──
print("\n--- 1. Create Contract ---")
proj, code = api('POST', '/api/v1/projects', {
    'framework_name': 'PS-008-E2E-Contract',
    'contract_no': 'CT-PS008-001',
    'owner_name': 'PS-008-Owner',
    'contract_amount': 5000000,
    'sign_date': '2026-01-01',
    'start_date': '2026-01-01',
    'end_date': '2026-12-31',
    'internal_or_external': '集团内',
    'project_type': '工程施工',
})
pid = proj.get('id')
check("1.1 Contract created", code == '201' or code == '200', f"HTTP={code} id={pid}")
if pid:
    check("1.2 Contract amount", proj.get('contract_amount') == 5000000, f"got {proj.get('contract_amount')}")

# ── 2. Create Order ──
print("\n--- 2. Create Order ---")
ord_data, code = api('POST', '/api/v1/orders', {
    'project_id': str(pid or 1),
    'order_no': 'ORD-PS008-001',
    'order_name': 'PS-008 E2E Order',
    'amount': 1000000,
    'order_date': '2026-03-01',
    'order_type': '工程施工',
})
oid = ord_data.get('id')
check("2.1 Order created", code == '201' or code == '200', f"HTTP={code} id={oid}")

# ── 3. Create Revenue (IncomeFlow) ──
print("\n--- 3. Create Revenue ---")
if oid:
    inc, code = api('POST', f'/api/v1/orders/{oid}/incomes', {
        'taxable_amount': '500000',
        'non_taxable_amount': '458715.60',
        'tax_rate': 9,
        'invoice_date': '2026-04-01',
        'invoice_no': 'INV-PS008-001',
    })
    iid = inc.get('id')
    check("3.1 IncomeFlow created", code in ('200','201'), f"HTTP={code} id={iid}")
else:
    iid = None
    check("3.1 IncomeFlow created (skipped)", False, "no order id")

# ── 4. Create Cost (CostFlow) ──
print("\n--- 4. Create Cost ---")
if oid:
    cost, code = api('POST', f'/api/v1/orders/{oid}/costs', {
        'cost_type': '劳务',
        'taxable_amount': '200000',
        'non_taxable_amount': '194174.76',
        'tax_rate': 3,
    })
    costid = cost.get('id')
    check("4.1 CostFlow created", code in ('200','201'), f"HTTP={code} id={costid}")
else:
    costid = None

# ── 5. Create Collection ──
print("\n--- 5. Create Collection ---")
if oid and iid:
    coll, code = api('POST', f'/api/v1/collection/{oid}/incomes/{iid}', {
        'amount': '300000',
        'collection_date': '2026-05-01',
        'receipt_no': 'RCPT-PS008-001',
    })
    cid = coll.get('id')
    check("5.1 Collection created", code in ('200','201'), f"HTTP={code} id={cid}")

# ── 6. Create Payment ──
print("\n--- 6. Create Payment ---")
if oid and costid:
    pay, code = api('POST', f'/api/v1/payment/{oid}/costs/{costid}', {
        'amount': '200000',
        'payment_date': '2026-06-01',
        'payee': 'PS-008-Supplier',
        'voucher_no': 'VCH-PS008-001',
    })
    payid = pay.get('id')
    check("6.1 Payment created", code in ('200','201'), f"HTTP={code} id={payid}")

# ── 7. Dashboard verification ──
print("\n--- 7. Dashboard ---")
dash, code = api('GET', '/api/v1/dashboard/project-summary')
check("7.1 Dashboard responds", code == '200', f"HTTP={code}")
if isinstance(dash, list) and pid:
    our = [d for d in dash if d.get('project_id') == pid]
    if our:
        d = our[0]
        check("7.2 Dashboard total_income", d.get('total_income') is not None)
        check("7.3 Dashboard total_cost", d.get('total_cost') is not None)

# ── Summary ──
print(f"\n{'='*60}")
print(f"E2E: {len(FAILURES)} failure(s)")
for f in FAILURES: print(f"  FAIL: {f}")
sys.exit(len(FAILURES))
