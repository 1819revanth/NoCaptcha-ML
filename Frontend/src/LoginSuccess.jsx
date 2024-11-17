import React from 'react';

const LoginSuccess = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-green-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-semibold text-center text-green-600">Login Successful!</h1>
        <p className="text-gray-700 text-center mt-4">
          Your registration was successful. You can now proceed to the dashboard.
        </p>
        <button
          onClick={() => (window.location.href = '/')}
          className="mt-6 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Go Back to Home
        </button>
      </div>
    </div>
  );
};

export default LoginSuccess;