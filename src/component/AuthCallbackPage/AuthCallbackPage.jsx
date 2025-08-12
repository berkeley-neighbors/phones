import { useEffect, useState } from "react"
import { Layout } from "../Layout/Layout"
import { ErrorLabel } from "../ErrorLabel/ErrorLabel"
import { useLocation, useNavigate } from "react-router-dom"

export const AuthCallbackPage = () => {
  const {hash} = useLocation();
  const navigate = useNavigate()

  const [error, setError] = useState(null)

  // #access_token=123&state=xyz
  const accessToken = new URLSearchParams(hash.replace("#", "")).get("access_token");
  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch(`/api/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ accessToken }),
        });
        
        if (!response.ok) {
          setError("Failed to register with the server");
          return;
        }
        
        navigate("/");
      } catch (e) {
        console.error("Error during registration:", e);
        setError("Failed to register with the server");
      }
    }
    run()
  }, []);


  return (
    <Layout>
      <h3>Registering Token</h3>
    
      <ErrorLabel error={error} className="mb-4" />
    </Layout>
  )
}
