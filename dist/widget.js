(function () {
  const script = document.currentScript;
  const hotelSlug = script?.getAttribute("data-hotel") || "villa-aurora-demo";

  const baseUrl = "https://booking-ai-site.vercel.app";
  const widgetUrl = `${baseUrl}/${hotelSlug}?widget=true`;

  const style = document.createElement("style");
  style.innerHTML = `
    #bookingai-widget-button {
      position: fixed;
      right: 22px;
      bottom: 22px;
      z-index: 999999;
      width: 64px;
      height: 64px;
      border-radius: 999px;
      border: none;
      background: #facc15;
      color: #020617;
      font-size: 28px;
      cursor: pointer;
      box-shadow: 0 20px 45px rgba(0,0,0,.35);
      font-weight: 900;
    }

    #bookingai-widget-frame {
      position: fixed;
      right: 22px;
      bottom: 100px;
      z-index: 999999;
      width: 390px;
      height: 640px;
      max-width: calc(100vw - 24px);
      max-height: calc(100vh - 120px);
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 26px;
      overflow: hidden;
      box-shadow: 0 30px 80px rgba(0,0,0,.45);
      display: none;
      background: white;
    }

    #bookingai-widget-frame iframe {
      width: 100%;
      height: 100%;
      border: 0;
    }

    @media (max-width: 520px) {
      #bookingai-widget-frame {
        right: 12px;
        bottom: 90px;
        width: calc(100vw - 24px);
        height: calc(100vh - 120px);
      }

      #bookingai-widget-button {
        right: 16px;
        bottom: 16px;
      }
    }
  `;

  document.head.appendChild(style);

  const frame = document.createElement("div");
  frame.id = "bookingai-widget-frame";
  frame.innerHTML = `<iframe src="${widgetUrl}" title="AI Receptionist"></iframe>`;

  const button = document.createElement("button");
  button.id = "bookingai-widget-button";
  button.innerHTML = "💬";

  let open = false;

  button.onclick = function () {
    open = !open;
    frame.style.display = open ? "block" : "none";
    button.innerHTML = open ? "×" : "💬";
  };

  document.body.appendChild(frame);
  document.body.appendChild(button);
})();