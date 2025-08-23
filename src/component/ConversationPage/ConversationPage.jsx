import { useParams } from "react-router-dom"
import { Layout } from "../Layout/Layout"
import { useEffect, useState } from "react"
import { getTwilioMessages, sortByDate } from "../../js/getTwilioMessages"
import { MessageRows } from "../MessageRows/MessageRows"
import { APIContext } from "@/context/APIContext";
import { useContext } from "react";

export const ConversationPage = () => {
  const api = useContext(APIContext);
  const { number } = useParams()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ft = getTwilioMessages(api, {to: number})
    const tf = getTwilioMessages(api, {from: number})
    Promise.all([ft, tf])
      .then(msg => setMessages(msg.flat().sort(sortByDate)))
      .then(() => setLoading(false))
  }, [number])

  return (
    <Layout>
      <h3>Conversation</h3>
      <p className="my-4">
        Messages exchanged with <span className="font-semibold">{number}</span> 
      </p>
      <MessageRows messages={messages} loading={loading} />
    </Layout>
  )
}
