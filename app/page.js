"use client";

import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {
  SignedIn,
  SignInButton,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { collection, doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "@/firebase";
// import { useChat } from 'ai/react';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "model",
      parts: [
        {
          text: "Hi! I'm your personalized Arabic learning assistant. Are you ready to learn today?",
        },
      ],
    },
  ]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {isSignedIn, user} = useUser()

  const saveMessages = async () => {
    try {
      const userDocRef = doc(collection(db, "users"), user.id);
      const userDocSnap = await getDoc(userDocRef);

      const batch = writeBatch(db);

      if (userDocSnap.exists()) {
        // const userData = userDocSnap.data();
        // const updatedSets = userData.message_history;
        batch.update(userDocRef, { message_history: messages });
      } else {
        batch.set(userDocRef, { message_history: messages });
      }

      // const setDocRef = doc(collection(userDocRef, "flashcardSets"), setName);
      // batch.set(setDocRef, { flashcards });

      await batch.commit();

      // alert("Flashcards saved successfully!");
      // handleCloseDialog();
      // setSetName("");
      // router.push(`/flashcards`);

    } catch (error) {
      console.error("Error saving messages:", error);
      alert("An error occurred while saving messages. Please try again.");
    }
   };

  const getMessageHistory = async () => {
    try {
      const userDocRef = doc(collection(db, "users"), user.id);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setMessages(userData.message_history)
      }
    } catch (error) {
      console.error("Error getting message history:", error);
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);
    setMessage("");
    setMessages((messages) => [
      ...messages,
      { role: "user", parts: [{ text: message }] },
      { role: "model", parts: [{ text: "" }] },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          { role: "user", parts: [{ text: message }] },
          ...messages,
        ]),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            {
              ...lastMessage,
              parts: [{ text: lastMessage.parts[0]?.text + text }],
            },
          ];
        });
      }

      // save messages if signed in
      // if (SignedIn) {
      //   saveMessages()
      // }
    } catch (error) {
      console.error("Error:", error);
      setMessages((messages) => [
        ...messages,
        {
          role: "model",
          parts: [
            {
              text: "I'm sorry, but I encountered an error. Please try again later.",
            },
          ],
        },
      ]);
    }
    setIsLoading(false);
    console.log(messages)
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) return;
    // if (isSignedIn) getMessageHistory();

    scrollToBottom();
  }, [messages, user]);

  return (
    <Stack width="100vw" height="100vh" direction={"row"}>
      <Stack width="100%" height="100%" direction={"column"} p={6}>
        <Typography variant="h2">You're Arabic Tutor AI</Typography>
        <Typography variant="h5" paddingY={4}>
          Learn arabic daily by chatting with the AI to grow your vocabulary
          while using the putting it into practice.
        </Typography>

        <SignedOut>
          <Typography paddingY={2}>
            Log in to save history <i>(in Development)</i>
          </Typography>
          <SignInButton className="w-32">
            <Button variant="contained" size="large">
              Sign In
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Stack direction={"row"}>
            {user && (
              <Typography paddingRight={1}>
                Logged in as {user.fullName}
              </Typography>
            )}
            <UserButton />
          </Stack>
        </SignedIn>
      </Stack>
      <Box
        width="100%"
        height="100%"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <Stack
          direction={"column"}
          width="500px"
          height="700px"
          border="1px solid black"
          p={2}
          spacing={3}
        >
          <Stack
            direction={"column"}
            spacing={2}
            flexGrow={1}
            overflow="auto"
            maxHeight="100%"
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent={
                  message.role === "model" ? "flex-start" : "flex-end"
                }
              >
                <Box
                  bgcolor={
                    message.role === "model" ? "primary.main" : "secondary.main"
                  }
                  color="white"
                  borderRadius={16}
                  p={3}
                >
                  {message.parts[0]?.text}
                </Box>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Stack>
          <Stack direction={"row"} spacing={2}>
            <TextField
              label="Message"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <Button
              variant="contained"
              onClick={sendMessage}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}
