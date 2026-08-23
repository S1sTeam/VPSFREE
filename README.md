# Web Console Safe (Railway)

Безопасная веб-консоль с паролем. **НЕ root** — специально.

### Почему не root?
- Railway запускает контейнеры от непривилегированного пользователя. Получить настоящий root хоста невозможно и это нарушает ToS.
- Открытый root в интернете = мгновенный взлом. Любой кто узнает домен получит полный контроль.

Эта версия работает от имени юзера контейнера, защищена Basic Auth.

### Переменные окружения (обязательно поменяй!)
- `WEB_USER` - логин (дефолт admin)
- `WEB_PASSWORD` - пароль (дефолт changeme123) — ОБЯЗАТЕЛЬНО задай свой!
- `PORT` - ставит Railway автоматически

### Деплой на Railway
1. `git init && git add . && git commit -m "init" && git push` в свой GitHub репозиторий
2. Railway -> New Project -> Deploy from GitHub repo
3. В Variables добавь WEB_USER и WEB_PASSWORD
4. Settings -> Networking -> Generate Domain

### Локально
```
npm install
WEB_PASSWORD=мой_сложный_пароль npm start
```

Открой http://localhost:3000 , введи логин/пароль.

### Если нужен настоящий VPS с root в NL
Используй нормальных провайдеров, а не PaaS:
- Hetzner (Финляндия/Германия, от 4€)
- Netcup, Contabo
- Oracle Cloud Free Tier (2 VPS бесплатно)

Там будет реальный root и SSH.
