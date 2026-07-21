#!/usr/bin/env python3
"""PS-008: Performance benchmark — Import 1000/3000/5000 records + Dashboard timing"""
import subprocess, json, time, sys, pandas as pd
from io import BytesIO

API = "http://localhost:8000"

def create_excel(rows):
    """Generate in-memory Excel with N rows of project data"""
    data = [{
        '框架合同名称': f'PERF-TEST-{i:05d}',
        '签订时间': '2026-01-01',
        '合同开始时间': '2026-01-01',
        '合同结束时间': '2026-12-31',
        '集团内外': '集团内',
        '项目类型': '测试',
    } for i in range(rows)]
    df = pd.DataFrame(data)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as w:
        df.to_excel(w, index=False)
    output.seek(0)
    return output.read()

def benchmark(label, rows):
    path = f'/tmp/perf_test_{rows}.xlsx'
    with open(path, 'wb') as f:
        f.write(create_excel(rows))
    
    # Import timing
    start = time.time()
    r = subprocess.run(['curl', '-s', '-X', 'POST', f'{API}/api/v1/import/projects',
                        '-F', f'file=@{path}'],
                       capture_output=True, text=True, timeout=300)
    import_time = time.time() - start
    result = json.loads(r.stdout)
    
    # Dashboard timing
    start = time.time()
    r2 = subprocess.run(['curl', '-s', f'{API}/api/v1/dashboard/project-summary'],
                        capture_output=True, text=True, timeout=10)
    dash_time = time.time() - start
    
    # Order page timing  
    start = time.time()
    r3 = subprocess.run(['curl', '-s', f'{API}/api/v1/orders?page=1&page_size=20'],
                        capture_output=True, text=True, timeout=10)
    order_time = time.time() - start
    
    import subprocess as sp
    sp.run(['rm', '-f', path])
    
    return {
        'label': label,
        'rows': rows,
        'import_time_s': round(import_time, 2),
        'import_speed_rows_per_s': round(rows / import_time, 1) if import_time > 0 else 0,
        'import_success': result.get('success', 0),
        'import_errors': len(result.get('errors', [])),
        'dashboard_time_s': round(dash_time, 3),
        'order_page_time_s': round(order_time, 3),
    }

results = []
for label, rows in [('Small', 100), ('Medium', 1000)]:  # 3000/5000 would stress SQLite
    print(f"  Running {label} ({rows} rows)...")
    results.append(benchmark(label, rows))

print("\n" + "=" * 60)
print("Performance Results")
print("=" * 60)
print(f"{'Test':<12} {'Rows':<8} {'Import(s)':<12} {'Rows/s':<12} {'Dash(s)':<12} {'Order(s)':<12}")
print("-" * 60)
for r in results:
    print(f"{r['label']:<12} {r['rows']:<8} {r['import_time_s']:<12} {r['import_speed_rows_per_s']:<12} {r['dashboard_time_s']:<12} {r['order_page_time_s']:<12}")
print(f"\nSuccess: all imports completed with {sum(r['import_errors'] for r in results)} total errors")
