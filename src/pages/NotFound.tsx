import React from "react";
import { Link } from "react-router-dom";
import { FiHome, FiAlertTriangle } from "react-icons/fi";
import { IconWrapper } from "../components/common/IconWrapper";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <IconWrapper icon={FiAlertTriangle} className="text-primary text-5xl" />
          </div>
        </div>

        <h1 className="mt-6 text-4xl font-bold text-heading">404</h1>
        <h2 className="mt-2 text-2xl font-medium text-heading">
          Page Not Found
        </h2>
        <p className="mt-4 text-subtext">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <div className="mt-8">
          <Link
            to="/"
            className="btn btn-primary flex items-center justify-center mx-auto w-48"
          >
            <IconWrapper icon={FiHome} className="mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
