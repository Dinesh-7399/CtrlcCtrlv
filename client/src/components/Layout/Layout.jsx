 // client/src/components/Layout/Layout.jsx
 import React from 'react';
 import { Outlet } from 'react-router-dom';
 import Navbar from './Navbar';
 import Footer from './Footer'; // *** Import Footer ***
 // import Sidebar from './Sidebar';
 import './Layout.css';

 const Layout = () => {
   return (
     <div className="app-layout">
       <Navbar />
       <div className="main-content-area">
         {/* <Sidebar /> */}
         {/* --- Ensure main grows to push footer down --- */}
         <main className="page-content">
           <Outlet /> {/* Child route component renders here */}
         </main>
       </div>
       <Footer /> {/* *** Add Footer Here *** */}
     </div>
   );
 };

 export default Layout;
 