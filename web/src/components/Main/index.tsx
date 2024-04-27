import React, { useEffect, useState } from "react";
import axios from "axios";

import { Interfaces } from "../../../@types/interfaces";

import { MainContainer } from "./styles";
import { CreateTodo } from "../CreateTodo";
import { Todo } from "../Todo";

import config from "@web/outside-config/config.json";

export const Main: React.FC = () => {
  const [todos, setTodos] = useState<Interfaces.Todo[]>([]);

  const backend_url = `https://${config.backend_subdomain}.${config.domain_name}`;

  useEffect(() => {
    const fetchTodos = async () => {
      const response = await axios.get(backend_url);
      setTodos(response.data.todos);
    };

    fetchTodos();
  }, [backend_url]);

  const handleSubmit = async ({ new_todo }: { new_todo: Interfaces.Todo }) => {
    const response = await axios.post(backend_url, { todo: new_todo });

    if (response.data && response.data.todo) {
      setTodos((current_todos) => [...current_todos, response.data.todo]);
    }
  };

  const handleDelete = async (id: number) => {
    const reponse = await axios.delete(backend_url, {
      data: {
        id: id,
      },
    });

    setTodos((current_todos) => [
      ...current_todos.filter((todo) => todo.id !== id),
    ]);
  };

  const handleUpdate = async (todo: Interfaces.Todo) => {
    const response = await axios.put(backend_url, {
      todo,
    });

    setTodos((current_todos) => [
      ...current_todos.filter((t) => t.id !== todo.id),
      todo,
    ]);
  };

  const completed = todos.filter((todo) => todo.completed).length;

  return (
    <MainContainer>
      <h1>Today</h1>

      <CreateTodo handleTodoSumbit={handleSubmit} />

      <p>
        {completed}/{todos.length} completed
      </p>

      {todos.map((t) => {
        return (
          <Todo
            key={t.id}
            todo={t}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        );
      })}
    </MainContainer>
  );
};
