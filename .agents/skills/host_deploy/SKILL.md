---
name: host_deploy
description: Instructions and credentials for building and uploading the THCS Class Management application to the live web host (https://vie.info.vn/thcs/).
---

# Host Deployment Skill

## 1. Quick Upload Command
To build and deploy the project to the live web host, run:
```bash
python upload.py
```

## 2. Server & FTP Credentials
- **FTP Host**: `free02.123host.vn` (or `vie.info.vn`)
- **FTP User**: `thcs@vie.info.vn`
- **FTP Password**: `nguyendp`
- **Host Web Directory**: `/home/kjioxydi/public_html/thcs/`
- **Live URL**: `https://vie.info.vn/thcs/`

## 3. Deployment Safety Rules
- **NEVER** run `setup_db.php` during deployments. Table structures are maintained safely in `apps/api/public/index.php`.
- Deploying code updates assets without dropping or altering existing database tables.
