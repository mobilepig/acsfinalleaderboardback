const dotenv = require("dotenv");
const { Pool } = require("pg");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
dotenv.config();
const port = 3001;

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// db secret
const mongDbSecret = {
  user: process.env.MONGO_USER,
  host: process.env.MONGO_HOST,
  database: process.env.MONGO_DATABASE,
  password: process.env.MONGO_PASSWORD,
  port: process.env.MONGO_PORT,
};

const uri = `mongodb://${mongDbSecret.user}:${mongDbSecret.password}@${mongDbSecret.host}:${mongDbSecret.port}`;
const dbName = mongDbSecret.database;

const pool = new Pool({
  user: process.env.POSTGRE_USER,
  host: process.env.POSTGRE_HOST,
  database: process.env.POSTGRE_DATABASE,
  password: process.env.POSTGRE_PASSWORD,
  port: process.env.POSTGRE_PORT, // PostgreSQL 포트 번호
  max: 20, // Connection Pool의 최대 연결 수
  idleTimeoutMillis: 30000, // 연결이 유휴 상태로 유지되는 시간 (밀리초)
});

//axios테스트
app.get("/testget", (req, res, next) => {
  res.json(JSON.stringify("리더보드 연결됐엉"));
});

app.post("/postest", (req, res) => {
  console.log(req.body);
  req.body.message = "리더보드 성공했어!";
  res.json(req.body);
});

app.get("/data", async (req, res, next) => {
  let client;
  try {
    client = await pool.connect();

    const likeQuery = `
      SELECT post_id, user_id, title, like_count, desti_name, revisit_count, area, travel_type, desti_type, thumbnail_url
      FROM posts
      ORDER BY like_count DESC
      LIMIT 10;
    `;

    const revisitQuery = `
      SELECT post_id, user_id, title, like_count, desti_name, revisit_count, area, travel_type, desti_type, thumbnail_url
      FROM posts
      ORDER BY revisit_count DESC
      LIMIT 10;
    `;

    const elderQuery = `
      SELECT post_id, user_id, title, like_count, desti_name, revisit_count, area, travel_type, desti_type, thumbnail_url
      FROM posts
      WHERE travel_type = 'elder'
      ORDER BY like_count DESC
      LIMIT 10;
    `;

    const kidQuery = `
    SELECT post_id, user_id, title, like_count, desti_name, revisit_count, area, travel_type, desti_type, thumbnail_url
    FROM posts
    WHERE travel_type = 'kid'
    ORDER BY like_count DESC
    LIMIT 10;
  `;

    const likeResult = await client.query(likeQuery);
    const revisitResult = await client.query(revisitQuery);
    const elderResult = await client.query(elderQuery);
    const kidResult = await client.query(kidQuery);
    console.log(likeResult.rows);
    // 결과를 JSON 형태로 클라이언트에 응답
    res.json({
      like: likeResult.rows,
      revisit: revisitResult.rows,
      elder: elderResult.rows,
      kid: kidResult.rows,
    });
  } catch (error) {
    console.error("Error executing query:", error.message);
    res.status(500).json({ error: "db error" });
  } finally {
    if (client) {
      client.release(); // 클라이언트 반환
    }
  }
});

// 애플리케이션이 종료될 때 풀을 명시적으로 종료
process.on("SIGINT", () => {
  pool.end().then(() => {
    console.log("Pool has ended");
    process.exit(0);
  });
});

app.listen(port, () => console.log("Server is running on : " + port));
