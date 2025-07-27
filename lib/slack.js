const { WebClient } = require("@slack/web-api");

const sendSlack = async (notification) => {
  const token = process.env.SLACK_BOT_TOKEN;
  const web = new WebClient(token);

  return new Promise((resolve, reject) => {
    web.chat
      .postMessage({
        channel: "C03BS8PAXEG",
        text: notification,
      })
      .then((result) => {
        console.log("Slack notification sent successfully");
        resolve();
      })
      .catch((error) => {
        console.log("Error sending error Slack notification:", error);
        reject(error);
      });
  });
};

module.exports = { sendSlack };
