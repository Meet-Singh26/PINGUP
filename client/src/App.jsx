import { Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Feed from "./pages/Feed.jsx";
import Messages from "./pages/Messages.jsx";
import ChatBox from "./pages/ChatBox.jsx";
import Connections from "./pages/Connections.jsx";
import Discover from "./pages/Discover.jsx";
import Profile from "./pages/Profile.jsx";
import CreatePost from "./pages/CreatePost.jsx";
import Layout from "./pages/Layout.jsx";
import { useUser, useAuth } from "@clerk/clerk-react";
import toast, { Toaster } from "react-hot-toast";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { fetchUser } from "./features/user/userSlice.js";
import { fetchConnections } from "./features/connections/connectionsSlice.js";
import { addMessage } from "./features/messages/messagesSlice.js";
import Notification from "./components/Notification.jsx";

function App() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const token = await getToken();
        dispatch(fetchUser(token));
        dispatch(fetchConnections(token));
      }
    };
    fetchData();
  }, [user, getToken, dispatch]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let eventSource;

    const setupEventSource = () => {
      if (user) {
        eventSource = new EventSource(
          `${import.meta.env.VITE_BASEURL}/api/messages/${user.id}`
        );

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Handle different event types
            if (data.type === "new_message") {
              // Check if message is relevant to current chat
              const isCurrentChat =
                pathnameRef.current ===
                  `/messages/${data.message.from_user_id._id}` ||
                pathnameRef.current ===
                  `/messages/${data.message.to_user_id._id}`;

              if (!isCurrentChat) {
                toast.custom(
                  (t) => <Notification t={t} message={data.message} />,
                  { position: "bottom-right" }
                );
              }

              // Always add to Redux store
              dispatch(addMessage(data.message));
            } else if (data.type === "ping") {
              // Handle keep-alive pings
              console.log("SSE ping received");
            }
          } catch (error) {
            console.error("Error processing SSE event:", error);
          }
        };

        eventSource.onerror = () => {
          console.log("SSE connection error, reconnecting...");
          eventSource.close();
          setTimeout(setupEventSource, 3000); // Reconnect after 3 seconds
        };
      }
    };

    setupEventSource();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user, dispatch]);

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={!user ? <Login /> : <Layout />}>
          <Route index element={<Feed />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:userId" element={<ChatBox />} />
          <Route path="connections" element={<Connections />} />
          <Route path="discover" element={<Discover />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:profileId" element={<Profile />} />
          <Route path="create-post" element={<CreatePost />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
