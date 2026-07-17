import React from 'react';
import { _useContext } from 'react';
import { DataContext } from '../context/DataContext';

export const useData = () => {
  const context = React.useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
