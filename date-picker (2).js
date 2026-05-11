services:
  - type: web
    name: sentinelx
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn server:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
    healthCheckPath: /api/health
    envVars:
      - key: SX_SECRET
        generateValue: true
      - key: SX_DB_PATH
        value: /opt/render/project/src/sentinelx.db
    disk:
      name: sentinelx-data
      mountPath: /opt/render/project/src
      sizeGB: 1
