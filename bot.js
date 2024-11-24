const puppeteer = require('puppeteer');

// Custom sleep function to simulate delays
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to simulate realistic cursor movement
const moveCursor = async (page, currentPosition, x, y, steps = 10) => {
  const deltaX = (x - currentPosition.x) / steps;
  const deltaY = (y - currentPosition.y) / steps;
  for (let i = 0; i < steps; i++) {
    const newX = currentPosition.x + deltaX * i;
    const newY = currentPosition.y + deltaY * i;
    await page.mouse.move(newX, newY);
    await sleep(50); // Short pause for smoother movement
  }
  await page.mouse.move(x, y); // Final position
  currentPosition.x = x;
  currentPosition.y = y;
};

async function simulateBotSession(sessionNumber) {
  console.log(`Starting session ${sessionNumber}...`);

  // Launch browser
  const browser = await puppeteer.launch({
    headless: false, // Set to false to visualize the bot's actions
    defaultViewport: null, // Use full screen
    args: ['--start-maximized'], // Start in maximized mode
  });

  const page = await browser.newPage();

  // Navigate to your website
  const websiteUrl = 'http://localhost:5173/'; // Replace with your actual website's URL
  await page.goto(websiteUrl, { waitUntil: 'networkidle2' });

  // Initialize current mouse position
  let currentMousePosition = { x: 500, y: 300 }; // Start at the center of the screen

  // Simulate field filling
  const fillFields = async () => {
    console.log(`Session ${sessionNumber}: Simulating field filling...`);
    try {
      // Focus and fill "Full Name"
      await page.focus('input#fullName'); // Replace with the actual ID or selector of the Full Name field
      const fullName = `Bot John Doe ${sessionNumber}`; // Include session number for uniqueness
      for (const char of fullName) {
        await page.keyboard.type(char, { delay: Math.random() * 200 }); // Random typing delay
        await sleep(50);
      }

      // Focus and fill "Email Address"
      await page.focus('input#email'); // Replace with the actual ID or selector of the Email field
      const email = `bot.johndoe${sessionNumber}@example.com`; // Include session number for uniqueness
      for (const char of email) {
        await page.keyboard.type(char, { delay: Math.random() * 200 }); // Random typing delay
        await sleep(50);
      }

      // Focus and fill "Password"
      await page.focus('input#password'); // Replace with the actual ID or selector of the Password field
      const password = `BotPassword${sessionNumber}`;
      for (const char of password) {
        await page.keyboard.type(char, { delay: Math.random() * 200 }); // Random typing delay
        await sleep(50);
      }
    } catch (err) {
      console.error(`Session ${sessionNumber}: Error during field filling simulation:`, err.message);
    }
  };

  // Simulate mouse movements
  const simulateMouseMovements = async () => {
    console.log(`Session ${sessionNumber}: Simulating mouse movements...`);
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * 1000);
      const y = Math.floor(Math.random() * 700);
      await moveCursor(page, currentMousePosition, x, y, Math.floor(Math.random() * 15 + 5)); // Random steps for smoother movements
      await sleep(300);
    }
  };

  // Simulate mouse clicks
  const simulateMouseClicks = async () => {
    console.log(`Session ${sessionNumber}: Simulating mouse clicks...`);
    const buttonSelector = 'button[type="submit"]'; // Replace with the actual selector of the submit button
    try {
      await page.click(buttonSelector);
      console.log(`Session ${sessionNumber}: Submit button clicked.`);
    } catch (err) {
      console.error(`Session ${sessionNumber}: Error clicking submit button:`, err.message);
    }
  };

  // Simulate bot session
  const simulateSession = async () => {
    await simulateMouseMovements();
    await fillFields();
    await simulateMouseClicks();
  };

  await simulateSession();

  console.log(`Session ${sessionNumber} completed.`);
  await browser.close();
}

async function runMultipleSessions(n) {
  for (let i = 1; i <= n; i++) {
    try {
      await simulateBotSession(i); // Wait for each session to complete before starting the next
      console.log(`Session ${i} completed successfully.`);
    } catch (err) {
      console.error(`Error during session ${i}:`, err.message);
    }
  }
  console.log(`All ${n} sessions completed.`);
}

// Run 10 sessions sequentially (modify this number as needed)
const numberOfSessions = 27;
runMultipleSessions(numberOfSessions).catch((err) => {
  console.error('Error running multiple bot sessions:', err.message);
});
