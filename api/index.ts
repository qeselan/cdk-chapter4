import express from "express";
import { config } from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { init, execute } from "./connections";

config();

// docker run --name todolist-db -e POSTGRES_PASSWORD=testuser -e POSTGRES_USER=testuser -e POSTGRES_DB=todolist -p 5432:5432 -d postgres

const port = process.env.PORT || 80;
const table = "todolist";
const app = express();

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
  console.log("DEV LOGGING ENABLED");
} else {
  app.use(morgan("combined"));
  console.log("COMBINED LOGGING ENABLED");
}

app.use(cors());
app.use(express.json());

app.get("/health", async (_, res) =>
  res.status(200).send(JSON.stringify("OK"))
);

app.get("/", async (_, res) => {
  try {
    const sql = `SELECT * FROM ${table};`;
    const query_result = await execute(sql);

    return res.status(200).send({
      todos: query_result.rows,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).send({
      message: (error as any).message,
    });
  }
});

app.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const sql = `SELECT * FROM ${table} WHERE id = $1`;

    const query_result = await execute(sql, [id]);
    return res.status(200).send({
      todo: query_result.rows[0],
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      message: (error as any).message,
    });
  }
});

app.post("/", async (req, res) => {
  try {
    const { name, description, completed } = req.body.todo;

    const sql = `
    INSERT INTO ${table}
      (
        name,
        description,
        completed
      )
      VALUES
        (
          $1,
          $2,
          $3
        )
        RETURNING id, name, description, completed;
        `;

    const query_result = await execute(sql, [name, description, completed]);
    return res.status(200).send({
      msg: "New todo created.",
      todo: query_result.rows[0],
    });
  } catch (error) {
    console.log(error);

    return res.status(400).send({
      message: (error as any).message,
    });
  }
});

app.put("/", async (req, res) => {
  try {
    const { id, name, description, completed } = req.body.todo;
    console.log(req.body.todo);
    const sql = `
    UPDATE ${table}
    SET
      name = $2,
      description = $3,
      completed = $4
    WHERE id = $1
    RETURNING id, name, description, completed;
        `;

    const query_result = await execute(sql, [id, name, description, completed]);
    console.log(query_result);

    return res.status(200).send({
      msg: "Updated todo.",
      todo: query_result.rows[0],
    });
  } catch (error) {
    console.log(error);

    return res.status(400).send({
      message: (error as any).message,
    });
  }
});

app.delete("/", async (req, res) => {
  try {
    const id = req.body.id;
    const sql = `DELETE FROM ${table} WHERE id = $1`;

    await execute(sql, [id]);
    return res.status(200).send({
      msg: "Todo deleted.",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      message: (error as any).message,
    });
  }
});

app.listen(port, async () => {
  await init();
  console.info("Database pool initialized.");
  console.info(`API listening on port ${port}`);
});
