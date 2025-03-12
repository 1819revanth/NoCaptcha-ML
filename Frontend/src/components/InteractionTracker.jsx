import React, { useEffect, useState } from "react";

const InteractionTracker = ({ onInteractionData}) => {
  // State for interaction data
  const [responseTime, setResponseTime] = useState(null);
  const [isBot, setIsBot] = useState(0); // Default to human (0)

  useEffect(() => {
    let interactionStartTime = Date.now();
    let pageLoadTime = Date.now();
    let firstInteraction = false;

    // Mouse tracking variables
    let lastMousePosition = null;
    let lastMouseTime = null;
    let totalDistance = 0;
    let maxSpeed = 0;
    let stops = 0;
    let totalClicks = 0;
    let clickPositions = [];
    let totalScrollDistance = 0;
    let scrollDirectionChanges = 0;
    let lastScrollDirection = null;

    // Keyboard tracking variables
    let typingCount = 0;
    let keypressTimes = [];
    let keyHoldStartTimes = {};
    let specialKeyCount = 0;

    const TRACKING_INTERVAL = 5000; // Log data every 5 seconds

    const handleMouseMove = (event) => {
      const currentPosition = { x: event.clientX, y: event.clientY };
      const currentTime = Date.now();

      if (lastMousePosition) {
        const dx = currentPosition.x - lastMousePosition.x;
        const dy = currentPosition.y - lastMousePosition.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);
        totalDistance += distance;

        if (lastMouseTime) {
          const timeDiff = currentTime - lastMouseTime;
          const speed = distance / timeDiff;
          maxSpeed = Math.max(maxSpeed, speed);

          if (distance < 2) {
            stops += 1;
          }
        }
      }

      lastMousePosition = currentPosition;
      lastMouseTime = currentTime;

      if (!firstInteraction) {
        setResponseTime((currentTime - pageLoadTime) / 1000);
        firstInteraction = true;
      }
    };

    const handleMouseDown = (event) => {
      totalClicks += 1;
      clickPositions.push({ x: event.clientX, y: event.clientY });
    };

    const handleScroll = (event) => {
      const currentDirection = event.deltaY > 0 ? "down" : "up";
      if (lastScrollDirection && currentDirection !== lastScrollDirection) {
        scrollDirectionChanges += 1;
      }
      totalScrollDistance += Math.abs(event.deltaY);
      lastScrollDirection = currentDirection;
    };

    const handleKeyDown = (event) => {
      if (["Backspace", "Delete"].includes(event.key)) {
        // Error corrections (optional for your use case)
      }

      if (["Backspace", "Delete", "Shift"].includes(event.key)) {
        specialKeyCount += 1;
      }

      if (!keyHoldStartTimes[event.key]) {
        keyHoldStartTimes[event.key] = Date.now();
      }
    };

    const handleKeyUp = (event) => {
      const keyHoldEndTime = Date.now();
      if (keyHoldStartTimes[event.key]) {
        const duration = keyHoldEndTime - keyHoldStartTimes[event.key];
        keypressTimes.push(duration);
        delete keyHoldStartTimes[event.key];
      }
      typingCount += 1;
    };

    const logData = async () => {
      const currentTime = Date.now();
      const duration = (currentTime - interactionStartTime) / 1000;

      const interactionData = {
        Mouse_Path_Length: totalDistance,
        Mouse_Avg_Speed: totalDistance / duration,
        Mouse_Max_Speed: maxSpeed,
        Mouse_Stops: stops,
        Mouse_Click_Frequency: totalClicks / duration,
        Mouse_Scroll_Speed: totalScrollDistance / duration,
        Mouse_Scroll_Direction_Changes: scrollDirectionChanges,
        Avg_Click_X:
          clickPositions.length > 0
            ? clickPositions.reduce((sum, pos) => sum + pos.x, 0) / clickPositions.length
            : 0,
        Avg_Click_Y:
          clickPositions.length > 0
            ? clickPositions.reduce((sum, pos) => sum + pos.y, 0) / clickPositions.length
            : 0,
        Typing_Speed: typingCount / duration,
        Special_Key_Usage: specialKeyCount,
        Response_Time: responseTime,
        Result: isBot, // Add the result indicating bot or human
      };

      console.log("Interaction Data:", interactionData);

        try {
          const response = await fetch("https://nocaptch-final.onrender.com/api/interaction", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(interactionData),
          });

          if (!response.ok) {
            console.error("Failed to send data to backend:", response.statusText);
          }
        } catch (error) {
          console.error("Error sending data to backend:", error);
        }

      if (onInteractionData) {
        onInteractionData(interactionData);
      }

      totalDistance = 0;
      maxSpeed = 0;
      stops = 0;
      totalClicks = 0;
      clickPositions = [];
      totalScrollDistance = 0;
      scrollDirectionChanges = 0;
      typingCount = 0;
      keypressTimes = [];
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("wheel", handleScroll);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    const intervalId = setInterval(logData, TRACKING_INTERVAL);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("wheel", handleScroll);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      clearInterval(intervalId);
    };
  }, [isBot]);

  return null; // This is a utility component, so no visible UI.
};

export default InteractionTracker;