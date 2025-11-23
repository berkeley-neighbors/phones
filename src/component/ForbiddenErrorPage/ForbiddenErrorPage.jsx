export const ForbiddenErrorPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="text-lg text-gray-600">
        <h1 className="text-2xl font-bold mb-4">Access Rejected</h1>
        <p>You are logged in but do not have permission to access this page.</p>
      </div>
    </div>
  );
};
