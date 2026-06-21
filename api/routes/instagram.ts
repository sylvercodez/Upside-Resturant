import express from "express";

export const instagramRouter = express.Router();

function getAppUrl(req: any): string {
  const host = req.get("host") || "";
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return `http://${host}`;
  }
  const protocol = req.headers["x-forwarded-proto"] === "https" || req.secure ? "https" : "http";
  return `${protocol}://${host}`;
}

instagramRouter.get("/auth-url", (req, res) => {
  const clientId = process.env.INSTAGRAM_CLIENT_ID || "";
  const appUrl = getAppUrl(req);
  const redirectUri = `${appUrl}/api/instagram/callback`;

  if (!clientId) {
    return res.status(400).json({ 
      error: "INSTAGRAM_CLIENT_ID is not configured in the server environment secrets." 
    });
  }

  const scope = "user_profile,user_media";
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
  
  res.json({ url: authUrl, redirectUri });
});

instagramRouter.get("/callback", async (req: any, res: any) => {
  const { code, error, error_reason, error_description } = req.query;

  if (error || !code) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Instagram Authorization Failed</title>
        <style>
          body {
            background-color: #0c0a09;
            color: #f5f5f4;
            font-family: ui-sans-serif, system-ui, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
          }
          .card {
            background-color: #1c1917;
            border: 1px solid #444;
            padding: 32px;
            max-width: 450px;
            text-align: center;
          }
          h1 { color: #ef4444; font-size: 20px; margin-top: 0; }
          p { color: #a8a29e; font-size: 13px; line-height: 1.6; }
          button {
            background-color: #ef4444;
            color: #fff;
            border: none;
            padding: 10px 20px;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 0.1em;
            cursor: pointer;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Authorization Canceled or Failed</h1>
          <p>${error_description || error_reason || "You declined permissions or the Instagram API encountered an issue."}</p>
          <button onclick="window.close()">Close Window</button>
        </div>
      </body>
      </html>
    `);
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID || "";
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || "";
  const appUrl = process.env.APP_URL || getAppUrl(req);
  const redirectUri = `${appUrl}/api/instagram/callback`;

  if (!clientId || !clientSecret) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Configuration Required</title>
        <style>
          body { background-color: #0c0a09; color: #f5f5f4; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background-color: #1c1917; border: 1px solid #444; padding: 32px; max-width: 450px; text-align: center; }
          h1 { color: #f59e0b; font-size: 20px; margin-top: 0; }
          p { color: #a8a29e; font-size: 13px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Keys Not Found</h1>
          <p>Please add INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET to the environment variables in your AI Studio panel to support token exchanges.</p>
          <button onclick="window.close()" style="background-color: #d97706; color: white; border: none; padding: 10px 20px; font-size: 11px; text-transform: uppercase; font-weight: bold; cursor: pointer; margin-top: 20px;">Dismiss</button>
        </div>
      </body>
      </html>
    `);
  }

  try {
    const tokenForm = new URLSearchParams();
    tokenForm.append("client_id", clientId);
    tokenForm.append("client_secret", clientSecret);
    tokenForm.append("grant_type", "authorization_code");
    tokenForm.append("redirect_uri", redirectUri);
    tokenForm.append("code", String(code));

    const shortTokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: tokenForm,
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    if (!shortTokenRes.ok) {
      const errBody = await shortTokenRes.json().catch(() => ({}));
      throw new Error(errBody.error_message || `Short-lived token response status ${shortTokenRes.status}`);
    }

    const shortTokenData = await shortTokenRes.json();
    const shortLivedToken = shortTokenData.access_token;

    const longTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`;
    const longTokenRes = await fetch(longTokenUrl);
    
    if (!longTokenRes.ok) {
      const errBody = await longTokenRes.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `Long-lived token response status ${longTokenRes.status}`);
    }

    const longTokenData = await longTokenRes.json();
    const longLivedToken = longTokenData.access_token;

    const userProfileUrl = `https://graph.instagram.com/me?fields=username&access_token=${longLivedToken}`;
    const userProfileRes = await fetch(userProfileUrl);
    let username = "Premium User";
    
    if (userProfileRes.ok) {
      const profileData = await userProfileRes.json();
      username = profileData.username || username;
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Success!</title>
        <style>
          body {
            background-color: #0c0a09;
            color: #f5f5f4;
            font-family: ui-sans-serif, system-ui, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .spinner {
            border: 3px solid rgba(255,191,0,0.1);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border-left-color: #d97706;
            animation: spin 1s linear infinite;
            margin-bottom: 24px;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h1 { color: #f59e0b; font-size: 20px; font-weight: 300; margin: 0 0 8px 0; letter-spacing: 0.05em; }
          p { color: #a8a29e; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="spinner"></div>
        <h1>Instagram Connected</h1>
        <p>Syncing details with your administrator workspace...</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: "INSTAGRAM_AUTH_SUCCESS",
              accessToken: "${longLivedToken}",
              username: "${username}"
            }, "*");
            setTimeout(() => {
              window.close();
            }, 1000);
          } else {
            document.querySelector('p').innerText = "Authorization successful. You can close this tab now.";
          }
        </script>
      </body>
      </html>
    `);

  } catch (error: any) {
    console.error("AccessToken exchange failure:", error);
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Token Exchange Failed</title>
        <style>
          body { background-color: #0c0a09; color: #f5f5f4; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background-color: #1c1917; border: 1px solid #444; padding: 32px; max-width: 450px; text-align: center; }
          h1 { color: #ef4444; font-size: 20px; margin-top: 0; }
          p { color: #a8a29e; font-size: 13px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Token Handshake Failed</h1>
          <p>${error?.message || "An error occurred while securing your authorization tokens from Facebook."}</p>
          <button onclick="window.close()" style="background-color: #ef4444; color: white; border: none; padding: 10px 20px; font-size: 11px; text-transform: uppercase; font-weight: bold; cursor: pointer; margin-top: 20px;">Dismiss</button>
        </div>
      </body>
      </html>
    `);
  }
});
