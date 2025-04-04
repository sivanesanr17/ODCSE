// src/pages/InvitationResponse.js
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const InvitationResponse = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Processing your response...');
  const [heading, setHeading] = useState('Processing');
  const [icon, setIcon] = useState(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    const response = searchParams.get('response');

    if (error) {
      setIsError(true);
      setHeading('Error');
      setIcon(<XCircleIcon className="h-12 w-12 text-red-500 mx-auto" />);
      switch(error) {
        case 'invalid_params':
          setMessage('Invalid invitation link - missing parameters');
          break;
        case 'not_found':
          setMessage('Invitation not found or already responded');
          break;
        default:
          setMessage('An error occurred processing your response');
      }
    } else if (success) {
      setIsError(false);
      if (response === 'accept') {
        setHeading('Accepted');
        setMessage('Invitation accepted successfully!');
        setIcon(<CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto" />);
      } else {
        setHeading('Declined');
        setMessage('Invitation declined successfully');
        setIcon(<XCircleIcon className="h-12 w-12 text-red-500 mx-auto" />);
      }
      setTimeout(() => navigate('/'), 3000);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {icon}
        <h2 className="text-2xl font-bold mb-4 mt-2">
          {heading}
        </h2>
        <p className="mb-6">{message}</p>
        {isError && (
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Homepage
          </button>
        )}
      </div>
    </div>
  );
};

export default InvitationResponse;