export const ForbiddenErrorPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-lg text-gray-600">
        <h1 className="text-2xl font-bold mb-4">Access Rejected</h1>
        <p>Server is misconfigured. Please check with an admin.</p>
      </div>
    </div>
  )
}