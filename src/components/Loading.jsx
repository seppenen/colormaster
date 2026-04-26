import React from 'react';

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen bg-stripe-light">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stripe-blue"></div>
  </div>
);

export default Loading;
