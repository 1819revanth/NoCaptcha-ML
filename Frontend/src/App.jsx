import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import LoginSuccess from "./LoginSuccess";

const App = () => {
  const navigate = useNavigate();

  // State for interaction data
  const [interactionData, setInteractionData] = useState([]);
  const [responseTime, setResponseTime] = useState(null);

  // Mouse stats state
  const [mouseStats, setMouseStats] = useState({
    Mouse_Path_Length: 0,
    Mouse_Avg_Speed: 0,
    Mouse_Max_Speed: 0,
    Mouse_Stops: 0,
    Mouse_Click_Frequency: 0,
    Mouse_Scroll_Speed: 0,
    Mouse_Scroll_Direction_Changes: 0,
    Avg_Click_X: 0,
    Avg_Click_Y: 0,
    Click_Spread: 0,
  });

  // Keyboard stats state
  const [keyboardStats, setKeyboardStats] = useState({
    Typing_Speed: 0,
    Keypress_Interval_Avg: 0,
    Key_Hold_Duration_Avg: 0,
    Special_Key_Usage: 0,
    Error_Corrections: 0,
    Pause_Between_Typing: 0,
  });

  // State to indicate bot or human interaction
  const [isBot, setIsBot] = useState(1); // Default to human (0)

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

    const TRACKING_INTERVAL = 7000; // Log data every 5 seconds

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
        setKeyboardStats((prev) => ({
          ...prev,
          Error_Corrections: prev.Error_Corrections + 1,
        }));
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

      const avgClickX = clickPositions.length
        ? clickPositions.reduce((sum, pos) => sum + pos.x, 0) / clickPositions.length
        : 0;
      const avgClickY = clickPositions.length
        ? clickPositions.reduce((sum, pos) => sum + pos.y, 0) / clickPositions.length
        : 0;
      const clickSpread =
        clickPositions.length > 1
          ? clickPositions.reduce((sum, pos, idx, arr) => {
              if (idx === 0) return sum;
              const prev = arr[idx - 1];
              const dx = pos.x - prev.x;
              const dy = pos.y - prev.y;
              return sum + Math.sqrt(dx ** 2 + dy ** 2);
            }, 0) / (clickPositions.length - 1)
          : 0;

      const avgKeypressInterval = keypressTimes.length > 1
        ? keypressTimes.reduce((a, b) => a + b, 0) / keypressTimes.length
        : 0;

      const avgKeyHoldDuration = keypressTimes.length
        ? keypressTimes.reduce((a, b) => a + b, 0) / keypressTimes.length
        : 0;

      const combinedData = {
        Mouse_Path_Length: parseFloat(totalDistance || 0),
        Mouse_Avg_Speed: parseFloat(totalDistance / duration || 0),
        Mouse_Max_Speed: parseFloat(maxSpeed || 0),
        Mouse_Stops: parseInt(stops || 0),
        Mouse_Click_Frequency: parseFloat(totalClicks / duration || 0),
        Mouse_Scroll_Speed: parseFloat(totalScrollDistance / duration || 0),
        Mouse_Scroll_Direction_Changes: parseInt(scrollDirectionChanges || 0),
        Avg_Click_X: parseFloat(avgClickX || 0),
        Avg_Click_Y: parseFloat(avgClickY || 0),
        Click_Spread: parseFloat(clickSpread || 0),
        Typing_Speed: parseFloat(typingCount / duration || 0),
        Keypress_Interval_Avg: parseFloat(avgKeypressInterval || 0),
        Key_Hold_Duration_Avg: parseFloat(avgKeyHoldDuration || 0),
        Special_Key_Usage: parseInt(specialKeyCount || 0),
        Error_Corrections: parseInt(keyboardStats.Error_Corrections || 0),
        Pause_Between_Typing: parseFloat(
          keypressTimes.length > 1
            ? Math.max(...keypressTimes) - Math.min(...keypressTimes)
            : 0
        ),
        Interaction_Duration: parseFloat(duration || 0),
        Mouse_Keyboard_Interaction_Correlation: parseFloat(0.8),
        Response_Time: parseFloat(responseTime || 0),
        Result: isBot, // Add the result indicating bot or human
      };

      console.log("Payload sent to backend:", combinedData);

      try {
        const response = await fetch("https://nocaptch-final.onrender.com/api/interaction", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(combinedData),
        });

        if (!response.ok) {
          console.error("Failed to send data:", response.statusText);
        } else {
          console.log("Data sent successfully!");
        }
      } catch (error) {
        console.error("Error sending data:", error);
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
  }, [isBot]); // Trigger re-run if isBot changes

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/login-success");
  };

  return (
    <div>
      <div className="bg-gray-100 flex items-center justify-center h-screen">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
          <div className="flex justify-center mb-6">
            <span className="inline-block bg-gray-200 rounded-full p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4"
                />
              </svg>
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-center mb-4">Create a new account</h2>
          <p className="text-gray-600 text-center mb-6">Enter your details to register.</p>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="fullName"
                className="block text-gray-700 text-sm font-semibold mb-2"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                className="form-input w-full px-4 py-2 border rounded-lg text-gray-700 focus:ring-blue-500"
                required
                placeholder="James Brown"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-gray-700 text-sm font-semibold mb-2"
              >
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                className="form-input w-full px-4 py-2 border rounded-lg text-gray-700 focus:ring-blue-500"
                required
                placeholder="hello@alignui.com"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-gray-700 text-sm font-semibold mb-2"
              >
                Password *
              </label>
              <input
                type="password"
                id="password"
                className="form-input w-full px-4 py-2 border rounded-lg text-gray-700 focus:ring-blue-500"
                required
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Register
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const AppWrapper = () => (
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login-success" element={<LoginSuccess />} />
    </Routes>
  </Router>
);

export default AppWrapper;
