import React from 'react';

interface NotFoundProps {
  message?: string;
}

const NotFound: React.FC<NotFoundProps> = ({ message = 'Not Found' }) => {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>{message}</p>
    </div>
  );
};

export default NotFound;
