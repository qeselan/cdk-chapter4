import React, { useState } from "react";

import { TodoActions, TodoBox, TodoContainer, TodoContent } from "./styles";
import { Interfaces } from "../../../@types/interfaces";

interface Props {
  todo: Interfaces.Todo;
  onUpdate: (todo: Interfaces.Todo) => void;
  onDelete: (id: number) => void;
}

export const Todo: React.FC<Props> = ({ todo, onUpdate, onDelete }: Props) => {
  const [checked, setChecked] = useState(todo.completed);

  const handleCheckBoxChange = () => {
    setChecked((prev) => {
      onUpdate({
        ...todo,
        completed: !prev,
      });
      return !prev;
    });
  };

  return (
    <TodoContainer>
      <input
        type="checkbox"
        name=""
        id=""
        checked={checked}
        onChange={handleCheckBoxChange}
      />

      <TodoBox>
        <TodoContent>
          <h1>{todo.name}</h1>
          <p>{todo.description}</p>
        </TodoContent>

        <TodoActions>
          <button
            type="button"
            onClick={() => {
              onDelete(todo.id as number);
            }}
          >
            Delete
          </button>
        </TodoActions>
      </TodoBox>
    </TodoContainer>
  );
};
