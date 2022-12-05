import React from "react";
import {
  BrowserRouter, Routes, Route
} from "react-router-dom";

// Area components
import './App.css'
import WithRouter from './Data'

export default function App() {
  
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path="/" element={<WithRouter/>} />
        <Route exact path="/CSN" element={<WithRouter/>}/> 
      </Routes>
    </BrowserRouter>
  );

}