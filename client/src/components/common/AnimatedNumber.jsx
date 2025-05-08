 // client/src/components/common/AnimatedNumber.jsx
 import React, { useState, useEffect, useRef } from 'react';

 /**
  * Animates a number counting up from 0 to a target value when it becomes visible.
  * @param {object} props - Component props
  * @param {number} props.targetValue - The final number to count up to
  * @param {number} [props.duration=1500] - Animation duration in milliseconds
  */
 const AnimatedNumber = ({ targetValue, duration = 1500 }) => {
   const [currentValue, setCurrentValue] = useState(0);
   const numberRef = useRef(null); // Ref to attach the observer to
   const animationRef = useRef(null); // Ref to store animation frame ID
   const observerRef = useRef(null); // Ref to store the observer instance

   // Animation function using requestAnimationFrame
   const animateValue = (startTime) => {
     const now = performance.now();
     const elapsedTime = now - startTime;
     const progress = Math.min(elapsedTime / duration, 1); // Ensure progress doesn't exceed 1

     // Calculate the current value based on progress (simple linear easing)
     const value = Math.floor(progress * targetValue);
     setCurrentValue(value);

     // Continue animation if not finished
     if (progress < 1) {
       animationRef.current = requestAnimationFrame(() => animateValue(startTime));
     } else {
        setCurrentValue(targetValue); // Ensure final value is exact
     }
   };

   useEffect(() => {
     const targetElement = numberRef.current;

     // Callback function for Intersection Observer
     const handleIntersection = (entries) => {
       const [entry] = entries;
       if (entry.isIntersecting) {
         // Element is visible, start the animation
         console.log('Stat visible, starting animation to:', targetValue);
         const startTime = performance.now();
         animationRef.current = requestAnimationFrame(() => animateValue(startTime));

         // Stop observing once animation starts
         if (targetElement && observerRef.current) {
             observerRef.current.unobserve(targetElement);
         }
       }
     };

     // Create and start the observer
     observerRef.current = new IntersectionObserver(handleIntersection, {
       root: null, // Use viewport as root
       rootMargin: '0px',
       threshold: 0.1 // Trigger when 10% is visible
     });

     if (targetElement) {
       observerRef.current.observe(targetElement);
     }

     // Cleanup function
     return () => {
       // Stop animation frame if component unmounts during animation
       if (animationRef.current) {
         cancelAnimationFrame(animationRef.current);
       }
       // Disconnect observer
       if (targetElement && observerRef.current) {
         observerRef.current.unobserve(targetElement);
       }
     };
     // Rerun effect only if targetValue or duration changes (optional, usually not needed)
   }, [targetValue, duration]);

   return (
     // Attach the ref to the span element
     <span ref={numberRef} className="stat-number">
       {currentValue}+
     </span>
   );
 };

 export default AnimatedNumber;
 