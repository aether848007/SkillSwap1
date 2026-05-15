# SkillSwap — Production Deploy Runbook

Target: a single Ubuntu 24.04 VPS running Docker + a host nginx terminating TLS.

```
[ user ] ──HTTPS──▶ [ host nginx (TLS, certbot) ]
                         │
                         ├─▶ 127.0.0.1:8081  →  frontend container (SPA + /api proxy + /ws proxy)
                         │                            │
                         │                            └─▶ backend container (Spring Boot, internal)
                         │                                       │
                         │                                       └─▶ postgres container (internal)
                         │
                         └─▶ /actuator/health (proxied to backend, no auth)
```

The backend and Postgres are **not** exposed on the host. Only the frontend container's port `127.0.0.1:8081` is bound, and only the host nginx talks to it.

---

## One-time host setup

```bash
# 1. Base system
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx docker.io docker-compose-plugin certbot python3-certbot-nginx ufw

# 2. Firewall — only SSH + HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# 3. Deploy user with docker group
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy
sudo su - deploy
```

## First deploy

```bash
# 1. Clone the repo as the deploy user
git clone https://github.com/<you>/skillswap.git
cd skillswap

# 2. Create the .env from the example
cp .env.example .env

# 3. Fill in real values. The mandatory ones:
#   JWT_SECRET           — run: openssl rand -base64 48
#   DATABASE_PASSWORD    — strong random string
#   CORS_ALLOWED_ORIGINS — https://yourdomain.tld
#   VITE_API_BASE_URL    — leave as /api unless you split frontend/backend hosts
nano .env

# 4. Build and start the stack
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# 5. Watch it come up — backend takes ~15-30s to pass its healthcheck
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

## Host nginx vhost

Create `/etc/nginx/sites-available/skillswap`:

```nginx
server {
    listen 80;
    server_name yourdomain.tld;
    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # WebSocket upgrade headers — needed for STOMP at /ws
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
        client_max_body_size 12m;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/skillswap /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. TLS via Let's Encrypt (rewrites the vhost to add :443 + redirect)
sudo certbot --nginx -d yourdomain.tld
```

Certbot installs a systemd timer for auto-renewal — no further action needed.

## Promote the first admin

The seeded test users from `DataSeeder` only run under the `dev` profile, so production starts empty. Register yourself through the UI, then:

```bash
docker compose -f docker-compose.prod.yml exec db \
  psql -U $DATABASE_USERNAME -d skillswap \
  -c "UPDATE users SET role='ADMIN' WHERE email='you@yourdomain.tld';"
```

## Updates

```bash
cd ~/skillswap
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Flyway runs migrations on backend boot. Rollbacks: keep yesterday's Docker image tag and `docker compose up -d` against it; for DB rollbacks, restore from a `pg_dump` taken before the migration.

## Health & smoke checks

```bash
# Backend health (proxied through frontend nginx → backend actuator)
curl -s https://yourdomain.tld/actuator/health
# {"status":"UP"}

# Frontend loads
curl -sI https://yourdomain.tld/ | head -1
# HTTP/2 200

# WebSocket upgrade succeeds (SockJS will fall back, but the upgrade should not 502)
curl -sI -H "Upgrade: websocket" -H "Connection: Upgrade" https://yourdomain.tld/ws | head -1
```

Manual: register a user, add a skill, propose a swap with a second account, send a real-time message. The network tab should show `wss://yourdomain.tld/ws`.

## Backups

Postgres data lives in the `pgdata` named volume. Schedule a nightly dump via cron on the host:

```cron
30 3 * * * docker compose -f /home/deploy/skillswap/docker-compose.prod.yml exec -T db pg_dump -U skillswap skillswap | gzip > /home/deploy/backups/skillswap-$(date +\%F).sql.gz
```

Rotate the backup directory weekly with `find /home/deploy/backups -mtime +14 -delete`.

## Troubleshooting

- **Backend container restart-looping**: `docker compose logs backend`. Most often `JWT_SECRET` or `DATABASE_PASSWORD` is missing in `.env`. The app fails fast by design.
- **Flyway checksum mismatch on boot**: a migration file was edited after being applied. Either restore the file, or `DELETE FROM flyway_schema_history WHERE version = '<n>';` and let it re-apply (only safe if the migration is idempotent).
- **502 from nginx after deploy**: backend isn't healthy yet — the frontend container's `/api` proxy returns 502 during the ~30s cold-start window. Wait for `docker compose ps` to show `(healthy)`.
- **CORS errors in browser**: `CORS_ALLOWED_ORIGINS` in `.env` doesn't match the scheme+host the browser uses. Must be exact (no trailing slash).

## What runs where

| Concern | Default | Where to change |
|---|---|---|
| Log level | `INFO` | `application.yml`, override via `LOGGING_LEVEL_COM_SKILLSWAP=DEBUG` env var |
| JWT lifetime | 1 hour access / 7 day refresh | `application.yml` `jwt.expiration` |
| Avatar size cap | 8 MB upload, ~50 KB stored after frontend compression | `application.yml` `spring.servlet.multipart.max-file-size` |
| Allowed MIME for avatars | `image/jpeg`, `image/png`, `image/webp` | `UserController.ALLOWED_AVATAR_TYPES` |
| Match notification rate limit | 1 per user per 24 h | `SkillService` |
