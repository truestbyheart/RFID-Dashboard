import './globals.d.ts'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
// import Login from './Pages/Login/index';
// import AddCard from './Pages/Card/Add/';
import ViewUsers from './Pages/Card/List';
import AccessLog from './Pages/Card/AccessLog';
import MainPanel from './Pages';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<MainPanel />}>
        <Route path='users' element={<ViewUsers />} />
        <Route path="access-log">
          <Route path=":rfid" element={<AccessLog />} />
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
