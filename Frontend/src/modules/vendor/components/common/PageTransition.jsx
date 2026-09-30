import React from 'react';

/** Pass-through wrapper — avoid delayed route swaps that remount pages and duplicate API calls. */
const PageTransition = ({ children }) => children;

export default PageTransition;
