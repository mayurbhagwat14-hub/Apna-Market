import React, { useState, useEffect } from 'react';
import NotificationBell from '../../../components/common/NotificationBell';
import { SearchLocationBar } from '../../../../../components/ui';

const SERVICE_HINTS = [
  'AC service and repair',
  'Washing machine services',
  'Cook / Maharaj',
  'Driver Booking',
  'Housekeeping',
  'Electrician',
  'Plumber',
  'Pest Control',
];

const SearchBar = ({ onInputClick }) => {
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setHintIndex((i) => (i + 1) % SERVICE_HINTS.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 min-w-0">
        <SearchLocationBar
          rotatingHints={SERVICE_HINTS}
          hintIndex={hintIndex}
          readOnly
          onClick={onInputClick}
          onFocus={onInputClick}
          className="cursor-pointer"
        />
      </div>
      <div className="shrink-0">
        <NotificationBell />
      </div>
    </div>
  );
};

export default SearchBar;
