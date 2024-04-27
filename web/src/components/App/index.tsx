import React from "react";
import { AppContainer, MainSection } from "./styles";
import { Header } from "../Header";
import { Main } from "../Main";
import { Sidebar } from "../Sidebar";

export const App: React.FC = () => {
  return (
    <AppContainer>
      <Header />
      <MainSection>
        <Sidebar />
        <Main />
      </MainSection>
    </AppContainer>
  );
};
