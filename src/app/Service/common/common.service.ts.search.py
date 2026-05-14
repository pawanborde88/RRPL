
import sys

with open(r'd:\RRPL New\RRPL\Fontend\src\app\Service\common\common.service.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if 'project_id: number[],' in line:
            print(f"Match found at line {i+1}: {line.strip()}")
