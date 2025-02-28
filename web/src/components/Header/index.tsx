import React from "react";

import { HeaderContainer } from "./styles";

export const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <div className="brand">
        <a href="/">Kebalu</a>
      </div>
    </HeaderContainer>
  );
};
