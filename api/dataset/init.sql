CREATE TABLE IF NOT EXISTS Todolist (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  description VARCHAR(255),
  completed BOOLEAN
);

INSERT INTO
  Todolist (
    name,
    description,
    completed
  )
VALUES
  (
    'First todo',
    'That''s a todo for demonstration purposes',
    true
  );
