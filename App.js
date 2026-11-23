import React, { useEffect } from 'react';
import MainContainer from './navigation/MainContainer';
import { initDatabase } from './database/functions/DatabaseConnect';

function App() {
  useEffect(() => {
    initDatabase();
  }, []);

  return <MainContainer />;
}

export default App;
