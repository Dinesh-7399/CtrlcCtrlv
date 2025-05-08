   // client/src/components/Layout/Footer.jsx
   import React from 'react';
   import { Link } from 'react-router-dom';
   import './Footer.css'; // We will create this CSS file
   import { FaFacebook, FaTwitter, FaLinkedin, FaGithub } from 'react-icons/fa'; // Social Icons

   const Footer = () => {
     const currentYear = new Date().getFullYear();

     return (
       <footer className="footer">
         <div className="footer-container">
           <div className="footer-section footer-about">
             <h4 className="footer-heading">LMS Platform</h4>
             <p>Empowering learners through accessible and high-quality online education.</p>
           </div>

           <div className="footer-section footer-links">
             <h4 className="footer-heading">Quick Links</h4>
             <ul>
               <li><Link to="/courses">Courses</Link></li>
               <li><Link to="/#features">Features</Link></li> {/* Example link to section */}
               <li><Link to="/register">Sign Up</Link></li>
               <li><Link to="/login">Login</Link></li>
             </ul>
           </div>

           <div className="footer-section footer-legal">
             <h4 className="footer-heading">Legal</h4>
             <ul>
               <li><Link to="/privacy-policy">Privacy Policy</Link></li> {/* Placeholder links */}
               <li><Link to="/terms-of-service">Terms of Service</Link></li>
               <li><Link to="/contact">Contact Us</Link></li>
             </ul>
           </div>

           <div className="footer-section footer-social">
             <h4 className="footer-heading">Follow Us</h4>
             <div className="social-icons">
               <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebook /></a>
               <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaTwitter /></a>
               <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
               <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub /></a>
             </div>
           </div>
         </div>

         <div className="footer-bottom">
           <p>&copy; {currentYear} LMS Platform. All rights reserved.</p>
         </div>
       </footer>
     );
   };

   export default Footer;
   