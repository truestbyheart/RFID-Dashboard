import './globals.d.ts'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ViewUsers from './Pages/Card/List';
import AccessLog from './Pages/Card/AccessLog';
import MainPanel from './Pages';
import AccessLogList from './Pages/Card/AccessLog/List';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<MainPanel />}>
        <Route path='users' element={<ViewUsers />}  />
        <Route path="logs">
          <Route path="all" element={<AccessLogList />} />
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
