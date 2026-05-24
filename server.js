const http = require('http');
const url = require('url');
const fs = require('fs');

const DB_FILE = './players.json';

function readDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({}));
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
}

function writeDatabase(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const query = parsedUrl.query;

    let db = readDatabase();

    if (path === '/register') {
        const { login, password } = query;
        if (!login || !password) {
            res.writeHead(400);
            return res.end(JSON.stringify({ success: false, message: "Поля не могут быть пустыми" }));
        }
        if (db[login]) {
            res.writeHead(200);
            return res.end(JSON.stringify({ success: false, message: "Логин уже занят!" }));
        }

        db[login] = { password: password, score: 0 };
        writeDatabase(db);

        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, message: "Регистрация успешна!" }));
    }

    if (path === '/login') {
        const { login, password } = query;
        if (db[login] && db[login].password === password) {
            res.writeHead(200);
            return res.end(JSON.stringify({ success: true, message: "Вход выполнен!", score: db[login].score }));
        }
        res.writeHead(200);
        return res.end(JSON.stringify({ success: false, message: "Неверный логин или пароль!" }));
    }

    if (path === '/save') {
        const { login, score } = query;
        if (db[login]) {
            db[login].score = parseInt(score) || 0;
            writeDatabase(db);
            res.writeHead(200);
            return res.end(JSON.stringify({ success: true }));
        }
        res.writeHead(404);
        return res.end(JSON.stringify({ success: false, message: "Игрок не найден" }));
    }

    if (path === '/leaderboard') {
        const playersArray = Object.keys(db).map(username => ({
            name: username,
            score: db[username].score
        }));
        const topPlayers = playersArray
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        res.writeHead(200);
        return res.end(JSON.stringify({ players: topPlayers }));
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Маршрут не найден" }));

}).listen(3000, "127.0.0.1", () => {
    console.log("Сервер базы данных запущен.");
});